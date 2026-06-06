'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Bell, User, ChevronDown, CheckCircle2, Copy,
  RefreshCw, Building2, DollarSign, Zap,
  MessageSquare, HardDrive, Link2, Plus,
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { UserButton } from '@clerk/nextjs'

// ── Design tokens ─────────────────────────────────────────────────────────────

const T = {
  bg: '#0a0a0f',
  surface: '#0f0f17',
  card: '#13131f',
  border: '#1a1a2e',
  borderAccent: '#2a2a3e',
  orange: '#D97706',
  orangeHover: '#B45309',
  green: '#22c55e',
  primary: '#f8f8f8',
  secondary: '#8b8fa8',
  muted: '#4b5063',
}

// ── Category color map ────────────────────────────────────────────────────────

const CAT_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  'Property Management': { color: '#60a5fa', bg: 'rgba(96,165,250,0.10)',  border: 'rgba(96,165,250,0.22)'  },
  'Accounting':          { color: T.green,   bg: 'rgba(34,197,94,0.10)',   border: 'rgba(34,197,94,0.22)'   },
  'Automation':          { color: '#a78bfa', bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.22)' },
  'Notifications':       { color: T.orange,  bg: 'rgba(217,119,6,0.10)',   border: 'rgba(217,119,6,0.22)'   },
  'Storage':             { color: '#fbbf24', bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.22)'  },
}

// ── Integrations data ─────────────────────────────────────────────────────────

const INTEGRATIONS = [
  { name: 'Buildium',         desc: 'Sync vendor contacts and COI data automatically',          category: 'Property Management', icon: Building2    },
  { name: 'AppFolio',         desc: 'Import your vendor list and track compliance',              category: 'Property Management', icon: Building2    },
  { name: 'Yardi',            desc: 'Enterprise property management sync',                      category: 'Property Management', icon: Building2    },
  { name: 'QuickBooks',       desc: 'Sync vendor payment and contractor data',                  category: 'Accounting',          icon: DollarSign   },
  { name: 'Zapier',           desc: 'Connect Covira to 5,000+ apps and automate workflows',    category: 'Automation',          icon: Zap          },
  { name: 'Slack',            desc: 'Get compliance alerts and notifications in Slack',         category: 'Notifications',       icon: MessageSquare},
  { name: 'Google Drive',     desc: 'Auto-save COI documents to Drive folders',                category: 'Storage',             icon: HardDrive    },
  { name: 'Microsoft Teams',  desc: 'Receive alerts and reports in Teams channels',            category: 'Notifications',       icon: MessageSquare},
]

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 300,
      background: T.card, border: '1px solid rgba(34,197,94,0.30)',
      borderRadius: 10, padding: '12px 18px',
      display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
      transition: 'opacity 0.25s ease, transform 0.25s ease',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(-12px)',
      pointerEvents: 'none',
    }}>
      <CheckCircle2 size={16} color={T.green} />
      <span style={{ fontSize: 13, fontWeight: 600, color: T.primary }}>{message}</span>
    </div>
  )
}

// ── Integration Card ──────────────────────────────────────────────────────────

