'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Bell, User, ChevronDown, Check, X, Plus,
  Pencil, Trash2, CheckCircle2, Building2,
  Puzzle, CreditCard, Shield,
} from 'lucide-react'
import Sidebar from '../components/Sidebar'

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

type TabKey = 'company' | 'notifications' | 'integrations' | 'billing'

// ── Shared components ─────────────────────────────────────────────────────────

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

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        width: 42, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
        background: on ? T.green : T.border,
        position: 'relative', flexShrink: 0, padding: 0,
        transition: 'background 0.2s',
      }}
    >
      <div style={{
        position: 'absolute', top: 4,
        left: on ? 22 : 4,
        width: 16, height: 16, borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </button>
  )
}

function FormField({
  label, children,
}: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontSize: 11, fontWeight: 600, color: T.muted,
        textTransform: 'uppercase', letterSpacing: '0.07em',
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: T.surface, border: `1px solid ${T.border}`,
  borderRadius: 8, padding: '9px 12px',
  fontSize: 14, color: T.primary, outline: 'none',
  fontFamily: 'Inter, sans-serif',
  transition: 'border-color 0.15s',
  width: '100%', boxSizing: 'border-box',
}

function OrangeBtn({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
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
      {children}
    </button>
  )
}

function OutlineBtn({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        background: 'none', color: T.orange,
        border: `1px solid rgba(217,119,6,0.35)`,
        borderRadius: 8, padding: '9px 16px',
        fontSize: 13, fontWeight: 600, cursor: 'pointer',
        transition: 'background 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,119,6,0.08)'; e.currentTarget.style.borderColor = T.orange }}
      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'rgba(217,119,6,0.35)' }}
    >
      {children}
    </button>
  )
}

function GhostBtn({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: 'rgba(255,255,255,0.04)', color: T.secondary,
        border: `1px solid ${T.border}`, borderRadius: 6,
        padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = T.primary; e.currentTarget.style.borderColor = T.borderAccent }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = T.secondary; e.currentTarget.style.borderColor = T.border }}
    >
      {children}
    </button>
  )
}

function SectionCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 12, padding: 24,
      ...style,
    }}>
      {children}
    </div>
  )
}

// ── Company Tab ───────────────────────────────────────────────────────────────

