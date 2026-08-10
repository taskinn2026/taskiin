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
    const { bookingId, amount, successUrl, failureUrl, webhookEndpoint } = await req.json()
    const CHARGILY_SECRET_KEY = Deno.env.get('CHARGILY_SECRET_KEY')

    if (!CHARGILY_SECRET_KEY) {
      throw new Error('CHARGILY_SECRET_KEY is not set in Edge Function secrets')
    }

    const payload = {
        amount: amount, // DZD
        currency: 'dzd',
        payment_method: 'edahabia',
        success_url: successUrl,
        failure_url: failureUrl,
        webhook_endpoint: webhookEndpoint, // Pass the webhook edge function URL
        metadata: [
            { booking_id: bookingId }
        ]
    }

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
        console.error('Chargily API Error:', errorText)
        throw new Error(`Chargily API Error: ${response.status}`)
    }

    const data = await response.json()

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
