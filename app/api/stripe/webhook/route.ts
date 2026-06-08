import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items.data.price.product'],
    })

    const product = fullSession.line_items?.data[0]?.price?.product as Stripe.Product | undefined
    const planName = product?.name?.toLowerCase() ?? 'starter'

    const userId = session.metadata?.userId
    if (userId) {
      await supabaseAdmin
        .from('users')
        .upsert({ clerk_user_id: userId, plan: planName }, { onConflict: 'clerk_user_id' })
    }
  }

  return NextResponse.json({ received: true })
}