function CompanyTab({ showToast }: { showToast: (m: string) => void }) {
  const [form, setForm] = useState({
    name: 'Greenway Property Management',
    industry: 'Property Management',
    size: '11-50 employees',
    website: 'greenwaypm.com',
    address: '123 Main St, Atlanta, GA 30301',
  })

  const [members, setMembers] = useState([
    { id: 1, name: 'James Carter',   email: 'james@greenwaypm.com',  role: 'Administrator' },
    { id: 2, name: 'Sarah Mitchell', email: 'sarah@greenwaypm.com',  role: 'Manager'       },
    { id: 3, name: 'Tom Bradley',    email: 'tom@greenwaypm.com',    role: 'Viewer'        },
  ])

  const [editingMember, setEditingMember] = useState<number | null>(null)

  function removeMember(id: number) { setMembers(prev => prev.filter(m => m.id !== id)) }

  function addMember() {
    const id = Date.now()
    setMembers(prev => [...prev, { id, name: '', email: '', role: 'Viewer' }])
    setEditingMember(id)
  }

  const selectStyle: React.CSSProperties = {
    ...inputStyle, cursor: 'pointer', appearance: 'none',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Company Information */}
      <SectionCard>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: '0 0 20px' }}>
          Company Information
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <FormField label="Company Name">
            <input
              style={inputStyle} value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onFocus={e => (e.target.style.borderColor = T.orange)}
              onBlur={e => (e.target.style.borderColor = T.border)}
            />
          </FormField>
          <FormField label="Industry">
            <select
              style={selectStyle} value={form.industry}
              onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
              onFocus={e => (e.target.style.borderColor = T.orange)}
              onBlur={e => (e.target.style.borderColor = T.border)}
            >
              {['Property Management', 'Real Estate', 'Construction', 'Hospitality', 'Other'].map(o => (
                <option key={o} value={o} style={{ background: T.card }}>{o}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Company Size">
            <select
              style={selectStyle} value={form.size}
              onChange={e => setForm(f => ({ ...f, size: e.target.value }))}
              onFocus={e => (e.target.style.borderColor = T.orange)}
              onBlur={e => (e.target.style.borderColor = T.border)}
            >
              {['1-10 employees', '11-50 employees', '51-200 employees', '200+ employees'].map(o => (
                <option key={o} value={o} style={{ background: T.card }}>{o}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Website">
            <input
              style={inputStyle} value={form.website}
              onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
              onFocus={e => (e.target.style.borderColor = T.orange)}
              onBlur={e => (e.target.style.borderColor = T.border)}
            />
          </FormField>
        </div>
        <FormField label="Address">
          <textarea
            style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
            value={form.address}
            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
            onFocus={e => (e.target.style.borderColor = T.orange)}
            onBlur={e => (e.target.style.borderColor = T.border)}
          />
        </FormField>
        <div style={{ marginTop: 20 }}>
          <OrangeBtn onClick={() => showToast('Company information saved')}>
            <Check size={14} /> Save Changes
          </OrangeBtn>
        </div>
      </SectionCard>

      {/* Team Members */}
      <SectionCard>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: '0 0 18px' }}>
          Team Members
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Name', 'Email', 'Role', 'Actions'].map(col => (
                  <th key={col} style={{
                    textAlign: 'left', padding: '0 12px 10px',
                    fontSize: 10, color: T.muted, fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap',
                  }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr
                  key={m.id}
                  style={{
                    borderBottom: i < members.length - 1 ? `1px solid ${T.border}` : 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#1a1a2e')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px' }}>
                    {editingMember === m.id ? (
                      <input
                        style={{ ...inputStyle, width: 140 }}
                        value={m.name} placeholder="Full name"
                        onChange={e => setMembers(prev => prev.map(x => x.id === m.id ? { ...x, name: e.target.value } : x))}
                        onFocus={e => (e.target.style.borderColor = T.orange)}
                        onBlur={e => (e.target.style.borderColor = T.border)}
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                          background: 'rgba(217,119,6,0.12)', border: '1px solid rgba(217,119,6,0.22)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, color: T.orange,
                        }}>
                          {m.name.charAt(0) || '?'}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: T.primary }}>{m.name || '—'}</span>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {editingMember === m.id ? (
                      <input
                        style={{ ...inputStyle, width: 190 }}
                        value={m.email} placeholder="email@company.com"
                        onChange={e => setMembers(prev => prev.map(x => x.id === m.id ? { ...x, email: e.target.value } : x))}
                        onFocus={e => (e.target.style.borderColor = T.orange)}
                        onBlur={e => (e.target.style.borderColor = T.border)}
                      />
                    ) : (
                      <span style={{ fontSize: 13, color: T.secondary }}>{m.email || '—'}</span>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {editingMember === m.id ? (
                      <select
                        style={{ ...inputStyle, width: 130, cursor: 'pointer', appearance: 'none' }}
                        value={m.role}
                        onChange={e => setMembers(prev => prev.map(x => x.id === m.id ? { ...x, role: e.target.value } : x))}
                        onFocus={e => (e.target.style.borderColor = T.orange)}
                        onBlur={e => (e.target.style.borderColor = T.border)}
                      >
                        {['Administrator', 'Manager', 'Viewer'].map(r => (
                          <option key={r} value={r} style={{ background: T.card }}>{r}</option>
                        ))}
                      </select>
                    ) : (
                      <span style={{
                        background: m.role === 'Administrator' ? 'rgba(217,119,6,0.09)' : 'rgba(255,255,255,0.05)',
                        color: m.role === 'Administrator' ? T.orange : T.secondary,
                        border: `1px solid ${m.role === 'Administrator' ? 'rgba(217,119,6,0.22)' : T.border}`,
                        borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600,
                      }}>{m.role}</span>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {editingMember === m.id ? (
                        <button
                          onClick={() => { setEditingMember(null); showToast('Member updated') }}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            background: 'rgba(34,197,94,0.10)', color: T.green,
                            border: '1px solid rgba(34,197,94,0.25)',
                            borderRadius: 6, padding: '6px 12px',
                            fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(34,197,94,0.18)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(34,197,94,0.10)')}
                        >
                          <Check size={12} /> Save
                        </button>
                      ) : (
                        <GhostBtn onClick={() => setEditingMember(m.id)}>
                          <Pencil size={12} /> Edit
                        </GhostBtn>
                      )}
                      <button
                        onClick={() => removeMember(m.id)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          background: 'rgba(239,68,68,0.07)', color: '#ef4444',
                          border: '1px solid rgba(239,68,68,0.20)',
                          borderRadius: 6, padding: '6px 12px',
                          fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.14)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.07)')}
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
          <OutlineBtn onClick={addMember}><Plus size={14} /> Invite Team Member</OutlineBtn>
        </div>
      </SectionCard>
    </div>
  )
}

// ── Notifications Tab ─────────────────────────────────────────────────────────

function NotificationsTab({ showToast }: { showToast: (m: string) => void }) {
  const [prefs, setPrefs] = useState([
    { id: 1, label: 'COI Upload Complete',      desc: 'Notify when a new COI is successfully processed',         on: true  },
    { id: 2, label: 'Issues Found',             desc: 'Alert when compliance gaps are detected in a COI',        on: true  },
    { id: 3, label: 'Expiring Soon (30 days)',  desc: 'Warn when a policy expires within 30 days',               on: true  },
    { id: 4, label: 'Expiring Soon (60 days)',  desc: 'Early warning when a policy expires within 60 days',      on: false },
    { id: 5, label: 'Vendor Compliant',         desc: 'Notify when a vendor resolves all compliance issues',     on: false },
    { id: 6, label: 'Weekly Summary Email',     desc: 'Receive a weekly digest of your portfolio compliance',    on: true  },
    { id: 7, label: 'Monthly Report',           desc: 'Full monthly compliance report delivered to your inbox',  on: true  },
  ])

  function toggle(id: number) {
    setPrefs(prev => prev.map(p => p.id === id ? { ...p, on: !p.on } : p))
  }

  return (
    <SectionCard>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: '0 0 6px' }}>
        Notification Preferences
      </h3>
      <p style={{ fontSize: 13, color: T.secondary, margin: '0 0 22px' }}>
        Choose what triggers an alert or email.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {prefs.map((p, i) => (
          <div
            key={p.id}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 0',
              borderBottom: i < prefs.length - 1 ? `1px solid ${T.border}` : 'none',
            }}
          >
            <div style={{ flex: 1, paddingRight: 24 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: T.primary, margin: '0 0 3px' }}>{p.label}</p>
              <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>{p.desc}</p>
            </div>
            <Toggle on={p.on} onChange={() => toggle(p.id)} />
          </div>
        ))}
      </div>
      <div style={{ marginTop: 22, paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
        <OrangeBtn onClick={() => showToast('Notification preferences saved')}>
          <Check size={14} /> Save Preferences
        </OrangeBtn>
      </div>
    </SectionCard>
  )
}

// ── Integrations Tab ──────────────────────────────────────────────────────────

function IntegrationsTab({ showToast }: { showToast: (m: string) => void }) {
  const INTEGRATIONS = [
    { name: 'Buildium',   desc: 'Sync vendor data from Buildium',   icon: Building2 },
    { name: 'AppFolio',   desc: 'Import vendors from AppFolio',     icon: Building2 },
    { name: 'QuickBooks', desc: 'Sync vendor payments',             icon: CreditCard },
    { name: 'Zapier',     desc: 'Connect to 5,000+ apps',          icon: Puzzle     },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {INTEGRATIONS.map(({ name, desc, icon: Icon }) => (
          <div
            key={name}
            style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 12, padding: '22px 20px',
              display: 'flex', flexDirection: 'column', gap: 14,
              transition: 'border-color 0.2s, transform 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderAccent; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={18} color={T.secondary} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: '0 0 2px' }}>{name}</p>
                <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>{desc}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                fontSize: 11, fontWeight: 600, color: T.muted,
                background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
                borderRadius: 20, padding: '2px 10px',
              }}>
                Not connected
              </span>
              <OutlineBtn onClick={() => showToast(`${name} — Coming soon`)}>
                Connect
              </OutlineBtn>
            </div>
          </div>
        ))}
      </div>
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 10, padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Puzzle size={14} color={T.muted} />
        <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>
          Integrations coming soon.{' '}
          <button
            onClick={() => showToast('Added to waitlist!')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: T.orange, fontSize: 13, fontWeight: 600, padding: 0,
              textDecoration: 'underline',
            }}
          >
            Join the waitlist
          </button>
          {' '}to be notified when they launch.
        </p>
      </div>
    </div>
  )
}

// ── Billing Tab ───────────────────────────────────────────────────────────────

function BillingTab({ showToast }: { showToast: (m: string) => void }) {
  function ProgressBar({ used, total, color }: { used: number; total: number; color: string }) {
    const pct = Math.round((used / total) * 100)
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: T.secondary }}>
            {used} of {total} used
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color }}>{pct}%</span>
        </div>
        <div style={{
          width: '100%', height: 6, borderRadius: 3,
          background: 'rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: color, borderRadius: 3,
            transition: 'width 0.6s ease',
          }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Current plan */}
      <SectionCard>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: 0 }}>
                Current Plan
              </h3>
              <span style={{
                background: 'rgba(217,119,6,0.10)', color: T.orange,
                border: '1px solid rgba(217,119,6,0.25)',
                borderRadius: 20, padding: '2px 10px',
                fontSize: 11, fontWeight: 700,
              }}>
                PRO
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: T.primary, letterSpacing: '-1px', lineHeight: 1 }}>$49</span>
                <span style={{ fontSize: 14, color: T.muted }}>/month</span>
              </div>
              <p style={{ fontSize: 13, color: T.secondary, margin: 0 }}>
                Next billing date: <span style={{ color: T.primary, fontWeight: 500 }}>Jul 01, 2026</span>
              </p>
              <p style={{ fontSize: 13, color: T.secondary, margin: 0 }}>
                Payment method: <span style={{ color: T.primary, fontWeight: 500 }}>Visa ending 4242</span>
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
            <OutlineBtn onClick={() => showToast('Redirecting to plan selection…')}>
              Change Plan
            </OutlineBtn>
            <GhostBtn onClick={() => showToast('Redirecting to payment update…')}>
              <CreditCard size={13} /> Update Payment
            </GhostBtn>
          </div>
        </div>
      </SectionCard>

      {/* Usage */}
      <SectionCard>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: '0 0 20px' }}>
          Usage This Month
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: T.primary, margin: '0 0 8px' }}>COI Verifications</p>
            <ProgressBar used={18} total={50} color={T.orange} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: T.primary, margin: '0 0 8px' }}>Vendors</p>
            <ProgressBar used={8} total={50} color={T.green} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: T.primary, margin: '0 0 8px' }}>Team Members</p>
            <ProgressBar used={3} total={5} color={T.green} />
          </div>
        </div>
      </SectionCard>

      {/* Plan comparison */}
      <SectionCard>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: '0 0 18px' }}>
          Plan Comparison
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {['Feature', 'Pro (Current)', 'Business'].map((col, i) => (
                <th key={col} style={{
                  textAlign: i === 0 ? 'left' : 'center',
                  padding: '0 12px 10px',
                  fontSize: 11, color: i === 2 ? T.orange : T.muted,
                  fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em',
                }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['Vendors',          '50',           'Unlimited'],
              ['COI Verifications','50/mo',        'Unlimited'],
              ['Team Members',     '5',            'Unlimited'],
              ['Custom Requirements', '—',         '✓'],
              ['API Access',       '—',            '✓'],
              ['Dedicated Support','—',            '✓'],
              ['SLA Guarantee',    '—',            '✓'],
            ].map(([feature, pro, biz], i, arr) => (
              <tr
                key={feature}
                style={{
                  borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : 'none',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1a1a2e')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '11px 12px', fontSize: 13, color: T.secondary }}>{feature}</td>
                <td style={{ padding: '11px 12px', fontSize: 13, color: T.secondary, textAlign: 'center' }}>{pro}</td>
                <td style={{ padding: '11px 12px', fontSize: 13, color: biz === '✓' ? T.green : T.secondary, textAlign: 'center', fontWeight: biz === '✓' ? 700 : 400 }}>{biz}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${T.border}` }}>
          <OrangeBtn onClick={() => showToast('Redirecting to Business plan…')}>
            Upgrade to Business →
          </OrangeBtn>
        </div>
      </SectionCard>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab,    setActiveTab]    = useState<TabKey>('company')
  const [toastMsg,     setToastMsg]     = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToastMsg(msg)
    setToastVisible(true)
    timerRef.current = setTimeout(() => setToastVisible(false), 3000)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'company',       label: 'Company'       },
    { key: 'notifications', label: 'Notifications' },
    { key: 'integrations',  label: 'Integrations'  },
    { key: 'billing',       label: 'Billing'       },
  ]

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
            <h1 style={{ fontSize: 16, fontWeight: 700, color: T.primary, margin: 0, lineHeight: 1.2 }}>Settings</h1>
            <p style={{ fontSize: 12, color: T.secondary, margin: 0 }}>
              Manage your account and company preferences
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

            <button style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'none', border: `1px solid ${T.border}`,
              borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
              transition: 'border-color 0.15s, background 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderAccent; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = 'none' }}
            >
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(217,119,6,0.13)', border: '1px solid rgba(217,119,6,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <User size={13} color={T.orange} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.primary }}>James Carter</span>
              <ChevronDown size={13} color={T.secondary} />
            </button>
          </div>
        </header>

        {/* ── Content ── */}
        <div style={{ padding: 28, flex: 1 }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${T.border}`, marginBottom: 24 }}>
            {TABS.map(tab => {
              const active = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '11px 20px',
                    fontSize: 14, fontWeight: active ? 600 : 500,
                    color: active ? T.primary : T.secondary,
                    borderBottom: `2px solid ${active ? T.orange : 'transparent'}`,
                    marginBottom: -1,
                    transition: 'color 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = T.primary }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = T.secondary }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          {activeTab === 'company'       && <CompanyTab       showToast={showToast} />}
          {activeTab === 'notifications' && <NotificationsTab showToast={showToast} />}
          {activeTab === 'integrations'  && <IntegrationsTab  showToast={showToast} />}
          {activeTab === 'billing'       && <BillingTab       showToast={showToast} />}
        </div>
      </main>
    </div>
  )
}
