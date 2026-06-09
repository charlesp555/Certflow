'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Shield } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useUser } from '@clerk/nextjs'

// Price IDs are read from NEXT_PUBLIC_STRIPE_PRICE_* in .env.local
const PLANS = [
  {
    name: 'Starter',
    monthlyPrice: 49,
    annualPrice: 42,
    cap: 'Up to 25 vendor COI reviews',
    priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY ?? '',
    priceIdAnnual: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL ?? '',
    features: [
      'AI COI analysis',
      'Vendor database',
      'Basic reporting',
      'Email support',
    ],
    popular: false,
  },
  {
    name: 'Pro',
    monthlyPrice: 99,
    annualPrice: 84,
    cap: 'Up to 100 vendor COI reviews',
    priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY ?? '',
    priceIdAnnual: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL ?? '',
    features: [
      'Everything in Starter',
      'Expiration tracking',
      'Advanced reporting',
      'Priority support',
      'Export data',
    ],
    popular: true,
  },
  {
    name: 'Business',
    monthlyPrice: 199,
    annualPrice: 169,
    cap: 'Up to 250 vendor COI reviews',
    priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_MONTHLY ?? '',
    priceIdAnnual: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_ANNUAL ?? '',
    features: [
      'Everything in Pro',
      'Team access',
      'Custom requirements',
      'API access',
      'Dedicated support',
    ],
    popular: false,
  },
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const { user } = useUser()
  const router = useRouter()

  const handleStartTrial = async (plan: typeof PLANS[0]) => {
    if (!user) {
      router.push('/sign-in?redirect_url=/pricing')
      return
    }

    const priceId = annual ? plan.priceIdAnnual : plan.priceIdMonthly
    console.log('[Stripe] Starting checkout — plan:', plan.name, '| priceId:', priceId, '| userId:', user.id)

    setLoadingPlan(plan.name)
    setCheckoutError(null)

    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, userId: user.id }),
      })

      const data = await res.json()
      console.log('[Stripe] API response (status', res.status + '):', data)

      if (!res.ok || data.error) {
        const msg = data.error ?? `Request failed with status ${res.status}`
        console.error('[Stripe] Checkout error:', msg)
        setCheckoutError(msg)
        return
      }

      if (data.url) {
        console.log('[Stripe] Redirecting to:', data.url)
        window.location.href = data.url
      } else {
        console.error('[Stripe] No URL in response:', data)
        setCheckoutError('No checkout URL returned. Check your Stripe configuration.')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error'
      console.error('[Stripe] Fetch error:', msg)
      setCheckoutError(msg)
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0f', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <Sidebar />

      <main style={{ marginLeft: 240, flex: 1 }}>
        <section style={{ padding: 'clamp(48px,6vw,80px) 24px clamp(64px,8vw,96px)' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto' }}>

            {/* Heading */}
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(217,119,6,0.10)', border: '1px solid rgba(217,119,6,0.20)',
                borderRadius: 100, padding: '5px 14px', marginBottom: 20,
              }}>
                <Shield size={13} color="#D97706" />
                <span style={{ fontSize: 12, color: '#D97706', fontWeight: 600, letterSpacing: '0.5px' }}>Pricing</span>
              </div>
              <h1 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, letterSpacing: '-1.5px', color: '#f0ede8', margin: '0 0 14px', lineHeight: 1.1 }}>
                Simple, Transparent Pricing
              </h1>
              <p style={{ fontSize: 16, color: '#8a8599', maxWidth: 420, margin: '0 auto 32px', lineHeight: 1.6 }}>
                No per-seat fees. No hidden charges. Choose the plan that fits your team.
              </p>

              {/* Toggle */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: '#111118', border: '1px solid #1e1e2e', borderRadius: 100, padding: '4px' }}>
                <button
                  onClick={() => setAnnual(false)}
                  style={{
                    background: !annual ? '#1e1e2e' : 'transparent',
                    color: !annual ? '#f0ede8' : '#8a8599',
                    border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    padding: '6px 18px', borderRadius: 100, transition: 'all 0.2s',
                  }}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setAnnual(true)}
                  style={{
                    background: annual ? '#1e1e2e' : 'transparent',
                    color: annual ? '#f0ede8' : '#8a8599',
                    border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    padding: '6px 18px', borderRadius: 100, transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  Annual
                  <span style={{ background: '#D97706', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 100, padding: '2px 8px' }}>
                    Save 15%
                  </span>
                </button>
              </div>
            </div>

            {/* Checkout error */}
            {checkoutError && (
              <div style={{
                marginBottom: 24, padding: '12px 16px', borderRadius: 8,
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                fontSize: 13, color: '#fca5a5', textAlign: 'center',
              }}>
                {checkoutError}
              </div>
            )}

            {/* Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 20 }}>
              {PLANS.map(plan => {
                const isLoading = loadingPlan === plan.name
                return (
                  <div
                    key={plan.name}
                    style={{
                      background: '#111118',
                      border: plan.popular ? '2px solid #D97706' : '1px solid #1e1e2e',
                      borderRadius: 16, padding: '28px 28px',
                      display: 'flex', flexDirection: 'column',
                      position: 'relative', transition: 'transform 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    {plan.popular && (
                      <div style={{
                        position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                        background: '#D97706', color: '#fff', fontSize: 11, fontWeight: 700,
                        borderRadius: 100, padding: '4px 14px', whiteSpace: 'nowrap',
                      }}>
                        Most Popular
                      </div>
                    )}

                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#f0ede8', marginBottom: 4 }}>{plan.name}</div>
                      <div style={{ fontSize: 13, color: '#8a8599' }}>{plan.cap}</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 2, marginBottom: 6 }}>
                      <span style={{ fontSize: 20, fontWeight: 700, color: '#8a8599', marginTop: 8 }}>$</span>
                      <span style={{ fontSize: 48, fontWeight: 800, color: '#f0ede8', letterSpacing: '-2px', lineHeight: 1 }}>
                        {annual ? plan.annualPrice : plan.monthlyPrice}
                      </span>
                      <span style={{ fontSize: 14, color: '#8a8599', marginTop: 'auto', marginBottom: 8 }}>/mo</span>
                    </div>

                    {annual && (
                      <div style={{ fontSize: 12, color: '#D97706', marginBottom: 2 }}>
                        Billed annually — ${(annual ? plan.annualPrice : plan.monthlyPrice) * 12}/yr
                      </div>
                    )}

                    <div style={{ height: 1, background: '#1e1e2e', margin: '20px 0' }} />

                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                      {plan.features.map(f => (
                        <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#c4bfd8' }}>
                          <span style={{
                            width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                            background: plan.popular ? 'rgba(217,119,6,0.15)' : 'rgba(34,197,94,0.10)',
                            border: `1px solid ${plan.popular ? 'rgba(217,119,6,0.30)' : 'rgba(34,197,94,0.25)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Check size={10} color={plan.popular ? '#D97706' : '#22c55e'} strokeWidth={3} />
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleStartTrial(plan)}
                      disabled={isLoading}
                      style={{
                        display: 'block', width: '100%', textAlign: 'center',
                        background: plan.popular ? '#D97706' : 'transparent',
                        color: plan.popular ? '#fff' : '#f0ede8',
                        border: plan.popular ? 'none' : '1px solid #1e1e2e',
                        fontSize: 14, fontWeight: 700,
                        padding: '12px', borderRadius: 8,
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        opacity: isLoading ? 0.7 : 1,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        if (isLoading) return
                        if (plan.popular) e.currentTarget.style.background = '#b45309'
                        else { e.currentTarget.style.borderColor = '#D97706'; e.currentTarget.style.color = '#D97706' }
                      }}
                      onMouseLeave={e => {
                        if (isLoading) return
                        if (plan.popular) e.currentTarget.style.background = '#D97706'
                        else { e.currentTarget.style.borderColor = '#1e1e2e'; e.currentTarget.style.color = '#f0ede8' }
                      }}
                    >
                      {isLoading ? 'Loading…' : 'Start Free Trial'}
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Footer note */}
            <p style={{ textAlign: 'center', marginTop: 36, fontSize: 13, color: '#8a8599', lineHeight: 1.6 }}>
              All plans include a 14-day free trial. No credit card required.{' '}
              <a href="#" style={{ color: '#D97706', textDecoration: 'none' }}>Contact us</a> for enterprise pricing.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
