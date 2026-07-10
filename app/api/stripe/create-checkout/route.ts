import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // userId comes from the authenticated Clerk session only — never from the
    // request body — so a caller can't attribute a checkout to another account.
    const { priceId } = await request.json()
    console.log('Checkout API called with:', { priceId, userId })

    if (!priceId) {
      return NextResponse.json({ error: 'Missing priceId' }, { status: 400 })
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
    return NextResponse.json({ error: 'Could not start checkout. Please try again.' }, { status: 500 })
  }
}
