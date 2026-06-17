'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, User, Check, CheckCircle2 } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { UserButton, useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'

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

type TabKey = 'company' | 'notifications'

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

function CompanyTab({ userId, showToast }: { userId: string | null; showToast: (m: string) => void }) {
  const [form, setForm] = useState({ name: '', industry: '', size: '', website: '', address: '' })
  const [dataLoaded, setDataLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!userId) return
    supabase
      .from('user_company')
      .select('name, industry, size, website, address')
      .eq('clerk_user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setForm({
            name:     data.name     ?? '',
            industry: data.industry ?? '',
            size:     data.size     ?? '',
            website:  data.website  ?? '',
            address:  data.address  ?? '',
          })
        }
        setDataLoaded(true)
      })
  }, [userId])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Save failed')
      showToast('Company information saved')
    } catch {
      showToast('Failed to save — please try again')
    } finally {
      setSaving(false)
    }
  }

  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer', appearance: 'none' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Company Information */}
      <SectionCard>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: '0 0 20px' }}>
          Company Information
        </h3>

        {!dataLoaded ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[120, 200, 160].map(w => (
              <div key={w} style={{ height: 38, width: w, background: T.surface, borderRadius: 8, opacity: 0.6 }} />
            ))}
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <FormField label="Company Name">
                <input
                  style={inputStyle} value={form.name}
                  placeholder="Your company name"
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
                  <option value="" style={{ background: T.card }}>Select industry…</option>
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
                  <option value="" style={{ background: T.card }}>Select size…</option>
                  {['1-10 employees', '11-50 employees', '51-200 employees', '200+ employees'].map(o => (
                    <option key={o} value={o} style={{ background: T.card }}>{o}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Website">
                <input
                  style={inputStyle} value={form.website}
                  placeholder="yourcompany.com"
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
                placeholder="123 Main St, City, State ZIP"
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                onFocus={e => (e.target.style.borderColor = T.orange)}
                onBlur={e => (e.target.style.borderColor = T.border)}
              />
            </FormField>
            <div style={{ marginTop: 20 }}>
              <OrangeBtn onClick={saving ? undefined : handleSave}>
                {saving ? 'Saving…' : <><Check size={14} /> Save Changes</>}
              </OrangeBtn>
            </div>
          </>
        )}
      </SectionCard>

      {/* Team Members — Coming Soon */}
      <SectionCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <User size={15} color={T.muted} />
          <h3 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: 0 }}>Team Members</h3>
          <span style={{
            fontSize: 11, fontWeight: 600, color: T.muted,
            background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`,
            borderRadius: 20, padding: '2px 9px',
          }}>Coming Soon</span>
        </div>
        <p style={{ fontSize: 13, color: T.secondary, margin: 0, lineHeight: 1.7 }}>
          Multi-user team management is in development. You&apos;ll be able to invite teammates, assign roles, and control access here once it launches.
        </p>
      </SectionCard>
    </div>
  )
}

// ── Notifications Tab ─────────────────────────────────────────────────────────

function NotificationsTab() {
  return (
    <SectionCard>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <Bell size={15} color={T.muted} />
        <h3 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: 0 }}>Notification Preferences</h3>
        <span style={{
          fontSize: 11, fontWeight: 600, color: T.muted,
          background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`,
          borderRadius: 20, padding: '2px 9px',
        }}>Coming Soon</span>
      </div>
      <p style={{ fontSize: 13, color: T.secondary, margin: 0, lineHeight: 1.7 }}>
        Notification preferences are coming soon. You&apos;ll be able to control email alerts for COI uploads, compliance issues, and expiration warnings here.
      </p>
    </SectionCard>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user } = useUser()
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

            <UserButton />
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
          {activeTab === 'company'       && <CompanyTab userId={user?.id ?? null} showToast={showToast} />}
          {activeTab === 'notifications' && <NotificationsTab />}
        </div>
      </main>
    </div>
  )
}
