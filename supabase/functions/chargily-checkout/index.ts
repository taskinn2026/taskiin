import { serve } from "https://deno.land/std@0.192.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { bookingId, amount, successUrl, failureUrl, webhookEndpoint, customerName, customerEmail, customerPhone } = await req.json()
    const CHARGILY_SECRET_KEY = Deno.env.get('CHARGILY_SECRET_KEY')

    console.log('Received payload:', { bookingId, amount, successUrl, failureUrl, webhookEndpoint })

    if (!CHARGILY_SECRET_KEY) {
      throw new Error('CHARGILY_SECRET_KEY is not set in Edge Function secrets')
    }

    // Chargily v2 requires amount to be an integer (e.g., 5000) and >= 100
    const finalAmount = Math.round(Number(amount));
    if (finalAmount < 100) {
        throw new Error(`Amount must be at least 100 DZD. Received: ${finalAmount}`);
    }

    // 1. Create a Customer in Chargily to auto-fill the checkout page
    let customerId = undefined;
    try {
        const custRes = await fetch('https://pay.chargily.net/test/api/v2/customers', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CHARGILY_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: customerName || 'Guest User',
                email: customerEmail || 'guest@taskiin.com',
                phone: customerPhone || undefined
            })
        });

        if (custRes.ok) {
            const custData = await custRes.json();
            customerId = custData.id;
            console.log('Customer created successfully:', customerId);
        } else {
            console.error('Failed to create customer:', await custRes.text());
            // Proceed without customer_id if it fails (so payment is not blocked)
        }
    } catch (custError) {
        console.error('Error creating customer:', custError);
    }

    // 2. Prepare Checkout Payload
    const payload: any = {
        amount: finalAmount, // DZD
        currency: 'dzd',
        payment_method: 'edahabia',
        success_url: successUrl,
        failure_url: failureUrl,
        webhook_endpoint: webhookEndpoint, 
        metadata: [
            { booking_id: bookingId }
        ]
    };

    if (customerId) {
        payload.customer_id = customerId;
    }

    console.log('Sending to Chargily:', payload);

    const response = await fetch('https://pay.chargily.net/test/api/v2/checkouts', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${CHARGILY_SECRET_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('Chargily API Error Response:', errorText)
        throw new Error(`Chargily API Error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Chargily Checkout Created:', data.id);

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Edge Function Caught Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
