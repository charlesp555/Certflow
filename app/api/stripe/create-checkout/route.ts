import Stripe from 'stripe'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  try {
    const { priceId, userId } = await request.json()
    console.log('[Stripe API] Received priceId:', priceId, '| userId:', userId)

    if (!priceId || !userId) {
      return NextResponse.json({ error: 'Missing priceId or userId' }, { status: 400 })
    }

    const successUrl = process.env.NEXT_PUBLIC_APP_URL + '/dashboard?upgraded=true'
    const cancelUrl = process.env.NEXT_PUBLIC_APP_URL + '/pricing'
    console.log('[Stripe API] success_url:', successUrl, '| cancel_url:', cancelUrl)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      metadata: { userId },
    })

    console.log('[Stripe API] Session created:', session.id, '| url:', session.url)
    return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Stripe API] Error creating session:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
