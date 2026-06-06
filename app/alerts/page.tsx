'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Bell, User, ChevronDown, AlertTriangle,
  Clock, FileText, ChevronRight, Check,
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
  red: '#ef4444',
  blue: '#8b8cf8',
  primary: '#f8f8f8',
  secondary: '#8b8fa8',
  muted: '#4b5063',
}

// ── Types ─────────────────────────────────────────────────────────────────────

type AlertType = 'Critical' | 'Expiring Soon' | 'Missing Info'
type FilterKey  = 'All' | AlertType

interface Alert {
  id: number
  type: AlertType
  vendor: string
  vendorId: string
  description: string
  date: string
  actionLabel: string
  actionHref: string
}

// ── Data ──────────────────────────────────────────────────────────────────────

const ALERTS: Alert[] = [
  {
    id: 1, type: 'Critical',
    vendor: 'ABC Plumbing LLC', vendorId: '1',
    description: 'Additional Insured endorsement missing. Vendor cannot perform work until resolved.',
    date: 'May 20, 2025',
    actionLabel: 'View Vendor →', actionHref: '/vendors/1',
  },
  {
    id: 2, type: 'Critical',
    vendor: 'ABC Plumbing LLC', vendorId: '1',
    description: 'Waiver of Subrogation missing from current COI.',
    date: 'May 20, 2025',
    actionLabel: 'View Vendor →', actionHref: '/vendors/1',
  },
  {
    id: 3, type: 'Critical',
    vendor: 'Pinnacle Roofing Inc.', vendorId: '4',
    description: 'General liability coverage below required minimum.',
    date: 'May 16, 2025',
    actionLabel: 'View Vendor →', actionHref: '/vendors/4',
  },
  {
    id: 4, type: 'Expiring Soon',
    vendor: 'Bright Services', vendorId: '5',
    description: 'COI expires in 12 days. Request renewal immediately.',
    date: 'Jun 05, 2025',
    actionLabel: 'Send Renewal Request →', actionHref: '/upload',
  },
  {
    id: 5, type: 'Expiring Soon',
    vendor: 'ABC Plumbing LLC', vendorId: '1',
    description: 'Policy expires May 22, 2026. Set reminder for 60 days before.',
    date: 'May 22, 2026',
    actionLabel: 'Set Reminder →', actionHref: '/vendors/1',
  },
  {
    id: 6, type: 'Expiring Soon',
    vendor: 'Pinnacle Roofing Inc.', vendorId: '4',
    description: 'Policy expires Jun 01, 2026.',
    date: 'Jun 01, 2026',
    actionLabel: 'Set Reminder →', actionHref: '/vendors/4',
  },
  {
    id: 7, type: 'Expiring Soon',
    vendor: 'Metro Electric Co.', vendorId: '8',
    description: 'Policy expires Aug 30, 2026.',
    date: 'Aug 30, 2026',
    actionLabel: 'Set Reminder →', actionHref: '/vendors/8',
  },
  {
    id: 8, type: 'Missing Info',
    vendor: 'Elite Flooring', vendorId: '7',
    description: 'COI uploaded but analysis pending. No coverage data available.',
    date: 'May 12, 2025',
    actionLabel: 'View Submission →', actionHref: '/submissions',
  },
  {
    id: 9, type: 'Missing Info',
    vendor: 'Summit Electric Co.', vendorId: '2',
    description: 'Workers comp documentation unclear. Manual review recommended.',
    date: 'May 19, 2025',
    actionLabel: 'View Vendor →', actionHref: '/vendors/2',
  },
]

const RESOLVED = [
  { vendor: 'Bluewater HVAC',       description: 'COI renewed and all requirements now met.',         date: 'May 18, 2025' },
  { vendor: 'ProBuild Contractors', description: 'Additional Insured endorsement added successfully.', date: 'May 14, 2025' },
  { vendor: 'Metro Electric Co.',   description: 'Workers comp documentation verified and accepted.',  date: 'May 10, 2025' },
]