function IntegrationCard({
  name, desc, category, icon: Icon, onConnect,
}: {
  name: string
  desc: string
  category: string
  icon: React.ElementType
  onConnect: (name: string) => void
}) {
  const [hov, setHov] = useState(false)
  const cs = CAT_STYLE[category] ?? CAT_STYLE['Notifications']

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? '#161620' : T.card,
        border: `1px solid ${hov ? T.borderAccent : T.border}`,
        borderRadius: 12, padding: '20px',
        display: 'flex', flexDirection: 'column', gap: 12,
        transition: 'background 0.2s, border-color 0.2s, transform 0.2s, box-shadow 0.2s',
        transform: hov ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hov ? '0 8px 28px rgba(0,0,0,0.4)' : 'none',
        position: 'relative',
      }}
    >
      {/* Category pill — top right */}
      <div style={{ position: 'absolute', top: 14, right: 14 }}>
        <span style={{
          background: cs.bg, color: cs.color, border: `1px solid ${cs.border}`,
          borderRadius: 20, padding: '2px 9px', fontSize: 10, fontWeight: 700,
          whiteSpace: 'nowrap',
        }}>
          {category}
        </span>
      </div>

      {/* Icon */}
      <div style={{
        width: 42, height: 42, borderRadius: 10, flexShrink: 0,
        background: cs.bg, border: `1px solid ${cs.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={20} color={cs.color} strokeWidth={1.8} />
      </div>

      {/* Name + desc */}
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: '0 0 5px' }}>{name}</p>
        <p style={{ fontSize: 12, color: T.secondary, margin: 0, lineHeight: 1.55 }}>{desc}</p>
      </div>

      {/* Connect button */}
      <button
        onClick={() => onConnect(name)}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          background: hov ? T.orange : 'rgba(217,119,6,0.10)',
          color: hov ? '#fff' : T.orange,
          border: `1px solid ${hov ? T.orange : 'rgba(217,119,6,0.30)'}`,
          borderRadius: 8, padding: '9px 14px',
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = T.orangeHover; e.currentTarget.style.borderColor = T.orangeHover }}
        onMouseLeave={e => {
          e.currentTarget.style.background = hov ? T.orange : 'rgba(217,119,6,0.10)'
          e.currentTarget.style.borderColor = hov ? T.orange : 'rgba(217,119,6,0.30)'
        }}
      >
        <Link2 size={13} /> Connect
      </button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const [toastMsg,     setToastMsg]     = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [apiKeyShown,  setApiKeyShown]  = useState(false)
  const [waitlistForm, setWaitlistForm] = useState({ email: '', integration: '' })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToastMsg(msg)
    setToastVisible(true)
    timerRef.current = setTimeout(() => setToastVisible(false), 3200)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const API_KEY = 'cvr_live_sk_•••••••••••••••••••••••••••••••••'
  const API_KEY_REAL = 'cvr_live_sk_4f8a2b1e9c3d7f0e5a8b2c4d6e8f1a3b'

  const inputStyle: React.CSSProperties = {
    background: T.surface, border: `1px solid ${T.border}`,
    borderRadius: 8, padding: '9px 13px',
    fontSize: 13, color: T.primary, outline: 'none',
    fontFamily: 'Inter, sans-serif',
    transition: 'border-color 0.15s',
    width: '100%', boxSizing: 'border-box',
  }

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: T.bg, fontFamily: 'Inter, -apple-system, sans-serif',
      color: T.primary,
    }}>
      <Toast message={toastMsg} visible={toastVisible} />
      <Sidebar />

      <main style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* ── Header ── */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 40,
          background: T.bg, borderBottom: `1px solid ${T.border}`,
          height: 64, padding: '0 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: T.primary, margin: 0, lineHeight: 1.2 }}>
              Integrations
            </h1>
            <p style={{ fontSize: 12, color: T.secondary, margin: 0 }}>
              Connect Covira to your existing property management tools
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button style={{
              position: 'relative', background: 'none',
              border: `1px solid ${T.border}`, borderRadius: 8,
              width: 38, height: 38, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: T.secondary, transition: 'border-color 0.15s, color 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.orange; e.currentTarget.style.color = T.primary }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.secondary }}
            >
              <Bell size={17} />
              <span style={{
                position: 'absolute', top: 9, right: 9,
                width: 7, height: 7, borderRadius: '50%',
                background: T.orange, border: `2px solid ${T.bg}`,
              }} />
            </button>

            <UserButton />
          </div>
        </header>

        {/* ── Content ── */}
        <div style={{ padding: 28, flex: 1, display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* ── Connected section ── */}
          <section>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: T.primary, margin: '0 0 14px' }}>
              Connected{' '}
              <span style={{ fontSize: 13, color: T.muted, fontWeight: 500 }}>(0)</span>
            </h2>
            <div style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 12, padding: '36px 28px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 10, textAlign: 'center',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 11,
                background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 4,
              }}>
                <Link2 size={20} color={T.muted} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: T.primary, margin: 0 }}>
                No integrations connected yet
              </p>
              <p style={{ fontSize: 13, color: T.secondary, margin: 0, maxWidth: 420, lineHeight: 1.65 }}>
                Connect your property management software below to sync vendor data automatically.
              </p>
            </div>
          </section>

          {/* ── Available integrations ── */}
          <section>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: T.primary, margin: '0 0 14px' }}>
              Available Integrations
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 14,
            }}>
              {INTEGRATIONS.map(intg => (
                <IntegrationCard
                  key={intg.name}
                  name={intg.name}
                  desc={intg.desc}
                  category={intg.category}
                  icon={intg.icon}
                  onConnect={name => showToast(`Coming soon — join the waitlist to be notified`)}
                />
              ))}
            </div>
          </section>

          {/* ── API Access ── */}
          <section>
            <div style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: T.primary, margin: '0 0 4px' }}>
                API Access
              </h2>
              <p style={{ fontSize: 13, color: T.secondary, margin: 0 }}>
                Build custom integrations using the Covira API
              </p>
            </div>

            <div style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 12, padding: 24,
            }}>
              {/* API key row */}
              <div style={{ marginBottom: 20 }}>
                <p style={{
                  fontSize: 11, fontWeight: 600, color: T.muted,
                  textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px',
                }}>
                  Your API Key
                </p>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{
                    flex: 1, background: T.surface, border: `1px solid ${T.border}`,
                    borderRadius: 8, padding: '10px 14px',
                    fontFamily: 'monospace', fontSize: 13,
                    color: apiKeyShown ? T.primary : T.muted,
                    letterSpacing: apiKeyShown ? '0.02em' : '0.15em',
                    userSelect: apiKeyShown ? 'text' : 'none',
                    overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                    filter: apiKeyShown ? 'none' : 'blur(4px)',
                    transition: 'filter 0.2s',
                  }}>
                    {apiKeyShown ? API_KEY_REAL : API_KEY}
                  </div>
                  <button
                    onClick={() => {
                      if (!apiKeyShown) { setApiKeyShown(true); return }
                      navigator.clipboard?.writeText(API_KEY_REAL).catch(() => {})
                      showToast('API key copied')
                    }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: 'rgba(255,255,255,0.05)', color: T.secondary,
                      border: `1px solid ${T.border}`, borderRadius: 8,
                      padding: '9px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      whiteSpace: 'nowrap', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = T.primary; e.currentTarget.style.borderColor = T.borderAccent }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = T.secondary; e.currentTarget.style.borderColor = T.border }}
                  >
                    <Copy size={13} /> {apiKeyShown ? 'Copy' : 'Reveal'}
                  </button>
                  <button
                    onClick={() => showToast('Available on Business plan')}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: 'rgba(255,255,255,0.04)', color: T.muted,
                      border: `1px solid ${T.border}`, borderRadius: 8,
                      padding: '9px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      whiteSpace: 'nowrap', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = T.secondary; e.currentTarget.style.borderColor = T.borderAccent }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = T.muted; e.currentTarget.style.borderColor = T.border }}
                  >
                    <RefreshCw size={13} /> Regenerate
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 18 }}>
                <a
                  href="#"
                  onClick={e => { e.preventDefault(); showToast('API docs coming soon') }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 13, fontWeight: 600, color: T.orange,
                    textDecoration: 'none', transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  View API Documentation →
                </a>
                <p style={{ fontSize: 12, color: T.muted, margin: '6px 0 0' }}>
                  Full REST API with webhooks, batch operations, and vendor management endpoints.
                </p>
              </div>
            </div>
          </section>

          {/* ── Waitlist / Request ── */}
          <section>
            <div style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              borderLeft: `3px solid ${T.orange}`,
              borderRadius: 12, padding: 24,
            }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: T.primary, margin: '0 0 6px' }}>
                Request an Integration
              </h2>
              <p style={{ fontSize: 13, color: T.secondary, margin: '0 0 20px' }}>
                Don&apos;t see your software? Let us know what you need.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{
                    fontSize: 11, fontWeight: 600, color: T.muted,
                    textTransform: 'uppercase', letterSpacing: '0.07em',
                  }}>
                    Your Email
                  </label>
                  <input
                    type="email"
                    placeholder="you@company.com"
                    value={waitlistForm.email}
                    onChange={e => setWaitlistForm(f => ({ ...f, email: e.target.value }))}
                    style={{
                      background: T.surface, border: `1px solid ${T.border}`,
                      borderRadius: 8, padding: '9px 13px',
                      fontSize: 13, color: T.primary, outline: 'none',
                      fontFamily: 'Inter, sans-serif',
                      transition: 'border-color 0.15s',
                      width: '100%', boxSizing: 'border-box' as const,
                    }}
                    onFocus={e => (e.target.style.borderColor = T.orange)}
                    onBlur={e => (e.target.style.borderColor = T.border)}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{
                    fontSize: 11, fontWeight: 600, color: T.muted,
                    textTransform: 'uppercase', letterSpacing: '0.07em',
                  }}>
                    Integration Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rent Manager, Propertyware..."
                    value={waitlistForm.integration}
                    onChange={e => setWaitlistForm(f => ({ ...f, integration: e.target.value }))}
                    style={{
                      background: T.surface, border: `1px solid ${T.border}`,
                      borderRadius: 8, padding: '9px 13px',
                      fontSize: 13, color: T.primary, outline: 'none',
                      fontFamily: 'Inter, sans-serif',
                      transition: 'border-color 0.15s',
                      width: '100%', boxSizing: 'border-box' as const,
                    }}
                    onFocus={e => (e.target.style.borderColor = T.orange)}
                    onBlur={e => (e.target.style.borderColor = T.border)}
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  if (!waitlistForm.email.trim()) { showToast('Please enter your email'); return }
                  setWaitlistForm({ email: '', integration: '' })
                  showToast("Request submitted. We'll be in touch.")
                }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  background: T.orange, color: '#fff', border: 'none',
                  borderRadius: 8, padding: '10px 20px',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  boxShadow: '0 2px 12px rgba(217,119,6,0.25)',
                  transition: 'background 0.15s, transform 0.1s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = T.orangeHover; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = T.orange; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <Plus size={14} /> Submit Request
              </button>
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}
