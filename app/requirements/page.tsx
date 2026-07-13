'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Check, CheckCircle2, Zap, SlidersHorizontal } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { UserButton } from '@clerk/nextjs'

// ── Design tokens ─────────────────────────────────────────────────────────────

// Design Bible tokens (see app/page.tsx appendix) — carbon ground, graphite
// surfaces, seam hairlines. Orange is EARNED: verified/affirmed states + the
// primary CTA only. No green, no purple.
const T = {
  bg: '#0C0E12',           // --carbon
  surface: '#0C0E12',      // inputs sit back on carbon
  card: '#171A21',         // --graphite
  border: '#262B35',       // --seam
  borderAccent: '#333A47',
  orange: '#F97316',       // --verified
  orangeHover: '#EA6A0C',
  primary: '#F2F4F8',      // --ink-primary
  secondary: '#9AA3B2',    // --ink-secondary
  muted: '#5F6774',
  voice: 'var(--font-voice), sans-serif',      // Said
  evidence: 'var(--font-evidence), monospace', // Recorded — every datum
}

// Clerk UserButton themed to the Bible palette — purple is banned. Function
// untouched; this only recolors the avatar ring and the popover surfaces.
const CLERK_APPEARANCE = {
  variables: {
    colorPrimary: '#F97316',
    colorBackground: '#171A21',
    colorText: '#F2F4F8',
    colorTextSecondary: '#9AA3B2',
    colorInputBackground: '#0C0E12',
    colorInputText: '#F2F4F8',
    colorNeutral: '#F2F4F8',
    borderRadius: '8px',
  },
  elements: {
    userButtonAvatarBox: { border: '1px solid #262B35' },
    userButtonPopoverCard: { background: '#171A21', border: '1px solid #262B35' },
  },
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Requirement {
  id: number
  coverage: string
  enabled: boolean
  amount: string
  notes: string
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 300,
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 8, padding: '12px 18px',
      display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
      transition: 'opacity 0.25s ease, transform 0.25s ease',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(-12px)',
      pointerEvents: 'none',
    }}>
      <CheckCircle2 size={16} color={T.orange} />
      <span style={{ fontSize: 13, fontWeight: 600, color: T.primary }}>{message}</span>
    </div>
  )
}

// ── Toggle switch ─────────────────────────────────────────────────────────────

// ON = --verified orange: an enabled requirement is an active, affirmed
// standard — Covira's verified state, so the orange is earned (§Color).
// OFF = neutral seam track with an ink-secondary knob; the affordance is
// knob position + fill, not hue.
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        width: 40, height: 22, borderRadius: 11, cursor: 'pointer',
        background: on ? T.orange : 'transparent',
        border: `1px solid ${on ? T.orange : T.border}`,
        position: 'relative', flexShrink: 0,
        transition: 'background 0.2s, border-color 0.2s',
        padding: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 2,
        left: on ? 20 : 2,
        width: 16, height: 16, borderRadius: '50%',
        background: on ? '#fff' : T.secondary,
        transition: 'left 0.2s, background 0.2s',
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
        borderRadius: 8, padding: '6px 10px',
        fontSize: 13, color: T.primary, outline: 'none',
        width, transition: 'border-color 0.15s',
        // Recorded standards, not prose — values are set in the evidence mono.
        fontFamily: T.evidence, fontVariantNumeric: 'tabular-nums',
      }}
      onFocus={e => (e.target.style.borderColor = T.borderAccent)}
      onBlur={e => (e.target.style.borderColor = T.border)}
    />
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const DEFAULT_REQS: Requirement[] = [
  { id: 1, coverage: 'General Liability',    enabled: true, amount: '$1,000,000', notes: 'Per occurrence limit'   },
  { id: 2, coverage: 'Auto Liability',       enabled: true, amount: '$1,000,000', notes: 'Combined single limit'  },
  { id: 3, coverage: 'Workers Compensation', enabled: true, amount: 'Statutory',  notes: 'Required in all states' },
  { id: 4, coverage: 'Additional Insured',   enabled: true, amount: 'Required',   notes: 'Must name your company' },
  { id: 5, coverage: 'Waiver of Subrogation',enabled: true, amount: 'Required',   notes: 'Must be included'       },
]

