'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Bell, User, ChevronDown, Check, X,
  CheckCircle2, Plus, Trash2, Pencil, Zap,
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

// ── Types ─────────────────────────────────────────────────────────────────────

interface Requirement {
  id: number
  coverage: string
  enabled: boolean
  amount: string
  notes: string
}

interface Override {
  id: number
  vendor: string
  overrideType: string
  customReq: string
}

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

// ── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
        background: on ? T.green : T.border,
        position: 'relative', flexShrink: 0,
        transition: 'background 0.2s',
        padding: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3,
        left: on ? 21 : 3,
        width: 16, height: 16, borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </button>
  )
}

// ── Editable input ────────────────────────────────────────────────────────────

function FieldInput({
  value, onChange, placeholder, width = 140,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  width?: number
}) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 7, padding: '6px 10px',
        fontSize: 13, color: T.primary, outline: 'none',
        width, transition: 'border-color 0.15s',
        fontFamily: 'Inter, sans-serif',
      }}
      onFocus={e => (e.target.style.borderColor = T.orange)}
      onBlur={e => (e.target.style.borderColor = T.border)}
    />
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RequirementsPage() {
  const [reqs, setReqs] = useState<Requirement[]>([
    { id: 1, coverage: 'General Liability',      enabled: true, amount: '$1,000,000', notes: 'Per occurrence limit'       },
    { id: 2, coverage: 'Auto Liability',          enabled: true, amount: '$1,000,000', notes: 'Combined single limit'      },
    { id: 3, coverage: 'Workers Compensation',    enabled: true, amount: 'Statutory',  notes: 'Required in all states'     },
    { id: 4, coverage: 'Additional Insured',      enabled: true, amount: 'Required',   notes: 'Must name your company'     },
    { id: 5, coverage: 'Waiver of Subrogation',   enabled: true, amount: 'Required',   notes: 'Must be included'           },
  ])

  const [overrides, setOverrides] = useState<Override[]>([
    { id: 1, vendor: 'ABC Plumbing LLC',       overrideType: 'Additional Insured', customReq: 'Must include property address' },
    { id: 2, vendor: 'Pinnacle Roofing Inc.',  overrideType: 'Minimum GL',         customReq: '$2,000,000'                    },
  ])

  const [editingOverride, setEditingOverride] = useState<number | null>(null)
  const [toastMsg, setToastMsg]               = useState('')
  const [toastVisible, setToastVisible]       = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToastMsg(msg)
    setToastVisible(true)
    timerRef.current = setTimeout(() => setToastVisible(false), 3000)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  function updateReq(id: number, patch: Partial<Requirement>) {
    setReqs(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r))
  }

  function removeOverride(id: number) {
    setOverrides(prev => prev.filter(o => o.id !== id))
  }

  function addOverride() {
    const newId = Date.now()
    setOverrides(prev => [...prev, { id: newId, vendor: '', overrideType: '', customReq: '' }])
    setEditingOverride(newId)
  }

  function updateOverride(id: number, patch: Partial<Override>) {
    setOverrides(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o))
  }

  const TEMPLATES = [
    {
      name: 'Plumbing & HVAC',
      desc: 'Standard requirements for trade contractors',
      changes: { 1: '$1,000,000', 2: '$1,000,000' },
    },
    {
      name: 'Electrical',
      desc: 'Higher liability for electrical work',
      changes: { 1: '$2,000,000', 2: '$1,000,000' },
    },
    {
      name: 'Landscaping',
      desc: 'Lower requirements for exterior vendors',
      changes: { 1: '$500,000', 2: '$500,000' },
    },
    {
      name: 'General Contractor',
      desc: 'Maximum requirements for GC work',
      changes: { 1: '$5,000,000', 2: '$2,000,000' },
    },
  ]

  function applyTemplate(template: typeof TEMPLATES[number]) {
    setReqs(prev => prev.map(r => {
      const change = (template.changes as Record<number, string>)[r.id]
      return change ? { ...r, amount: change, enabled: true } : r
    }))
    showToast(`"${template.name}" template applied`)
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
              Requirements
            </h1>
            <p style={{ fontSize: 12, color: T.secondary, margin: 0 }}>
              Set your minimum insurance standards for all vendors
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => showToast('Requirements saved')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: T.orange, color: '#fff', border: 'none',
                borderRadius: 8, padding: '8px 16px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 2px 12px rgba(217,119,6,0.25)',
                transition: 'background 0.15s, transform 0.1s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = T.orangeHover; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = T.orange; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <Check size={14} /> Save Requirements
            </button>

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
        <div style={{ padding: 28, flex: 1, display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* ── Default Requirements ── */}
          <section>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: T.primary, margin: '0 0 4px' }}>
                Default Requirements
              </h2>
              <p style={{ fontSize: 13, color: T.secondary, margin: 0 }}>
                Applied to all vendors unless overridden
              </p>
            </div>

            <div style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 12, overflow: 'hidden',
            }}>
              {/* Column headers */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 80px 160px 1fr',
                gap: 16, padding: '10px 20px',
                borderBottom: `1px solid ${T.border}`,
              }}>
                {['Coverage Type', 'Required', 'Minimum Amount', 'Notes'].map(col => (
                  <span key={col} style={{
                    fontSize: 10, fontWeight: 600, color: T.muted,
                    textTransform: 'uppercase', letterSpacing: '0.07em',
                  }}>
                    {col}
                  </span>
                ))}
              </div>

              {reqs.map((req, i) => (
                <div
                  key={req.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 80px 160px 1fr',
                    gap: 16, padding: '14px 20px',
                    alignItems: 'center',
                    borderBottom: i < reqs.length - 1 ? `1px solid ${T.border}` : 'none',
                    transition: 'background 0.15s',
                    opacity: req.enabled ? 1 : 0.45,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#1a1a2e')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Coverage name */}
                  <span style={{ fontSize: 14, fontWeight: 600, color: T.primary }}>
                    {req.coverage}
                  </span>

                  {/* Toggle */}
                  <Toggle on={req.enabled} onChange={v => updateReq(req.id, { enabled: v })} />

                  {/* Amount */}
                  <FieldInput
                    value={req.amount}
                    onChange={v => updateReq(req.id, { amount: v })}
                    placeholder="e.g. $1,000,000"
                    width={140}
                  />

                  {/* Notes */}
                  <FieldInput
                    value={req.notes}
                    onChange={v => updateReq(req.id, { notes: v })}
                    placeholder="Notes..."
                    width={220}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* ── Industry Templates ── */}
          <section>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: T.primary, margin: '0 0 4px' }}>
                Industry Templates
              </h2>
              <p style={{ fontSize: 13, color: T.secondary, margin: 0 }}>
                Quick-apply requirement sets by vendor type
              </p>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14,
            }}>
              {TEMPLATES.map(tmpl => (
                <div
                  key={tmpl.name}
                  style={{
                    background: T.card, border: `1px solid ${T.border}`,
                    borderRadius: 12, padding: '20px 18px',
                    display: 'flex', flexDirection: 'column', gap: 12,
                    transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = T.borderAccent
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.4)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = T.border
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: 9,
                    background: 'rgba(217,119,6,0.10)', border: '1px solid rgba(217,119,6,0.20)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Zap size={16} color={T.orange} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: T.primary, margin: '0 0 5px' }}>
                      {tmpl.name}
                    </p>
                    <p style={{ fontSize: 12, color: T.secondary, margin: 0, lineHeight: 1.5 }}>
                      {tmpl.desc}
                    </p>
                  </div>
                  <button
                    onClick={() => applyTemplate(tmpl)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      background: 'none', color: T.orange,
                      border: `1px solid rgba(217,119,6,0.35)`,
                      borderRadius: 7, padding: '8px 12px',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      marginTop: 'auto',
                      transition: 'background 0.15s, border-color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,119,6,0.10)'; e.currentTarget.style.borderColor = T.orange }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'rgba(217,119,6,0.35)' }}
                  >
                    <Zap size={12} /> Apply Template
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* ── Vendor Overrides ── */}
          <section>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: T.primary, margin: '0 0 4px' }}>
                Vendor-Specific Overrides
              </h2>
              <p style={{ fontSize: 13, color: T.secondary, margin: 0 }}>
                Custom requirements for individual vendors
              </p>
            </div>

            <div style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 12, overflow: 'hidden',
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                      {['Vendor', 'Override Type', 'Custom Requirement', 'Actions'].map(col => (
                        <th key={col} style={{
                          textAlign: 'left', padding: '12px 16px',
                          fontSize: 10, color: T.muted, fontWeight: 600,
                          textTransform: 'uppercase', letterSpacing: '0.07em',
                          whiteSpace: 'nowrap',
                        }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {overrides.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ padding: '32px 16px', textAlign: 'center', color: T.muted, fontSize: 13 }}>
                          No overrides yet. Add one below.
                        </td>
                      </tr>
                    )}
                    {overrides.map((ov, i) => (
                      <tr
                        key={ov.id}
                        style={{
                          borderBottom: i < overrides.length - 1 ? `1px solid ${T.border}` : 'none',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#1a1a2e')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* Vendor */}
                        <td style={{ padding: '12px 16px' }}>
                          {editingOverride === ov.id ? (
                            <FieldInput value={ov.vendor} onChange={v => updateOverride(ov.id, { vendor: v })} placeholder="Vendor name" width={160} />
                          ) : (
                            <span style={{ fontSize: 13, fontWeight: 600, color: T.primary }}>{ov.vendor || '—'}</span>
                          )}
                        </td>
                        {/* Override type */}
                        <td style={{ padding: '12px 16px' }}>
                          {editingOverride === ov.id ? (
                            <FieldInput value={ov.overrideType} onChange={v => updateOverride(ov.id, { overrideType: v })} placeholder="e.g. Minimum GL" width={140} />
                          ) : (
                            <span style={{
                              background: 'rgba(217,119,6,0.08)', color: T.orange,
                              border: '1px solid rgba(217,119,6,0.20)',
                              borderRadius: 6, padding: '3px 10px',
                              fontSize: 11, fontWeight: 600,
                            }}>
                              {ov.overrideType || '—'}
                            </span>
                          )}
                        </td>
                        {/* Custom req */}
                        <td style={{ padding: '12px 16px' }}>
                          {editingOverride === ov.id ? (
                            <FieldInput value={ov.customReq} onChange={v => updateOverride(ov.id, { customReq: v })} placeholder="Requirement detail" width={200} />
                          ) : (
                            <span style={{ fontSize: 13, color: T.secondary }}>{ov.customReq || '—'}</span>
                          )}
                        </td>
                        {/* Actions */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {editingOverride === ov.id ? (
                              <button
                                onClick={() => { setEditingOverride(null); showToast('Override saved') }}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 5,
                                  background: 'rgba(34,197,94,0.10)', color: T.green,
                                  border: '1px solid rgba(34,197,94,0.25)',
                                  borderRadius: 6, padding: '6px 12px',
                                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                  transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(34,197,94,0.18)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(34,197,94,0.10)')}
                              >
                                <Check size={12} /> Save
                              </button>
                            ) : (
                              <button
                                onClick={() => setEditingOverride(ov.id)}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 5,
                                  background: 'rgba(255,255,255,0.04)', color: T.secondary,
                                  border: `1px solid ${T.border}`,
                                  borderRadius: 6, padding: '6px 12px',
                                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                  transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = T.primary; e.currentTarget.style.borderColor = T.borderAccent }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = T.secondary; e.currentTarget.style.borderColor = T.border }}
                              >
                                <Pencil size={12} /> Edit
                              </button>
                            )}
                            <button
                              onClick={() => removeOverride(ov.id)}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                background: 'rgba(239,68,68,0.07)', color: '#ef4444',
                                border: '1px solid rgba(239,68,68,0.20)',
                                borderRadius: 6, padding: '6px 12px',
                                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                transition: 'all 0.15s',
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

              {/* Add override */}
              <div style={{ padding: '14px 16px', borderTop: `1px solid ${T.border}` }}>
                <button
                  onClick={addOverride}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    background: 'none', color: T.orange,
                    border: `1px solid rgba(217,119,6,0.35)`,
                    borderRadius: 8, padding: '8px 16px',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,119,6,0.08)'; e.currentTarget.style.borderColor = T.orange }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'rgba(217,119,6,0.35)' }}
                >
                  <Plus size={14} /> Add Override
                </button>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}
