'use client'

import { Check, Shield } from 'lucide-react'
import Sidebar from '../components/Sidebar'

// ─── Stripe Payment Links ──────────────────────────────────────────────────────
const PAYMENT_LINKS = {
  starter:  'https://buy.stripe.com/test_6oU6oH0yy69Z6PX7iTdMI02',
  pro:      'https://buy.stripe.com/test_8x2dR9gxw8i7eip46HdMI01',
  business: 'https://buy.stripe.com/test_5kQ00jfts8i78Y58mXdMI00',
}

// ─── Plans ────────────────────────────────────────────────────────────────────

const PLANS = [
  {
    name: 'Starter',
    key: 'starter' as const,
    price: 49,
    cap: 'Up to 25 vendor COI reviews',
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
    key: 'pro' as const,
    price: 99,
    cap: 'Up to 100 vendor COI reviews',
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
    key: 'business' as const,
    price: 149,
    cap: 'Up to 250 vendor COI reviews',
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PricingPage() {
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
              <p style={{ fontSize: 16, color: '#8a8599', maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>
                No per-seat fees. No hidden charges. Choose the plan that fits your team.
              </p>
            </div>

            {/* Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 20 }}>
              {PLANS.map(plan => (
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
                      {plan.price}
                    </span>
                    <span style={{ fontSize: 14, color: '#8a8599', marginTop: 'auto', marginBottom: 8 }}>/mo</span>
                  </div>

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

                  <a
                    href={PAYMENT_LINKS[plan.key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block', textAlign: 'center',
                      background: plan.popular ? '#D97706' : 'transparent',
                      color: plan.popular ? '#fff' : '#f0ede8',
                      border: plan.popular ? 'none' : '1px solid #1e1e2e',
                      fontSize: 14, fontWeight: 700,
                      padding: '12px', borderRadius: 8,
                      textDecoration: 'none', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                      if (plan.popular) e.currentTarget.style.background = '#b45309'
                      else { e.currentTarget.style.borderColor = '#D97706'; e.currentTarget.style.color = '#D97706' }
                    }}
                    onMouseLeave={e => {
                      if (plan.popular) e.currentTarget.style.background = '#D97706'
                      else { e.currentTarget.style.borderColor = '#1e1e2e'; e.currentTarget.style.color = '#f0ede8' }
                    }}
                  >
                    Start Free Trial
                  </a>
                </div>
              ))}
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