const TEMPLATES = [
  {
    name: 'Plumbing & HVAC',
    desc: 'Standard limits for plumbing, HVAC, and mechanical trade work',
    presets: [
      { id: 1, enabled: true,  amount: '$1,000,000', notes: 'Per occurrence, trade contractor standard' },
      { id: 2, enabled: true,  amount: '$1,000,000', notes: 'Combined single limit'                     },
      { id: 3, enabled: true,  amount: 'Statutory',  notes: 'Required for all field workers'            },
      { id: 4, enabled: true,  amount: 'Required',   notes: 'Must name your company'                    },
      { id: 5, enabled: true,  amount: 'Required',   notes: 'Must be included'                          },
    ],
  },
  {
    name: 'Electrical',
    desc: 'Higher GL limits for the elevated risk of electrical work',
    presets: [
      { id: 1, enabled: true,  amount: '$2,000,000', notes: 'Higher limit for electrical risk'          },
      { id: 2, enabled: true,  amount: '$1,000,000', notes: 'Combined single limit'                     },
      { id: 3, enabled: true,  amount: 'Statutory',  notes: 'Required for all field workers'            },
      { id: 4, enabled: true,  amount: 'Required',   notes: 'Must name your company'                    },
      { id: 5, enabled: true,  amount: 'Required',   notes: 'Must be included'                          },
    ],
  },
  {
    name: 'General Contractor',
    desc: 'Maximum limits for GC work with subcontractors and structural scope',
    presets: [
      { id: 1, enabled: true,  amount: '$5,000,000', notes: 'Per occurrence, GC aggregate required'     },
      { id: 2, enabled: true,  amount: '$2,000,000', notes: 'Combined single limit'                     },
      { id: 3, enabled: true,  amount: 'Statutory',  notes: 'Required for all workers and subs'         },
      { id: 4, enabled: true,  amount: 'Required',   notes: 'Must name your company and owner'          },
      { id: 5, enabled: true,  amount: 'Required',   notes: 'Must be included'                          },
    ],
  },
  {
    name: 'Roofing',
    desc: 'Elevated limits for the high structural and fall-hazard risk of roofing',
    presets: [
      { id: 1, enabled: true,  amount: '$2,000,000', notes: 'Structural and fall liability'             },
      { id: 2, enabled: true,  amount: '$1,000,000', notes: 'Combined single limit'                     },
      { id: 3, enabled: true,  amount: 'Statutory',  notes: 'High injury rate — required'               },
      { id: 4, enabled: true,  amount: 'Required',   notes: 'Must name your company'                    },
      { id: 5, enabled: true,  amount: 'Required',   notes: 'Must be included'                          },
    ],
  },
  {
    name: 'Snow Removal',
    desc: 'Higher limits for seasonal slip-and-fall and property damage exposure',
    presets: [
      { id: 1, enabled: true,  amount: '$1,000,000', notes: 'Slip-and-fall and plowing damage'          },
      { id: 2, enabled: true,  amount: '$1,000,000', notes: 'Plow trucks and salt spreaders'            },
      { id: 3, enabled: true,  amount: 'Statutory',  notes: 'Required for all field workers'            },
      { id: 4, enabled: true,  amount: 'Required',   notes: 'Must name your company'                    },
      { id: 5, enabled: true,  amount: 'Required',   notes: 'Must be included'                          },
    ],
  },
  {
    name: 'Pest Control',
    desc: 'Standard limits covering chemical application and treatment liability',
    presets: [
      { id: 1, enabled: true,  amount: '$1,000,000', notes: 'Chemical application liability'            },
      { id: 2, enabled: true,  amount: '$1,000,000', notes: 'Chemical transport vehicles'               },
      { id: 3, enabled: true,  amount: 'Statutory',  notes: 'Required for all field workers'            },
      { id: 4, enabled: true,  amount: 'Required',   notes: 'Must name your company'                    },
      { id: 5, enabled: true,  amount: 'Required',   notes: 'Must be included'                          },
    ],
  },
  {
    name: 'Landscaping',
    desc: 'Lower limits for routine grounds maintenance and exterior work',
    presets: [
      { id: 1, enabled: true,  amount: '$500,000',   notes: 'Per occurrence'                            },
      { id: 2, enabled: true,  amount: '$500,000',   notes: 'Combined single limit'                     },
      { id: 3, enabled: true,  amount: 'Statutory',  notes: 'Required for all field workers'            },
      { id: 4, enabled: true,  amount: 'Required',   notes: 'Must name your company'                    },
      { id: 5, enabled: false, amount: 'Required',   notes: 'Recommended but not required'              },
    ],
  },
  {
    name: 'Cleaning / Janitorial',
    desc: 'Standard limits for routine cleaning, janitorial, and housekeeping vendors',
    presets: [
      { id: 1, enabled: true,  amount: '$500,000',   notes: 'Property damage and slip-and-fall'         },
      { id: 2, enabled: true,  amount: '$500,000',   notes: 'Combined single limit'                     },
      { id: 3, enabled: true,  amount: 'Statutory',  notes: 'Required for all workers'                  },
      { id: 4, enabled: true,  amount: 'Required',   notes: 'Must name your company'                    },
      { id: 5, enabled: false, amount: 'Required',   notes: 'Recommended but not required'              },
    ],
  },
  {
    name: 'General Maintenance',
    desc: 'Standard limits for general repair, handyman, and maintenance vendors',
    presets: [
      { id: 1, enabled: true,  amount: '$1,000,000', notes: 'Per occurrence, general work'              },
      { id: 2, enabled: true,  amount: '$500,000',   notes: 'Combined single limit'                     },
      { id: 3, enabled: true,  amount: 'Statutory',  notes: 'Required for all field workers'            },
      { id: 4, enabled: true,  amount: 'Required',   notes: 'Must name your company'                    },
      { id: 5, enabled: false, amount: 'Required',   notes: 'Recommended but not required'              },
    ],
  },
]

