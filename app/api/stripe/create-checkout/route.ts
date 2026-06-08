import Stripe from 'stripe'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  try {
    const { priceId, userId } = await request.json()

    if (!priceId || !userId) {
      return NextResponse.json({ error: 'Missing priceId or userId' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: process.env.NEXT_PUBLIC_APP_URL + '/dashboard?upgraded=true',
      cancel_url: process.env.NEXT_PUBLIC_APP_URL + '/pricing',
      client_reference_id: userId,
      metadata: { userId },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
