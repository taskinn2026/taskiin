import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Node built-in modules are available via node: prefix in Deno (if compat is enabled) or using subtle crypto.
// For simplicity in this example and to avoid Deno standard library import issues with crypto in edge functions, 
// we will verify the secret in a slightly more tolerant way, but ideally use Web Crypto API for HMAC SHA256.
// Chargily sends the signature in the "signature" header.

async function verifySignature(payload: string, signature: string, secret: string) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const hexMac = Array.from(new Uint8Array(mac))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    
    return hexMac === signature;
}

serve(async (req) => {
  try {
    const signature = req.headers.get('signature') || req.headers.get('Signature')
    const CHARGILY_SECRET_KEY = Deno.env.get('CHARGILY_SECRET_KEY')

    if (!CHARGILY_SECRET_KEY || !signature) {
      return new Response('Unauthorized - Missing Secret or Signature', { status: 401 })
    }

    const bodyText = await req.text()
    
    // Verify signature
    const isValid = await verifySignature(bodyText, signature, CHARGILY_SECRET_KEY)

    if (!isValid) {
      console.error('Signature mismatch')
      return new Response('Invalid signature', { status: 400 })
    }

    const payload = JSON.parse(bodyText)
    
    // Process the webhook payload (e.g. checkout.paid event)
    if (payload.type === 'checkout.paid') {
      const checkoutData = payload.data
      const metadata = checkoutData.metadata || []
      const bookingMeta = metadata.find((m: any) => m.booking_id)
      
      if (bookingMeta && bookingMeta.booking_id) {
         // Update Supabase Database
         // We use the SERVICE_ROLE_KEY to bypass RLS because this is a server-to-server webhook
         const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
         )

         // Update booking status
         const { error: updateError } = await supabase
            .from('bookings')
            .update({ status: 'paid', deposit_paid: true })
            .eq('id', bookingMeta.booking_id)

         if (updateError) {
             console.error('Error updating booking:', updateError)
             throw updateError
         }

         // Insert payment record
         const { error: insertError } = await supabase
            .from('payments')
            .insert({
                booking_id: bookingMeta.booking_id,
                amount: checkoutData.amount,
                status: 'completed',
                payment_method: 'chargily',
                payment_type: 'deposit'
            })

         if (insertError) {
             console.error('Error inserting payment:', insertError)
             throw insertError
         }
      }
    }

    return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('Webhook Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400 }
    )
  }
})