export default function RequirementsPage() {
  const [reqs, setReqs] = useState<Requirement[]>(DEFAULT_REQS)
  const [toastMsg, setToastMsg]     = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [saving, setSaving]         = useState(false)
  const [loading, setLoading]       = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/requirements')
      .then(r => r.json())
      .then(({ requirements }) => {
        if (Array.isArray(requirements) && requirements.length > 0) {
          setReqs(requirements)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function saveRequirements() {
    setSaving(true)
    try {
      const res = await fetch('/api/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirements: reqs }),
      })
      if (!res.ok) throw new Error('Failed to save')
      showToast('Requirements saved')
    } catch {
      showToast('Save failed — try again')
    } finally {
      setSaving(false)
    }
  }

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

  function applyTemplate(template: typeof TEMPLATES[number]) {
    setReqs(prev => prev.map(r => {
      const preset = template.presets.find(p => p.id === r.id)
      return preset ? { ...r, ...preset } : r
    }))
    showToast(`"${template.name}" template applied — review above and click Save Requirements`)
  }

  // Abbreviates an actual template preset amount (e.g. "$2,000,000" → "$2M")
  // for the compact card summary — purely a display reformat of the real
  // value already set on that preset, never a different number.
  function abbreviateAmount(amount: string): string {
    const m = amount.match(/^\$([\d,]+)$/)
    if (!m) return amount
    const num = Number(m[1].replace(/,/g, ''))
    if (num !== 0 && num % 1_000_000 === 0) return `$${num / 1_000_000}M`
    if (num !== 0 && num % 1_000 === 0)     return `$${num / 1_000}K`
    return amount
  }

  // Summarizes the actual GL / Auto / WC limits this template sets (ids 1-3
  // in DEFAULT_REQS order), pulled directly from tmpl.presets.
  function templateLimitsSummary(template: typeof TEMPLATES[number]): string {
    const labels: Record<number, string> = { 1: 'GL', 2: 'Auto', 3: 'WC' }
    return [1, 2, 3]
      .map(id => template.presets.find(p => p.id === id))
      .filter((p): p is typeof template.presets[number] => !!p)
      .map(p => `${labels[p.id]} ${abbreviateAmount(p.amount)}`)
      .join(' · ')
  }

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: T.bg, fontFamily: T.voice,
      color: T.primary, position: 'relative', isolation: 'isolate',
    }}>
      <style>{`
        /* Page ledger-grid — same 24px hairline texture as the landing and
           the other app pages, z -1 inside the isolated root: above the
           carbon ground, below all content. */
        .page-ledger-grid {
          position: absolute; inset: 0; z-index: -1; pointer-events: none;
          --grid-line: rgba(154,163,178, 0.06);
          background-image:
            repeating-linear-gradient(to bottom, var(--grid-line) 0, var(--grid-line) 1px, transparent 1px, transparent 24px),
            repeating-linear-gradient(to right,  var(--grid-line) 0, var(--grid-line) 1px, transparent 1px, transparent 24px);
        }
      `}</style>
      <div className="page-ledger-grid" aria-hidden="true" />
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
            <h1 style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em', color: T.primary, margin: 0, lineHeight: 1.2 }}>
              Requirements
            </h1>
            <p style={{ fontSize: 12, color: T.secondary, margin: 0 }}>
              Set the minimum insurance standards checked on every COI you analyze
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={saveRequirements}
              disabled={saving || loading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: saving || loading ? T.orangeHover : T.orange,
                color: '#fff', border: 'none',
                borderRadius: 8, padding: '8px 16px',
                fontSize: 13, fontWeight: 600,
                cursor: saving || loading ? 'not-allowed' : 'pointer',
                opacity: saving || loading ? 0.7 : 1,
                fontFamily: 'inherit',
                transition: 'background 0.15s, transform 0.1s',
              }}
              onMouseEnter={e => { if (!saving && !loading) { e.currentTarget.style.background = T.orangeHover; e.currentTarget.style.transform = 'translateY(-1px)' } }}
              onMouseLeave={e => { e.currentTarget.style.background = saving || loading ? T.orangeHover : T.orange; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <Check size={14} /> {saving ? 'Saving…' : loading ? 'Loading…' : 'Save Requirements'}
            </button>

            <button style={{
              position: 'relative', background: 'none',
              border: `1px solid ${T.border}`, borderRadius: 8,
              width: 38, height: 38, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: T.secondary, transition: 'border-color 0.15s, color 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderAccent; e.currentTarget.style.color = T.primary }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.secondary }}
            >
              <Bell size={17} />
              <span style={{
                position: 'absolute', top: 9, right: 9,
                width: 7, height: 7, borderRadius: '50%',
                background: T.orange, border: `2px solid ${T.bg}`,
              }} />
            </button>

            <UserButton appearance={CLERK_APPEARANCE} />
          </div>
        </header>

        {/* ── Content ── */}
        <div style={{ padding: 28, flex: 1, display: 'flex', flexDirection: 'column', gap: 28 }}>

          <p style={{ fontSize: 13, color: T.secondary, margin: 0, lineHeight: 1.7, maxWidth: 720 }}>
            These standards define the minimum insurance coverage every vendor must carry. Every Certificate of Insurance you upload is automatically verified against these requirements to determine its compliance status.
          </p>

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
              borderRadius: 8, overflow: 'hidden',
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
                  onMouseEnter={e => (e.currentTarget.style.background = '#1C2029')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: 14, fontWeight: 600, color: T.primary }}>
                    {req.coverage}
                  </span>
                  <Toggle on={req.enabled} onChange={v => updateReq(req.id, { enabled: v })} />
                  <FieldInput
                    value={req.amount}
                    onChange={v => updateReq(req.id, { amount: v })}
                    placeholder="e.g. $1,000,000"
                    width={140}
                  />
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
                Pre-fill the requirements above with suggested starting values for a vendor type — then review and click Save Requirements to apply.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 12,
            }}>
              {TEMPLATES.map(tmpl => (
                <div
                  key={tmpl.name}
                  style={{
                    background: T.card, border: `1px solid ${T.border}`,
                    borderRadius: 8, padding: '18px 16px',
                    display: 'flex', flexDirection: 'column', gap: 10,
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = T.borderAccent
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = T.border
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 2,
                    border: `1px solid ${T.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Zap size={15} color={T.secondary} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: T.primary, margin: '0 0 4px' }}>
                      {tmpl.name}
                    </p>
                    <p style={{ fontSize: 11, color: T.secondary, margin: '0 0 6px', lineHeight: 1.5 }}>
                      {tmpl.desc}
                    </p>
                    {/* Limit strings are DATA — recorded in the evidence
                        mono, ink-primary. Not a status, so no orange. */}
                    <p style={{ fontSize: 11, fontFamily: T.evidence, fontVariantNumeric: 'tabular-nums', color: T.primary, margin: 0 }}>
                      {templateLimitsSummary(tmpl)}
                    </p>
                  </div>
                  {/* Secondary action — ghost button, seam hairline, ink
                      text; orange appears only on hover so nine identical
                      buttons don't compete with the primary CTA (§Color). */}
                  <button
                    onClick={() => applyTemplate(tmpl)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      background: 'none', color: T.primary,
                      border: `1px solid ${T.border}`,
                      borderRadius: 8, padding: '7px 10px',
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'background 0.15s, border-color 0.15s',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(249,115,22,0.06)'; e.currentTarget.style.borderColor = 'rgba(249,115,22,0.45)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = T.border }}
                  >
                    <Zap size={11} /> Apply Template
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* ── Vendor-Specific Overrides — Coming Soon ── */}
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
              borderRadius: 8, padding: 24,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <SlidersHorizontal size={15} color={T.muted} />
                <h3 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: 0 }}>
                  Per-Vendor Requirements
                </h3>
                <span style={{
                  fontSize: 11, fontFamily: T.evidence, color: T.muted,
                  background: 'transparent', border: `1px solid ${T.border}`,
                  borderRadius: 2, padding: '2px 9px',
                }}>
                  Coming Soon
                </span>
              </div>
              <p style={{ fontSize: 13, color: T.secondary, margin: 0, lineHeight: 1.7 }}>
                Vendor-specific overrides are coming soon. You&apos;ll be able to set higher or lower requirements for individual vendors — for example, requiring a $2M GL limit from a specific roofing contractor while keeping the default at $1M for everyone else.
              </p>
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}