const FILTERS: { key: FilterKey; count: number }[] = [
  { key: 'All',           count: ALERTS.length },
  { key: 'Critical',      count: ALERTS.filter(a => a.type === 'Critical').length },
  { key: 'Expiring Soon', count: ALERTS.filter(a => a.type === 'Expiring Soon').length },
  { key: 'Missing Info',  count: ALERTS.filter(a => a.type === 'Missing Info').length },
]

// ── Alert type styles ─────────────────────────────────────────────────────────

function typeStyle(type: AlertType) {
  switch (type) {
    case 'Critical':      return { border: T.red,    pillBg: 'rgba(239,68,68,0.12)',   pillColor: T.red,    pillBorder: 'rgba(239,68,68,0.25)'   }
    case 'Expiring Soon': return { border: T.orange, pillBg: 'rgba(217,119,6,0.12)',   pillColor: T.orange, pillBorder: 'rgba(217,119,6,0.25)'   }
    case 'Missing Info':  return { border: T.blue,   pillBg: 'rgba(139,140,248,0.12)', pillColor: T.blue,   pillBorder: 'rgba(139,140,248,0.25)' }
  }
}

// ── AlertCard ─────────────────────────────────────────────────────────────────

function AlertCard({ alert, index, mounted }: { alert: Alert; index: number; mounted: boolean }) {
  const [hov, setHov] = useState(false)
  const s = typeStyle(alert.type)

  return (
    <div
      className={mounted ? 'alert-animate' : 'pre-animate'}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? '#161620' : T.card,
        border: `1px solid ${hov ? T.borderAccent : T.border}`,
        borderLeft: `3px solid ${s.border}`,
        borderRadius: 10,
        padding: '16px 18px',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
        transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
        boxShadow: hov ? '0 6px 24px rgba(0,0,0,0.35)' : 'none',
        animationDelay: mounted ? `${index * 55}ms` : undefined,
      }}
    >
      {/* Left content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Type pill */}
        <div style={{ marginBottom: 8 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: s.pillBg, color: s.pillColor,
            border: `1px solid ${s.pillBorder}`,
            borderRadius: 20, padding: '2px 10px',
            fontSize: 11, fontWeight: 700,
          }}>
            {alert.type === 'Critical'      && <AlertTriangle size={10} strokeWidth={2.5} />}
            {alert.type === 'Expiring Soon' && <Clock size={10} strokeWidth={2.5} />}
            {alert.type === 'Missing Info'  && <FileText size={10} strokeWidth={2.5} />}
            {alert.type}
          </span>
        </div>

        {/* Vendor + description */}
        <p style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: '0 0 5px' }}>
          {alert.vendor}
        </p>
        <p style={{ fontSize: 13, color: T.secondary, lineHeight: 1.6, margin: 0 }}>
          {alert.description}
        </p>
      </div>

      {/* Right: date + action */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'flex-end', gap: 10, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Clock size={11} color={T.muted} />
          <span style={{ fontSize: 11, color: T.muted, whiteSpace: 'nowrap' }}>{alert.date}</span>
        </div>
        <Link
          href={alert.actionHref}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: hov ? s.pillBg : 'rgba(255,255,255,0.04)',
            color: hov ? s.pillColor : T.secondary,
            border: `1px solid ${hov ? s.pillBorder : T.border}`,
            borderRadius: 6, padding: '6px 12px',
            fontSize: 12, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap',
            transition: 'all 0.15s',
          }}
        >
          {alert.actionLabel}
        </Link>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AlertsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('All')
  const [resolvedOpen, setResolvedOpen]  = useState(false)
  const [mounted, setMounted]            = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const filtered = activeFilter === 'All'
    ? ALERTS
    : ALERTS.filter(a => a.type === activeFilter)

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: T.bg, fontFamily: 'Inter, -apple-system, sans-serif',
      color: T.primary,
    }}>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pre-animate   { opacity: 0; }
        .alert-animate { animation: fadeSlideUp 0.35s ease both; }
      `}</style>

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
              Alerts
            </h1>
            <p style={{ fontSize: 12, color: T.secondary, margin: 0 }}>
              Active compliance issues requiring attention
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Active alerts badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'rgba(217,119,6,0.10)', border: '1px solid rgba(217,119,6,0.25)',
              borderRadius: 8, padding: '7px 14px',
            }}>
              <AlertTriangle size={14} color={T.orange} />
              <span style={{ fontSize: 13, fontWeight: 700, color: T.orange }}>
                {ALERTS.length} Active Alerts
              </span>
            </div>

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

          {/* Filter pills */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {FILTERS.map(f => {
              const active = activeFilter === f.key
              return (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    background: active ? T.orange : T.card,
                    color: active ? '#fff' : T.secondary,
                    border: `1px solid ${active ? T.orange : T.border}`,
                    borderRadius: 8, padding: '8px 16px',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.borderColor = T.borderAccent
                      e.currentTarget.style.color = T.primary
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.borderColor = T.border
                      e.currentTarget.style.color = T.secondary
                    }
                  }}
                >
                  {f.key}
                  <span style={{
                    background: active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.06)',
                    color: active ? '#fff' : T.muted,
                    borderRadius: 20, padding: '1px 7px',
                    fontSize: 11, fontWeight: 700,
                  }}>
                    {f.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Alert cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {filtered.length === 0 ? (
              <div style={{
                background: T.card, border: `1px solid ${T.border}`,
                borderRadius: 10, padding: '48px 24px', textAlign: 'center',
              }}>
                <Check size={28} color={T.green} style={{ marginBottom: 12 }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: T.primary, margin: '0 0 6px' }}>
                  No alerts in this category
                </p>
                <p style={{ fontSize: 13, color: T.secondary, margin: 0 }}>
                  All clear for now.
                </p>
              </div>
            ) : (
              filtered.map((alert, i) => (
                <AlertCard key={alert.id} alert={alert} index={i} mounted={mounted} />
              ))
            )}
          </div>

          {/* Resolved section */}
          <div style={{
            background: T.card, border: `1px solid ${T.border}`,
            borderRadius: 10, overflow: 'hidden',
          }}>
            {/* Collapse toggle */}
            <button
              onClick={() => setResolvedOpen(v => !v)}
              style={{
                width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                padding: '14px 18px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1a1a2e')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Check size={11} color={T.green} strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.secondary }}>
                  Resolved Alerts
                </span>
                <span style={{
                  background: 'rgba(34,197,94,0.10)', color: T.green,
                  border: '1px solid rgba(34,197,94,0.22)',
                  borderRadius: 20, padding: '1px 8px',
                  fontSize: 11, fontWeight: 700,
                }}>
                  {RESOLVED.length}
                </span>
              </div>
              <ChevronRight
                size={15} color={T.muted}
                style={{
                  transition: 'transform 0.2s',
                  transform: resolvedOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                }}
              />
            </button>

            {/* Resolved items */}
            {resolvedOpen && (
              <div style={{ borderTop: `1px solid ${T.border}` }}>
                {RESOLVED.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '14px 18px',
                      borderBottom: i < RESOLVED.length - 1 ? `1px solid ${T.border}` : 'none',
                      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
                      opacity: 0.6,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#1a1a2e')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                        background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Check size={11} color={T.green} strokeWidth={2.5} />
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: T.primary, margin: '0 0 3px' }}>
                          {item.vendor}
                        </p>
                        <p style={{ fontSize: 12, color: T.secondary, margin: 0, lineHeight: 1.5 }}>
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                      <Clock size={11} color={T.muted} />
                      <span style={{ fontSize: 11, color: T.muted, whiteSpace: 'nowrap' }}>{item.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
