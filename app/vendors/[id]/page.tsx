'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Bell, ArrowLeft, Upload, FileText,
  Check, X, AlertTriangle, Eye, Clock,
  CheckCircle2, MessageSquare,
  ChevronDown, ChevronRight,
} from 'lucide-react'
import Sidebar from '../../components/Sidebar'
import COIUploadModal from '../../components/COIUploadModal'
import { UserButton, useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'

// ── Design tokens ─────────────────────────────────────────────────────────────

const T = {
  bg:          '#0a0a0f',
  surface:     '#0f0f17',
  card:        '#13131f',
  border:      '#1a1a2e',
  borderAccent:'#2a2a3e',
  orange:      '#D97706',
  orangeHover: '#B45309',
  green:       '#22c55e',
  amber:       '#fbbf24',
  red:         '#ef4444',
  blue:        '#8b8cf8',
  primary:     '#f8f8f8',
  secondary:   '#8b8fa8',
  muted:       '#4b5063',
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'documents' | 'history' | 'notes'

type CoverageLine = {
  type: string
  eachOccurrence: string
  aggregate: string
  deductible: string
}

type RequirementCheck = {
  coverage: string
  minimum: string
  actual: string
  passed: boolean
  reason: string
}

type AnalysisResult = {
  insuredName?: string | null
  effectiveDate?: string | null
  expirationDate?: string | null
  coverages?: CoverageLine[]
  additionalInsured?: boolean
  waiverOfSubrogation?: boolean
  flags?: string[]
  overallStatus?: string | null
  requirementsCheck?: RequirementCheck[]
}

type Submission = {
  id: string
  status: string | null
  issues_count: number | null
  risk_score: number | null
  analysis_result: AnalysisResult | null
  created_at: string | null

  // Migration 004/005 structured verification columns — promoted from
  // analysis_result so the Findings display can read them directly instead
  // of re-parsing the jsonb blob. NULL on very old, pre-backfill rows.
  overall_status: string | null
  requirements_check: RequirementCheck[] | null
  passed_requirements_count: number | null
  failed_requirements_count: number | null
  is_expired: boolean | null
  effective_date: string | null
  expiration_date: string | null
  additional_insured: boolean | null
  waiver_of_subrogation: boolean | null
}

type Vendor = {
  id: string
  name: string
  type: string | null
  status: string | null
  expiration_date: string | null
  created_at: string | null

  // Optional vendor contact (migration 006). Nullable — most vendors won't
  // have these filled in. Used only to pre-fill the copy-to-clipboard request
  // message; no email is ever sent from the app.
  vendor_email: string | null
  vendor_contact_name: string | null
}

// Trade options a vendor can be categorized under — matches the list used by
// the vendors list page's type filter (app/vendors/page.tsx).
const VENDOR_TYPE_OPTIONS = ['Plumbing', 'Electrical', 'HVAC', 'Roofing', 'Janitorial', 'General Contractor', 'Flooring']

// ── Helpers ───────────────────────────────────────────────────────────────────

function vendorStatusInfo(status: string | null) {
  switch (status) {
    case 'active':        return { label: 'Compliant',      color: T.green,  bg: 'rgba(34,197,94,0.09)',    border: 'rgba(34,197,94,0.22)'   }
    case 'expiring':      return { label: 'Expiring Soon',  color: T.amber,  bg: 'rgba(251,191,36,0.09)',   border: 'rgba(251,191,36,0.22)'  }
    case 'expired':       return { label: 'Expired',        color: T.red,    bg: 'rgba(239,68,68,0.09)',    border: 'rgba(239,68,68,0.22)'   }
    case 'non_compliant': return { label: 'Issues Found',   color: T.orange, bg: 'rgba(217,119,6,0.09)',   border: 'rgba(217,119,6,0.22)'   }
    default:              return { label: 'Pending Review', color: T.blue,   bg: 'rgba(139,140,248,0.09)', border: 'rgba(139,140,248,0.22)' }
  }
}

// overall_status is the 4-value structured status (COMPLIANT / EXPIRING /
// EXPIRED / NON_COMPLIANT) written by migration 004/005 — distinct from the
// 2-value `vendor.status` handled by vendorStatusInfo above.
function overallStatusInfo(status: string | null) {
  switch (status) {
    case 'COMPLIANT':     return { label: 'Compliant',     color: T.green,  bg: 'rgba(34,197,94,0.09)',   border: 'rgba(34,197,94,0.22)'  }
    case 'EXPIRING':      return { label: 'Expiring Soon',  color: T.amber,  bg: 'rgba(251,191,36,0.09)',  border: 'rgba(251,191,36,0.22)' }
    case 'EXPIRED':       return { label: 'Expired',        color: T.red,    bg: 'rgba(239,68,68,0.09)',   border: 'rgba(239,68,68,0.22)'  }
    case 'NON_COMPLIANT': return { label: 'Non-Compliant',  color: T.orange, bg: 'rgba(217,119,6,0.09)',   border: 'rgba(217,119,6,0.22)'  }
    default:               return { label: 'Pending Review', color: T.blue,  bg: 'rgba(139,140,248,0.09)', border: 'rgba(139,140,248,0.22)' }
  }
}

// Simple, non-engine severity/recommendation rule for a failed requirement:
// coverage-LIMIT failures (General Liability, Auto Liability, Workers
// Compensation) are treated as RED/higher-severity; endorsement-style
// failures (Additional Insured, Waiver of Subrogation) as ORANGE. Anything
// else (a custom user-defined requirement) defaults to the limit bucket.
const ENDORSEMENT_COVERAGES = new Set(['Additional Insured', 'Waiver of Subrogation'])

function findingCategory(coverage: string): 'endorsement' | 'limit' {
  return ENDORSEMENT_COVERAGES.has(coverage) ? 'endorsement' : 'limit'
}

function findingStyle(category: 'endorsement' | 'limit') {
  return category === 'endorsement'
    ? { color: T.orange, bg: 'rgba(217,119,6,0.06)',  border: 'rgba(217,119,6,0.22)'  }
    : { color: T.red,    bg: 'rgba(239,68,68,0.06)',  border: 'rgba(239,68,68,0.22)'  }
}

function findingRecommendation(category: 'endorsement' | 'limit'): string {
  return category === 'endorsement' ? 'Request endorsement' : 'Request updated COI'
}

// Builds a plain-text request message pre-filled from the failed requirements
// already on the page (requirements_check, passed=false) — no re-parsing of
// analysis_result, no backend, no email service. The PM copies this to the
// clipboard and pastes it into whatever mail client they use (desktop or
// webmail), so we don't depend on a mailto: handler being registered.
//
// Optional vendor contact (migration 006): if an email is stored we prepend a
// "To: <email>" line so the PM can paste it straight into the recipient field;
// if a contact name is stored the greeting uses it, otherwise it falls back to
// the vendor name. With neither stored, the output is identical to before.
function buildFindingsMessage(
  vendorName: string,
  failedReqs: RequirementCheck[],
  contact?: { email?: string | null; contactName?: string | null },
): string {
  const email        = contact?.email?.trim()
  const greetingName = contact?.contactName?.trim() || vendorName
  // Use the finding's `reason` (the same text shown as "Impact:" on the page),
  // not the raw `actual` limit. On an expired cert every requirement is flipped
  // to failed while its `actual` still holds the healthy value, so "actual $X"
  // would nonsensically list compliant coverage as the problem — the reason
  // says "policy expired 01/01/2026".
  //
  // Expiry-reconciliation reasons already lead with the coverage name
  // ("General Liability policy expired ..."), so they read cleanly on their
  // own. LLM-written limit reasons often don't ("Combined Single Limit of
  // $500,000 is below ..."), so for those we keep a minimal coverage prefix to
  // avoid losing context — without duplicating the name when it's already there.
  const lines = failedReqs.map(r => {
    const reason   = r.reason?.trim() || 'does not meet the requirement'
    const coverage = r.coverage?.trim()
    const alreadyNamed = coverage && reason.toLowerCase().startsWith(coverage.toLowerCase())
    return coverage && !alreadyNamed ? `- ${coverage} ${reason}` : `- ${reason}`
  })

  return [
    ...(email ? [`To: ${email}`, ''] : []),
    `Certificate of Insurance — Action Required for ${vendorName}`,
    '',
    `Hi ${greetingName},`,
    '',
    'Our recent verification of your Certificate of Insurance found the following issue(s):',
    '',
    ...lines,
    '',
    'Please provide an updated Certificate of Insurance addressing the above.',
    '',
    'Thanks,',
  ].join('\n')
}

// Date-only strings (Postgres `date` columns arrive as "2026-01-01") must be
// parsed as LOCAL midnight — new Date("2026-01-01") is UTC midnight per the
// ECMAScript spec, which toLocaleDateString renders as the previous day in
// timezones behind UTC. Full timestamps (created_at) fall through untouched,
// where local-time conversion is the correct behavior.
function parsePlainDate(value: string): Date {
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
  const us = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (us) return new Date(Number(us[3]), Number(us[1]) - 1, Number(us[2]))
  return new Date(value)
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  try { return parsePlainDate(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return '—' }
}

// Long-form date for the Verification History list (e.g. "July 2, 2026"),
// distinct from the short-form fmtDate used elsewhere on this page.
function fmtDateLong(iso: string | null): string {
  if (!iso) return '—'
  try { return parsePlainDate(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }
  catch { return '—' }
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

// ── Verification Summary ─────────────────────────────────────────────────────
// Top section of the Findings display — reads only the structured columns
// (no analysis_result parsing). All four values fall back to '—' when the
// row predates the migration 005 backfill and the columns are still NULL.

function StatTile({ label, value, valueColor }: { label: string; value: React.ReactNode; valueColor?: string }) {
  return (
    <div>
      <p style={{ fontSize: 10, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: 700, color: valueColor ?? T.primary, margin: 0 }}>{value}</p>
    </div>
  )
}

function VerificationSummary({ sub }: { sub: Submission }) {
  const info   = overallStatusInfo(sub.overall_status)
  const passed = sub.passed_requirements_count
  const failed = sub.failed_requirements_count
  const hasCounts = passed !== null && failed !== null
  const total  = hasCounts ? (passed as number) + (failed as number) : 0

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: '0 0 20px' }}>Verification Summary</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
        <StatTile
          label="Overall Status"
          value={
            <span style={{ display: 'inline-block', background: info.bg, color: info.color, border: `1px solid ${info.border}`, borderRadius: 6, padding: '3px 10px', fontSize: 13, fontWeight: 600 }}>
              {info.label}
            </span>
          }
        />
        <StatTile label="Verified" value={fmtDate(sub.created_at)} />
        <StatTile label="Requirements Passed" value={hasCounts ? `${passed}/${total}` : '—'} />
        <StatTile
          label="Open Findings"
          value={failed !== null ? failed : '—'}
          valueColor={failed !== null && failed > 0 ? T.red : T.green}
        />
      </div>
    </div>
  )
}

// ── Open Findings ─────────────────────────────────────────────────────────────
// The priority content: every failed requirement, shown expanded. `reason`
// is the engine's own explanation of the failure (already computed, stored
// verbatim in requirements_check) — reused here as the Impact line rather
// than inventing new copy. Severity color and recommendation follow the
// simple front-end-only rule in findingCategory/findingStyle above.

function OpenFindings({ sub }: { sub: Submission }) {
  if (sub.requirements_check === null) {
    return (
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: '0 0 8px' }}>Open Findings</h3>
        <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>
          Findings data isn&apos;t available for this older submission.
        </p>
      </div>
    )
  }

  const failed = sub.requirements_check.filter(r => !r.passed)

  if (failed.length === 0) {
    return (
      <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.20)', borderRadius: 12, padding: '24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <CheckCircle2 size={20} color={T.green} style={{ flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: T.green, margin: '0 0 3px' }}>All requirements met</p>
          <p style={{ fontSize: 13, color: T.secondary, margin: 0 }}>No open findings on this verification.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: '0 0 12px' }}>Open Findings ({failed.length})</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {failed.map((req, i) => {
          const category = findingCategory(req.coverage)
          const style    = findingStyle(category)
          return (
            <div key={i} style={{ background: style.bg, border: `1px solid ${style.border}`, borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
                <AlertTriangle size={15} color={style.color} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: T.primary }}>{req.coverage}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <p style={{ fontSize: 10, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>Required</p>
                  <p style={{ fontSize: 13, color: T.primary, margin: 0 }}>{req.minimum || '—'}</p>
                </div>
                <div>
                  <p style={{ fontSize: 10, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>Actual</p>
                  <p style={{ fontSize: 13, color: style.color, fontWeight: 600, margin: 0 }}>{req.actual || '—'}</p>
                </div>
              </div>
              <p style={{ fontSize: 13, color: T.secondary, lineHeight: 1.6, margin: '0 0 10px' }}>
                <span style={{ fontWeight: 600, color: T.secondary }}>Impact: </span>{req.reason || 'Does not meet the requirement.'}
              </p>
              <p style={{ fontSize: 13, color: style.color, fontWeight: 600, margin: 0 }}>
                → {findingRecommendation(category)}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Verified Requirements ─────────────────────────────────────────────────────
// Collapsed by default — the passed requirements are confirmatory detail,
// not the priority content.

function VerifiedRequirements({ sub }: { sub: Submission }) {
  const [open, setOpen] = useState(false)

  if (sub.requirements_check === null) return null

  const passed = sub.requirements_check.filter(r => r.passed)
  if (passed.length === 0) return null

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'inherit' }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, color: T.primary }}>Verified Requirements ({passed.length})</span>
        {open ? <ChevronDown size={16} color={T.secondary} /> : <ChevronRight size={16} color={T.secondary} />}
      </button>
      {open && (
        <div style={{ borderTop: `1px solid ${T.border}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px 20px', fontSize: 10, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${T.border}` }}>Coverage</th>
                <th style={{ textAlign: 'left', padding: '10px 20px', fontSize: 10, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${T.border}` }}>Required</th>
                <th style={{ textAlign: 'left', padding: '10px 20px', fontSize: 10, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${T.border}` }}>Actual</th>
                <th style={{ textAlign: 'right', padding: '10px 20px', fontSize: 10, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${T.border}` }}></th>
              </tr>
            </thead>
            <tbody>
              {passed.map((req, i) => (
                <tr key={i}>
                  <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 600, color: T.primary, borderBottom: i < passed.length - 1 ? `1px solid ${T.border}` : 'none' }}>{req.coverage}</td>
                  <td style={{ padding: '12px 20px', fontSize: 12, color: T.secondary, borderBottom: i < passed.length - 1 ? `1px solid ${T.border}` : 'none' }}>{req.minimum || '—'}</td>
                  <td style={{ padding: '12px 20px', fontSize: 12, color: T.secondary, borderBottom: i < passed.length - 1 ? `1px solid ${T.border}` : 'none' }}>{req.actual || '—'}</td>
                  <td style={{ padding: '12px 20px', textAlign: 'right', borderBottom: i < passed.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                    <Check size={14} color={T.green} strokeWidth={2.5} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// Copy-to-clipboard button for the Action Required box. The message is built
// from the failed requirements already on the page. Confirmation ("Copied!")
// only shows after navigator.clipboard.writeText actually resolves — a failed
// write shows a fallback instead, so we never claim success that didn't happen.
function CopyRequestButton({ vendorName, failedReqs, contact }: { vendorName: string; failedReqs: RequirementCheck[]; contact?: { email?: string | null; contactName?: string | null } }) {
  const [state, setState] = useState<'idle' | 'copied' | 'error'>('idle')

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildFindingsMessage(vendorName, failedReqs, contact))
      setState('copied')
    } catch {
      setState('error')
    }
    setTimeout(() => setState('idle'), 2000)
  }

  const label = state === 'copied' ? 'Copied!' : state === 'error' ? 'Copy failed — try again' : 'Copy Request for Vendor'

  return (
    <button
      type="button"
      onClick={handleCopy}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, flexShrink: 0, background: state === 'copied' ? T.green : T.orange, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 12px rgba(217,119,6,0.28)', transition: 'background 0.15s, transform 0.1s' }}
      onMouseEnter={e => { if (state === 'idle') { e.currentTarget.style.background = T.orangeHover } ; e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { if (state === 'idle') { e.currentTarget.style.background = T.orange } ; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {state === 'copied' ? <Check size={15} strokeWidth={2.5} /> : <MessageSquare size={15} />}
      {label}
    </button>
  )
}

// Minimal vendor-contact editor (migration 006). Deliberately capped at email
// + contact name to avoid CRM creep — no address/phone/notes. Writes are
// scoped by clerk_user_id like every other vendor write. Empty inputs are
// persisted as NULL. These two fields feed the copy-to-clipboard request
// message; nothing here sends email.
function VendorContactCard({ vendor, userId, onSaved, showToast }: { vendor: Vendor; userId: string; onSaved: (email: string | null, contactName: string | null) => void; showToast: (m: string) => void }) {
  const [email,       setEmail]       = useState(vendor.vendor_email ?? '')
  const [contactName, setContactName] = useState(vendor.vendor_contact_name ?? '')
  const [saving,      setSaving]      = useState(false)

  const dirty = email.trim() !== (vendor.vendor_email ?? '').trim()
    || contactName.trim() !== (vendor.vendor_contact_name ?? '').trim()

  async function handleSave() {
    const nextEmail       = email.trim() || null
    const nextContactName = contactName.trim() || null
    setSaving(true)
    const { error } = await supabase
      .from('vendors')
      .update({ vendor_email: nextEmail, vendor_contact_name: nextContactName })
      .eq('id', vendor.id)
      .eq('clerk_user_id', userId)
    setSaving(false)
    if (error) {
      showToast('Failed to save vendor contact')
      return
    }
    onSaved(nextEmail, nextContactName)
    showToast('Vendor contact saved')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: T.bg, color: T.primary, border: `1px solid ${T.border}`, borderRadius: 8,
    padding: '9px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: T.secondary, margin: '0 0 6px' }

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <MessageSquare size={15} color={T.muted} />
        <h3 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: 0 }}>Vendor Contact</h3>
      </div>
      <p style={{ fontSize: 12, color: T.muted, margin: '0 0 16px', lineHeight: 1.5 }}>
        Optional. Used to pre-fill the copied request message — no email is sent from CertFlow.
      </p>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 220px', minWidth: 0 }}>
          <p style={labelStyle}>Contact name</p>
          <input
            type="text"
            value={contactName}
            onChange={e => setContactName(e.target.value)}
            placeholder="e.g. Jane Doe"
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = T.borderAccent)}
            onBlur={e => (e.currentTarget.style.borderColor = T.border)}
          />
        </div>
        <div style={{ flex: '1 1 220px', minWidth: 0 }}>
          <p style={labelStyle}>Email</p>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="e.g. insurance@vendor.com"
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = T.borderAccent)}
            onBlur={e => (e.currentTarget.style.borderColor = T.border)}
          />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !dirty}
          style={{ background: dirty ? T.orange : 'rgba(255,255,255,0.06)', color: dirty ? '#fff' : T.muted, border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: saving || !dirty ? 'default' : 'pointer', transition: 'background 0.15s' }}
        >
          {saving ? 'Saving…' : 'Save Contact'}
        </button>
      </div>
    </div>
  )
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ latestSub, vendorName, vendorEmail, vendorContactName }: { latestSub: Submission | null; vendorName: string; vendorEmail: string | null; vendorContactName: string | null }) {
  if (!latestSub) {
    return (
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 40, textAlign: 'center' }}>
        <FileText size={36} color={T.muted} style={{ marginBottom: 16 }} />
        <h3 style={{ fontSize: 16, fontWeight: 700, color: T.primary, margin: '0 0 10px' }}>No COI uploaded yet</h3>
        <p style={{ fontSize: 14, color: T.secondary, margin: '0 0 0', lineHeight: 1.6 }}>
          Upload a Certificate of Insurance to see compliance details for this vendor.
        </p>
      </div>
    )
  }

  const failedCount = latestSub.failed_requirements_count
  const failedReqs  = latestSub.requirements_check?.filter(r => !r.passed) ?? []
  const firstFailed = failedReqs[0] ?? null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <VerificationSummary sub={latestSub} />

      <OpenFindings sub={latestSub} />

      {/* Action Required — kept from the previous layout, driven by the
          structured failed_requirements_count column instead of re-parsing
          analysis_result.flags. The button copies a request message (pre-filled
          from the failed requirements already on the page) to the clipboard —
          there's no vendor email on file and no email service wired up, so the
          PM pastes it into their own mail client, desktop or webmail. */}
      {failedCount !== null && failedCount > 0 && (
        <div style={{ background: 'rgba(217,119,6,0.05)', border: '1px solid rgba(217,119,6,0.20)', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <AlertTriangle size={18} color={T.orange} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.orange, margin: '0 0 5px' }}>Action Required</p>
              <p style={{ fontSize: 13, color: T.secondary, lineHeight: 1.65, margin: 0 }}>
                {firstFailed ? `${firstFailed.coverage} does not meet the minimum` : 'A requirement does not meet the minimum'}
                {failedCount > 1 ? ` and ${failedCount - 1} other issue${failedCount - 1 !== 1 ? 's' : ''}.` : '.'}
              </p>
            </div>
          </div>
          <CopyRequestButton vendorName={vendorName} failedReqs={failedReqs} contact={{ email: vendorEmail, contactName: vendorContactName }} />
        </div>
      )}

      <VerifiedRequirements sub={latestSub} />
    </div>
  )
}

// ── Documents Tab ─────────────────────────────────────────────────────────────

function DocumentsTab({ vendor, submissions, showToast, onUploadClick }: { vendor: Vendor; submissions: Submission[]; showToast: (m: string) => void; onUploadClick: () => void }) {
  const [dragOver, setDragOver] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div
        onClick={onUploadClick}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); onUploadClick() }}
      >
        <div style={{ border: `2px dashed ${dragOver ? T.orange : 'rgba(217,119,6,0.30)'}`, borderRadius: 12, padding: '36px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: dragOver ? 'rgba(217,119,6,0.07)' : 'rgba(217,119,6,0.025)', cursor: 'pointer', transition: 'all 0.2s' }}>
          <div style={{ width: 46, height: 46, borderRadius: 11, background: 'rgba(217,119,6,0.12)', border: '1px solid rgba(217,119,6,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Upload size={20} color={T.orange} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: T.primary, margin: 0 }}>Drop new COI here or click to browse</p>
          <p style={{ fontSize: 12, color: T.secondary, margin: 0 }}>PDF — up to 20MB</p>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: 0 }}>Uploaded Documents</h3>
        </div>
        {submissions.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <FileText size={32} color={T.muted} style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 14, color: T.secondary, margin: 0 }}>No documents uploaded yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Document', 'Uploaded', 'Policy Period', 'Status', 'Actions'].map(col => (
                    <th key={col} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 10, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub, i) => {
                  const ar  = sub.analysis_result
                  const d   = sub.created_at ? new Date(sub.created_at) : null
                  const slug = vendor.name.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/_$/, '')
                  const ds   = d ? `${String(d.getMonth() + 1).padStart(2, '0')}${d.getFullYear()}` : 'unknown'
                  const period = ar?.effectiveDate && ar?.expirationDate
                    ? `${ar.effectiveDate} – ${ar.expirationDate}`
                    : ar?.expirationDate || 'Pending'
                  const stMap: Record<string, { c: string; bg: string; b: string }> = {
                    'Compliant':     { c: T.green,  bg: 'rgba(34,197,94,0.09)',    b: 'rgba(34,197,94,0.22)'   },
                    'Issues Found':  { c: T.orange, bg: 'rgba(217,119,6,0.09)',   b: 'rgba(217,119,6,0.22)'   },
                    'Expiring Soon': { c: T.amber,  bg: 'rgba(251,191,36,0.09)',  b: 'rgba(251,191,36,0.22)'  },
                  }
                  const st = stMap[sub.status ?? ''] ?? { c: T.blue, bg: 'rgba(139,140,248,0.09)', b: 'rgba(139,140,248,0.22)' }

                  return (
                    <tr key={sub.id} style={{ transition: 'background 0.12s', borderBottom: i < submissions.length - 1 ? `1px solid ${T.border}` : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#1a1a2e')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 7, flexShrink: 0, background: 'rgba(217,119,6,0.09)', border: '1px solid rgba(217,119,6,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileText size={14} color={T.orange} />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: T.primary }}>COI_{slug}_{ds}.pdf</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: 12, color: T.secondary, whiteSpace: 'nowrap' }}>{fmtDate(sub.created_at)}</td>
                      <td style={{ padding: '16px', fontSize: 12, color: T.secondary, whiteSpace: 'nowrap' }}>{period}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ background: st.bg, color: st.c, border: `1px solid ${st.b}`, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                          {sub.status || 'Pending Review'}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <button
                          onClick={() => showToast('Document preview coming soon')}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(217,119,6,0.08)', color: T.orange, border: '1px solid rgba(217,119,6,0.20)', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(217,119,6,0.16)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(217,119,6,0.08)')}
                        >
                          <Eye size={12} /> View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ── History Tab ───────────────────────────────────────────────────────────────

// ── Verification History Tab ─────────────────────────────────────────────────
// Read-only, newest-first list — one row per submissions row (each row IS a
// verification). Reads only the structured columns already loaded with
// `submissions` (overall_status, passed/failed_requirements_count,
// created_at) — no analysis_result parsing, no engine/route.ts changes.

function VerificationHistoryTab({ submissions }: { submissions: Submission[] }) {
  if (submissions.length === 0) {
    return (
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 40, textAlign: 'center' }}>
        <Clock size={32} color={T.muted} style={{ marginBottom: 12 }} />
        <p style={{ fontSize: 14, color: T.secondary, margin: 0 }}>No verifications yet.</p>
      </div>
    )
  }

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 28 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: '0 0 28px' }}>Verification History</h3>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 11, top: 14, bottom: 14, width: 1, background: T.border }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {submissions.map((sub, i) => {
            // Pre-backfill rows (very old) have overall_status still NULL —
            // fall back to a muted "details unavailable" row instead of
            // guessing at status/counts or showing a false "0/0".
            const unavailable = sub.overall_status === null
            const info   = overallStatusInfo(sub.overall_status)
            const passed = sub.passed_requirements_count
            const failed = sub.failed_requirements_count
            const hasCounts = passed !== null && failed !== null
            const total  = hasCounts ? (passed as number) + (failed as number) : 0
            const dotColor = unavailable ? T.muted : info.color

            return (
              <div key={sub.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 18, paddingBottom: i < submissions.length - 1 ? 24 : 0 }}>
                <div style={{ width: 23, height: 23, borderRadius: '50%', flexShrink: 0, zIndex: 1, background: unavailable ? 'rgba(75,80,99,0.12)' : info.bg, border: `2px solid ${dotColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {unavailable
                    ? <Clock size={10} color={T.muted} />
                    : sub.overall_status === 'COMPLIANT'
                      ? <Check size={11} color={T.green} strokeWidth={2.5} />
                      : <AlertTriangle size={10} color={dotColor} />}
                </div>
                <div style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = T.borderAccent)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      {!unavailable && (
                        <span style={{ background: info.bg, color: info.color, border: `1px solid ${info.border}`, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                          {info.label}
                        </span>
                      )}
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.primary }}>{fmtDateLong(sub.created_at)}</span>
                    </div>
                    {unavailable ? (
                      <p style={{ fontSize: 12, color: T.muted, fontStyle: 'italic', margin: 0 }}>Details unavailable for this submission</p>
                    ) : (
                      <p style={{ fontSize: 12, color: T.secondary, margin: 0 }}>
                        {hasCounts ? `Verified ${passed} / ${total} Requirements` : 'Requirements data unavailable'}
                        {' · '}
                        {failed !== null ? `${failed} Finding${failed !== 1 ? 's' : ''}` : '— Findings'}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/report/${sub.id}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0, fontSize: 12, fontWeight: 600, color: T.orange, textDecoration: 'none', whiteSpace: 'nowrap', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = T.orangeHover)}
                    onMouseLeave={e => (e.currentTarget.style.color = T.orange)}
                  >
                    View Verification →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Notes Tab ─────────────────────────────────────────────────────────────────

function NotesTab() {
  const [noteText,     setNoteText]     = useState('')
  const [saveFeedback, setSaveFeedback] = useState(false)
  const [notes,        setNotes]        = useState<Array<{ text: string; timestamp: string }>>([])

  function handleSave() {
    if (!noteText.trim()) return
    const ts = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    setNotes(prev => [{ text: noteText.trim(), timestamp: ts }, ...prev])
    setNoteText('')
    setSaveFeedback(true)
    setTimeout(() => setSaveFeedback(false), 2500)
  }

  const canSave = noteText.trim().length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: '0 0 6px' }}>Add Note</h3>
        <p style={{ fontSize: 12, color: T.muted, margin: '0 0 16px' }}>Internal notes — not visible to the vendor.</p>
        <textarea
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          placeholder="Add notes about this vendor..."
          rows={4}
          style={{ width: '100%', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 14px', fontSize: 14, color: T.primary, outline: 'none', resize: 'vertical', fontFamily: 'Inter, -apple-system, sans-serif', lineHeight: 1.65, transition: 'border-color 0.15s', boxSizing: 'border-box' }}
          onFocus={e => (e.target.style.borderColor = T.orange)}
          onBlur={e => (e.target.style.borderColor = T.border)}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: canSave ? T.orange : 'rgba(217,119,6,0.25)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: canSave ? 'pointer' : 'not-allowed', transition: 'background 0.15s, transform 0.1s' }}
            onMouseEnter={e => { if (canSave) { e.currentTarget.style.background = T.orangeHover; e.currentTarget.style.transform = 'translateY(-1px)' } }}
            onMouseLeave={e => { if (canSave) { e.currentTarget.style.background = T.orange; e.currentTarget.style.transform = 'translateY(0)' } }}
          >
            <MessageSquare size={14} /> Save Note
          </button>
          {saveFeedback && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={14} color={T.green} />
              <span style={{ fontSize: 13, color: T.green, fontWeight: 500 }}>Saved</span>
            </div>
          )}
        </div>
      </div>
      {notes.map((note, i) => (
        <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 18px', transition: 'border-color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = T.borderAccent)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
        >
          <p style={{ fontSize: 14, color: T.secondary, lineHeight: 1.75, margin: '0 0 10px' }}>{note.text}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Clock size={11} color={T.muted} />
            <span style={{ fontSize: 11, color: T.muted }}>{note.timestamp}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VendorProfile() {
  const params          = useParams()
  const id              = params.id as string
  const { user, isLoaded } = useUser()

  const [vendor,        setVendor]        = useState<Vendor | null>(null)
  const [submissions,   setSubmissions]   = useState<Submission[]>([])
  const [loading,       setLoading]       = useState(true)
  const [notFound,      setNotFound]      = useState(false)
  const [activeTab,     setActiveTab]     = useState<Tab>('overview')
  const [toastMsg,      setToastMsg]      = useState('')
  const [toastVisible,  setToastVisible]  = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [refreshKey,    setRefreshKey]    = useState(0)
  const [editingType,   setEditingType]  = useState(false)
  const [savingType,    setSavingType]   = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const loadData = useCallback(async () => {
    if (!user) return
    const [vRes, sRes] = await Promise.all([
      supabase
        .from('vendors')
        .select('id, name, type, status, expiration_date, created_at, vendor_email, vendor_contact_name')
        .eq('id', id)
        .eq('clerk_user_id', user.id)
        .single(),
      supabase
        .from('submissions')
        .select(`
          id, status, issues_count, risk_score, analysis_result, created_at,
          overall_status, requirements_check, passed_requirements_count, failed_requirements_count,
          is_expired, effective_date, expiration_date, additional_insured, waiver_of_subrogation
        `)
        .eq('vendor_id', id)
        .eq('clerk_user_id', user.id)
        .order('created_at', { ascending: false }),
    ])
    if (vRes.error || !vRes.data) {
      setNotFound(true)
    } else {
      setVendor(vRes.data as Vendor)
      setSubmissions((sRes.data ?? []) as Submission[])
    }
    setLoading(false)
  }, [id, user])

  useEffect(() => {
    if (!isLoaded) return
    if (!user) { setLoading(false); return }
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user, loadData, refreshKey])

  function showToast(msg: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToastMsg(msg)
    setToastVisible(true)
    timerRef.current = setTimeout(() => setToastVisible(false), 3000)
  }

  async function handleSetType(newType: string) {
    if (!user || !vendor) return
    setSavingType(true)
    const { error } = await supabase
      .from('vendors')
      .update({ type: newType })
      .eq('id', vendor.id)
      .eq('clerk_user_id', user.id)
    setSavingType(false)
    if (error) {
      showToast('Failed to update vendor type')
      return
    }
    setVendor(v => (v ? { ...v, type: newType } : v))
    setEditingType(false)
    showToast('Vendor type updated')
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview',  label: 'Overview'  },
    { key: 'documents', label: 'Documents' },
    { key: 'history',   label: 'Verification History' },
    { key: 'notes',     label: 'Notes'     },
  ]

  const shell = (children: React.ReactNode) => (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: 'Inter, -apple-system, sans-serif', color: T.primary }}>
      <Sidebar />
      <main style={{ marginLeft: 240, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </main>
    </div>
  )

  if (!isLoaded || loading) return shell(<div style={{ color: T.secondary, fontSize: 14 }}>Loading vendor…</div>)

  if (notFound || !vendor) return shell(
    <div style={{ textAlign: 'center' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: T.primary, marginBottom: 12 }}>Vendor not found</h2>
      <p style={{ fontSize: 14, color: T.secondary, marginBottom: 24 }}>This vendor doesn&apos;t exist or you don&apos;t have access.</p>
      <Link href="/vendors" style={{ background: T.orange, color: '#fff', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
        Back to Vendors
      </Link>
    </div>
  )

  const statusInfo = vendorStatusInfo(vendor.status)
  const latestSub  = submissions[0] ?? null

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: 'Inter, -apple-system, sans-serif', color: T.primary }}>
      <Toast message={toastMsg} visible={toastVisible} />
      <Sidebar />

      {showUploadModal && (
        <COIUploadModal
          vendorId={vendor.id}
          vendorName={vendor.name}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => setRefreshKey(k => k + 1)}
        />
      )}

      <main style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        <header style={{ position: 'sticky', top: 0, zIndex: 40, background: T.bg, borderBottom: `1px solid ${T.border}`, height: 64, padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: T.primary, margin: 0, lineHeight: 1.2 }}>Vendor Profile</h1>
            <p style={{ fontSize: 12, color: T.secondary, margin: 0 }}>{vendor.name}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button style={{ position: 'relative', background: 'none', border: `1px solid ${T.border}`, borderRadius: 8, width: 38, height: 38, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.secondary, transition: 'border-color 0.15s, color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.orange; e.currentTarget.style.color = T.primary }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.secondary }}
            >
              <Bell size={17} />
            </button>
            <UserButton />
          </div>
        </header>

        <div style={{ padding: 28, flex: 1 }}>

          <Link href="/vendors" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: T.secondary, textDecoration: 'none', fontWeight: 500, marginBottom: 22, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = T.primary)}
            onMouseLeave={e => (e.currentTarget.style.color = T.secondary)}
          >
            <ArrowLeft size={15} /> Back to Vendors
          </Link>

          {/* Vendor hero block */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 26 }}>
            <div>
              <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, color: T.primary, margin: '0 0 12px', letterSpacing: '-0.8px' }}>
                {vendor.name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {editingType ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <select
                      autoFocus
                      defaultValue={vendor.type ?? ''}
                      disabled={savingType}
                      onChange={e => e.target.value && handleSetType(e.target.value)}
                      onBlur={() => setEditingType(false)}
                      style={{ background: T.card, color: T.primary, border: `1px solid ${T.borderAccent}`, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 500, outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      <option value="" disabled>Select type…</option>
                      {VENDOR_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button
                      onClick={() => setEditingType(false)}
                      title="Cancel"
                      style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', padding: 2, display: 'flex' }}
                    >
                      <X size={13} />
                    </button>
                  </span>
                ) : vendor.type ? (
                  <button
                    onClick={() => setEditingType(true)}
                    title="Change vendor type"
                    style={{ background: 'rgba(255,255,255,0.05)', color: T.secondary, border: `1px solid ${T.border}`, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 0.15s, color 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderAccent; e.currentTarget.style.color = T.primary }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.secondary }}
                  >
                    {vendor.type}
                  </button>
                ) : (
                  <button
                    onClick={() => setEditingType(true)}
                    title="Set this vendor's type"
                    style={{ background: 'rgba(217,119,6,0.08)', color: T.orange, border: '1px dashed rgba(217,119,6,0.35)', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600, fontStyle: 'italic', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,119,6,0.14)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(217,119,6,0.08)' }}
                  >
                    Untyped — set type
                  </button>
                )}
                <span style={{ background: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>
                  {statusInfo.label}
                </span>
                {vendor.expiration_date && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Clock size={13} color={T.muted} />
                    <span style={{ fontSize: 12, color: T.muted }}>Exp: {fmtDate(vendor.expiration_date)}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowUploadModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, flexShrink: 0, background: T.orange, color: '#fff', border: 'none', borderRadius: 9, padding: '11px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 14px rgba(217,119,6,0.28)', transition: 'background 0.15s, transform 0.1s' }}
              onMouseEnter={e => { e.currentTarget.style.background = T.orangeHover; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = T.orange; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <Upload size={14} /> Upload New COI
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${T.border}`, marginBottom: 22 }}>
            {TABS.map(tab => {
              const active = activeTab === tab.key
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '11px 20px', fontSize: 14, fontWeight: active ? 600 : 500, color: active ? T.primary : T.secondary, borderBottom: `2px solid ${active ? T.orange : 'transparent'}`, marginBottom: -1, transition: 'color 0.15s, border-color 0.15s' }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = T.primary }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = T.secondary }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {activeTab === 'overview'  && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <OverviewTab latestSub={latestSub} vendorName={vendor.name} vendorEmail={vendor.vendor_email} vendorContactName={vendor.vendor_contact_name} />
              <VendorContactCard
                vendor={vendor}
                userId={user!.id}
                onSaved={(email, contactName) => setVendor(v => (v ? { ...v, vendor_email: email, vendor_contact_name: contactName } : v))}
                showToast={showToast}
              />
            </div>
          )}
          {activeTab === 'documents' && <DocumentsTab vendor={vendor} submissions={submissions} showToast={showToast} onUploadClick={() => setShowUploadModal(true)} />}
          {activeTab === 'history'   && <VerificationHistoryTab submissions={submissions} />}
          {activeTab === 'notes'     && <NotesTab />}
        </div>
      </main>
    </div>
  )
}
