'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Bell, User, Check, Upload as UploadIcon, ChevronDown } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { UserButton } from '@clerk/nextjs'

// ─── Types ────────────────────────────────────────────────────────────────────

type Coverage = {
  type: string
  eachOccurrence: string
  aggregate: string
  deductible: string
}

type COIData = {
  insuredName: string
  insuredAddress: string
  effectiveDate: string
  expirationDate: string
  isExpired: boolean
  daysUntilExpiration: number
  coverages: Coverage[]
  additionalInsured: boolean
  waiverOfSubrogation: boolean
  certificateHolder: string
  producer: string
  flags: string[]
  overallStatus: 'COMPLIANT' | 'EXPIRING' | 'EXPIRED' | 'NON_COMPLIANT'
}

type Requirements = {
  glLimit: string
  requireWorkersComp: boolean
  requireAdditionalInsured: boolean
  requireWaiverOfSubrogation: boolean
}

type SessionEntry = {
  id: string
  fileName: string
  result: COIData
  normalizedStatus: keyof typeof statusConfig
  s: (typeof statusConfig)[keyof typeof statusConfig]
  requirementFlags: string[]
}

// ─── Status config ────────────────────────────────────────────────────────────

const statusConfig = {
  COMPLIANT: {
    bg: 'rgba(16,185,129,0.08)',
    color: '#6ee7b7',
    border: 'rgba(16,185,129,0.28)',
    badge: '#10b981',
    label: 'PASS',
    headline: 'This vendor is properly covered',
    subtext: "All coverage requirements are met. You're safe to proceed.",
    icon: '✓',
  },
  EXPIRING: {
    bg: 'rgba(217,119,6,0.08)',
    color: '#fbbf24',
    border: 'rgba(217,119,6,0.30)',
    badge: '#d97706',
    label: 'EXPIRING SOON',
    headline: 'Coverage is expiring soon',
    subtext: 'Request a renewed certificate before this one expires to avoid a coverage gap.',
    icon: '!',
  },
  EXPIRED: {
    bg: 'rgba(239,68,68,0.08)',
    color: '#fca5a5',
    border: 'rgba(239,68,68,0.28)',
    badge: '#ef4444',
    label: 'FAIL',
    headline: "This vendor's insurance has expired",
    subtext: 'Do not allow this vendor on your property until they provide a current certificate.',
    icon: '✕',
  },
  NON_COMPLIANT: {
    bg: 'rgba(239,68,68,0.08)',
    color: '#fca5a5',
    border: 'rgba(239,68,68,0.28)',
    badge: '#ef4444',
    label: 'FAIL',
    headline: 'Coverage does not meet requirements',
    subtext: 'There are compliance issues that must be resolved before this vendor can work on your property.',
    icon: '✕',
  },
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

function humanizeFlag(flag: string): { title: string; detail: string } {
  const f = flag.toLowerCase()
  if (f.includes('expired') || (f.includes('expir') && !f.includes('expiring soon') && !f.includes('below'))) {
    return { title: 'Insurance has expired', detail: "This vendor's policy is no longer active. Do not allow them on your property until they provide a current, valid certificate." }
  }
  if (f.includes('additional insured') || f.includes('additional_insured')) {
    return { title: "Your property isn't listed as Additional Insured", detail: "Your property needs to be named on their policy. Without this, you may have no protection if there's an incident on-site." }
  }
  if (f.includes('waiver') || f.includes('subrogation')) {
    return { title: 'Waiver of Subrogation is missing', detail: "Without this, their insurance company could sue you to recover costs — even if the vendor was at fault for the incident." }
  }
  if (f.includes('limit') || f.includes('insufficient') || f.includes('low') || f.includes('below') || f.includes('minimum')) {
    return { title: 'Coverage limits are too low', detail: "Their policy doesn't cover enough. If there's a major incident, you could be on the hook for costs that exceed their coverage limit." }
  }
  if (f.includes('general liability') || f.includes('cgl')) {
    return { title: 'General liability coverage issue', detail: "There's a problem with their core liability policy — the coverage that protects your property from vendor-caused damage or injuries." }
  }
  if (f.includes('workers') || f.includes('comp')) {
    return { title: "Workers' compensation issue", detail: "If their workers are injured on your property and they don't have proper coverage, you could be held financially responsible." }
  }
  if (f.includes('auto')) {
    return { title: 'Auto liability coverage issue', detail: 'Vehicles operated on your property may not be covered. Any vehicle-related accidents could become your liability.' }
  }
  if (f.includes('umbrella') || f.includes('excess')) {
    return { title: 'Umbrella coverage missing or insufficient', detail: 'For larger projects, umbrella coverage provides an extra layer of protection above standard policy limits.' }
  }
  return { title: flag, detail: 'Review this issue with your insurance advisor before allowing this vendor on your property.' }
}

const coverageDescriptions: Record<string, string> = {
  'commercial general liability': 'Covers damage or injuries the vendor causes while working on your property — the most essential coverage to require.',
  'general liability': 'Covers damage or injuries the vendor causes while working on your property — the most essential coverage to require.',
  'cgl': 'Covers damage or injuries the vendor causes while working on your property — the most essential coverage to require.',
  'workers compensation': "Covers the vendor's employees if they're injured on the job. Without this, you could be held responsible for their medical bills.",
  "workers' compensation": "Covers the vendor's employees if they're injured on the job. Without this, you could be held responsible for their medical bills.",
  'employers liability': "Protects against lawsuits from injured employees who claim negligence beyond what workers' comp covers.",
  'automobile liability': 'Covers vehicles used on or near your property during the job. Essential if the vendor drives on-site or transports equipment.',
  'auto liability': 'Covers vehicles used on or near your property during the job. Essential if the vendor drives on-site or transports equipment.',
  'umbrella': 'Adds an extra cushion of protection above standard policy limits — important for larger projects or higher-risk work.',
  'excess liability': 'Adds an extra cushion of protection above standard policy limits — important for larger projects or higher-risk work.',
  'professional liability': 'Covers mistakes in professional services — for example, a contractor who follows the wrong specifications.',
  'errors and omissions': 'Covers mistakes in professional services — for example, a contractor who follows the wrong specifications.',
}

function getCoverageDescription(type: string): string {
  const key = type.toLowerCase()
  for (const [pattern, desc] of Object.entries(coverageDescriptions)) {
    if (key.includes(pattern)) return desc
  }
  return "Coverage that protects against specific risks associated with this vendor's work on your property."
}

function parseLimit(s: string): number {
  if (!s) return 0
  const c = s.toLowerCase().replace(/[$,\s]/g, '')
  if (c.endsWith('m')) return parseFloat(c) * 1_000_000
  if (c.endsWith('k')) return parseFloat(c) * 1_000
  return parseFloat(c) || 0
}

function fmtLimit(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000 % 1 === 0 ? n / 1_000_000 : (n / 1_000_000).toFixed(1))}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`
  return `$${n}`
}

function checkRequirements(result: COIData, reqs: Requirements): string[] {
  const flags: string[] = []
  const required = parseLimit(reqs.glLimit)
  if (required > 0) {
    const gl = result.coverages.find(c =>
      c.type.toLowerCase().includes('general liability') || c.type.toLowerCase().includes('cgl')
    )
    if (!gl) {
      flags.push(`general liability coverage not found — you require a minimum of ${fmtLimit(required)}`)
    } else {
      const actual = parseLimit(gl.eachOccurrence)
      if (actual > 0 && actual < required) {
        flags.push(`GL limit ${fmtLimit(actual)} is below your required minimum of ${fmtLimit(required)}`)
      }
    }
  }
  if (reqs.requireWorkersComp) {
    const hasWC = result.coverages.some(c =>
      c.type.toLowerCase().includes('workers') || c.type.toLowerCase().includes('comp')
    )
    if (!hasWC) flags.push("workers' compensation coverage not found — required by your property standards")
  }
  if (reqs.requireAdditionalInsured && !result.additionalInsured) {
    flags.push('additional insured endorsement required by your property standards but not present')
  }
  if (reqs.requireWaiverOfSubrogation && !result.waiverOfSubrogation) {
    flags.push('waiver of subrogation required by your property standards but not present')
  }
  return flags
}

function printReport(entry: SessionEntry) {
  const { result, s, fileName, requirementFlags } = entry
  const allFlags = [...result.flags, ...requirementFlags]
  const vc = s.label === 'PASS' ? 'pass' : s.label === 'EXPIRING SOON' ? 'warn' : 'fail'
  const expiry = result.daysUntilExpiration < 0
    ? `Expired ${Math.abs(result.daysUntilExpiration)} days ago`
    : `${result.daysUntilExpiration} days remaining`

  const flagsHtml = allFlags.map(f => {
    const { title, detail } = humanizeFlag(f)
    return `<div class="flag"><div class="flag-icon">!</div><div><div class="flag-title">${title}</div><div class="flag-detail">${detail}</div></div></div>`
  }).join('')

  const covsHtml = result.coverages.map(c => `
    <div class="cov">
      <div class="cov-name">${c.type}</div>
      <div class="cov-grid">
        <div><label>Per Incident</label><span>${c.eachOccurrence || '—'}</span></div>
        <div><label>Annual Max</label><span>${c.aggregate || '—'}</span></div>
        <div><label>Deductible</label><span>${c.deductible || '—'}</span></div>
      </div>
    </div>`).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>COI Compliance Report — ${result.insuredName || 'Certificate'}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a;padding:40px;max-width:760px;margin:0 auto;font-size:13px}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:2px solid #e5e7eb}
.logo{font-size:18px;font-weight:800;letter-spacing:-.5px}.logo span{color:#d97706}
.meta{text-align:right;font-size:11px;color:#6b7280;line-height:1.7}
.verdict{padding:20px 22px;border-radius:10px;margin-bottom:20px;display:flex;align-items:center;gap:16px}
.pass{background:#f0fdf4;border:1.5px solid #bbf7d0}.fail{background:#fef2f2;border:1.5px solid #fecaca}.warn{background:#fffbeb;border:1.5px solid #fde68a}
.badge{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#fff;flex-shrink:0}
.bp{background:#059669}.bf{background:#dc2626}.bw{background:#d97706}
.vlabel{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;font-family:monospace}
.vhead{font-size:17px;font-weight:800;margin-bottom:3px}.vsub{font-size:12px;opacity:.75}
h3{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#d97706;margin:18px 0 10px;font-family:monospace}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.g2 label{font-size:9px;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px;font-family:monospace;display:block;margin-bottom:1px}
.g2 span{font-size:12px;font-weight:500}
.flag{display:flex;gap:10px;margin-bottom:8px;padding:10px 12px;background:#fef2f2;border-radius:6px;border:.5px solid #fecaca}
.flag-icon{color:#dc2626;font-weight:700;flex-shrink:0;font-size:13px}
.flag-title{font-size:12px;font-weight:600;color:#991b1b;margin-bottom:2px}
.flag-detail{font-size:11px;color:#6b7280;line-height:1.5}
.end-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.end{padding:10px 12px;border-radius:6px}.end.y{background:#f0fdf4;border:.5px solid #bbf7d0}.end.n{background:#fef2f2;border:.5px solid #fecaca}
.end-label{font-size:12px;font-weight:700;margin-bottom:2px}.end-sub{font-size:11px;color:#6b7280}
.cov{margin-bottom:14px;padding-bottom:14px;border-bottom:.5px solid #e5e7eb}.cov:last-child{border-bottom:none;margin-bottom:0}
.cov-name{font-size:12px;font-weight:700;margin-bottom:6px}
.cov-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.cov-grid label{font-size:9px;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px;font-family:monospace;display:block;margin-bottom:1px}
.cov-grid span{font-size:13px;font-weight:600}
.ftr{margin-top:32px;padding-top:14px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:10px;color:#9ca3af;font-family:monospace}
</style></head><body>
<div class="hdr">
  <div class="logo">Covira</div>
  <div class="meta"><div style="font-weight:600">COI Compliance Report</div><div>${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div><div>${fileName}</div></div>
</div>
<div class="verdict ${vc}">
  <div class="badge ${vc === 'pass' ? 'bp' : vc === 'warn' ? 'bw' : 'bf'}">${s.icon}</div>
  <div>
    <div class="vlabel" style="color:${s.badge}">${s.label}</div>
    <div class="vhead" style="color:${s.badge}">${s.headline}</div>
    <div class="vsub" style="color:${s.badge}">${s.subtext}</div>
  </div>
</div>
<h3>Vendor Information</h3>
<div class="g2">
  <div><label>Vendor</label><span>${result.insuredName || '—'}</span></div>
  <div><label>Address</label><span>${result.insuredAddress || '—'}</span></div>
  <div><label>Insurance Agency</label><span>${result.producer || '—'}</span></div>
  <div><label>Certificate Holder</label><span>${result.certificateHolder || '—'}</span></div>
  <div><label>Coverage Start</label><span>${result.effectiveDate || '—'}</span></div>
  <div><label>Coverage End</label><span>${result.expirationDate || '—'} · ${expiry}</span></div>
</div>
${allFlags.length > 0 ? `<h3>Issues to Resolve</h3>${flagsHtml}` : ''}
<h3>Endorsements</h3>
<div class="end-grid">
  <div class="end ${result.additionalInsured ? 'y' : 'n'}"><div class="end-label">${result.additionalInsured ? '✅' : '❌'} Additional Insured</div><div class="end-sub">${result.additionalInsured ? 'Your property is named on their policy.' : 'Not listed — request this before proceeding.'}</div></div>
  <div class="end ${result.waiverOfSubrogation ? 'y' : 'n'}"><div class="end-label">${result.waiverOfSubrogation ? '✅' : '❌'} Waiver of Subrogation</div><div class="end-sub">${result.waiverOfSubrogation ? 'Their insurer cannot come after you for costs.' : "Without this, their insurer could pursue you."}</div></div>
</div>
<h3>Coverage Details</h3>${covsHtml}
<div class="ftr"><span>Generated by Covira</span><span>${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span></div>
</body></html>`

  const win = window.open('', '_blank')
  if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 400) }
}

// ─── Vendors list for step 1 ──────────────────────────────────────────────────

const VENDOR_NAMES = [
  'ABC Plumbing LLC', 'Summit Electric Co.', 'Bluewater HVAC',
  'Pinnacle Roofing Inc.', 'Bright Services', 'ProBuild Contractors',
  'Elite Flooring', 'Metro Electric Co.',
]

// ─── Default requirements ──────────────────────────────────────────────────────

const DEFAULT_REQUIREMENTS = [
  { key: 'gl',   label: 'General Liability', value: '$1,000,000' },
  { key: 'auto', label: 'Auto Liability',     value: '$1,000,000' },
  { key: 'wc',   label: 'Workers Comp',       value: 'Required' },
  { key: 'ai',   label: 'Additional Insured', value: 'Required' },
  { key: 'wos',  label: 'Waiver of Subrogation', value: 'Required' },
]

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = [
  { num: 1, label: 'Select Vendor' },
  { num: 2, label: 'Upload Document' },
  { num: 3, label: 'Review Requirements' },
  { num: 4, label: 'Analyze' },
]

function StepIndicator({ current, completed }: { current: number; completed: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 40 }}>
      {STEPS.map((step, i) => {
        const done = completed || step.num < current
        const active = step.num === current && !completed
        return (
          <div key={step.num} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 80 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: done || active ? '#D97706' : '#111118',
                border: done || active ? 'none' : '1px solid #1e1e2e',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
                color: done || active ? '#fff' : '#8a8599',
                boxShadow: active ? '0 2px 10px rgba(217,119,6,0.35)' : 'none',
                transition: 'all 0.2s',
              }}>
                {done ? <Check size={16} strokeWidth={3} /> : step.num}
              </div>
              <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? '#D97706' : done ? '#f0ede8' : '#8a8599', whiteSpace: 'nowrap' }}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                width: 60, height: 1.5, flexShrink: 0, marginBottom: 20,
                background: step.num < current || done ? '#D97706' : '#1e1e2e',
                transition: 'background 0.3s',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function Upload() {
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1)
  const [vendorMode, setVendorMode] = useState<'existing' | 'new'>('existing')
  const [selectedVendor, setSelectedVendor] = useState(VENDOR_NAMES[0])
  const [newVendorName, setNewVendorName] = useState('')

  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [session, setSession] = useState<SessionEntry[]>([])
  const [activeEntry, setActiveEntry] = useState<SessionEntry | null>(null)
  const [requirements, setRequirements] = useState<Requirements>({
    glLimit: '1,000,000',
    requireWorkersComp: true,
    requireAdditionalInsured: true,
    requireWaiverOfSubrogation: true,
  })

  const allFlags = activeEntry ? [...activeEntry.result.flags, ...activeEntry.requirementFlags] : []

  const handleFile = (f: File) => {
    if (f.type !== 'application/pdf') { setError('Please upload a PDF file.'); return }
    setFile(f); setError('')
  }

  const handleAnalyze = async () => {
    if (!file) return
    setLoading(true); setError(''); setWizardStep(4)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const resolvedVendorName = vendorMode === 'existing' ? selectedVendor : newVendorName
      if (resolvedVendorName) formData.append('vendor_name', resolvedVendorName)
      const res = await fetch('/api/extract-coi', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Something went wrong')

      const requirementFlags = checkRequirements(json.data, requirements)
      const rawStatus = (json.data.overallStatus?.toUpperCase() ?? 'NON_COMPLIANT') as keyof typeof statusConfig
      const finalStatus: keyof typeof statusConfig =
        requirementFlags.length > 0 && rawStatus === 'COMPLIANT' ? 'NON_COMPLIANT' : rawStatus
      const entryS = statusConfig[finalStatus] ?? statusConfig['NON_COMPLIANT']

      const entry: SessionEntry = {
        id: Math.random().toString(36).slice(2),
        fileName: file.name,
        result: json.data,
        normalizedStatus: finalStatus,
        s: entryS,
        requirementFlags,
      }
      setSession(prev => [...prev, entry])
      setActiveEntry(entry)
      setFile(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setWizardStep(3)
    } finally {
      setLoading(false)
    }
  }

  const resetWizard = () => {
    setWizardStep(1); setActiveEntry(null); setFile(null); setError('')
  }

  // After analysis is complete, show results
  if (activeEntry) {
    const { result, s } = activeEntry
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0f', fontFamily: 'Inter, -apple-system, sans-serif' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <Sidebar />
        <main style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <header style={{ padding: '0 32px', height: 64, borderBottom: '1px solid #1e1e2e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0a0a0f', position: 'sticky', top: 0, zIndex: 40 }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#f0ede8', margin: 0 }}>Upload COI</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button style={{ position: 'relative', background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: '#8a8599' }}>
                <Bell size={20} />
                <span style={{ position: 'absolute', top: 5, right: 5, width: 8, height: 8, background: '#D97706', borderRadius: '50%', border: '2px solid #0a0a0f' }} />
              </button>
              <UserButton afterSignOutUrl="/" />
            </div>
          </header>
          <div style={{ flex: 1, padding: '40px 32px', overflowY: 'auto' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <StepIndicator current={4} completed={true} />

          <div style={{ animation: 'fadeUp 0.35s ease-out', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Pass/Fail banner */}
            <div style={{ background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: 18, padding: '28px 32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ width: 68, height: 68, borderRadius: '50%', flexShrink: 0, background: s.badge, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: '#fff', fontWeight: 900 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: s.color, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6, opacity: 0.8 }}>{s.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1.2, marginBottom: 6 }}>{s.headline}</div>
                    <div style={{ fontSize: 13, color: s.color, opacity: 0.75, lineHeight: 1.6 }}>{s.subtext}</div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: s.color, opacity: 0.65, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 5 }}>Policy Expires</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{result.expirationDate}</div>
                  <div style={{ fontSize: 12, color: s.color, opacity: 0.65, marginTop: 4 }}>
                    {result.daysUntilExpiration < 0 ? `Expired ${Math.abs(result.daysUntilExpiration)} days ago` : `${result.daysUntilExpiration} days remaining`}
                  </div>
                </div>
              </div>
            </div>

            {/* Flags */}
            {allFlags.length > 0 && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 14, padding: '24px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fca5a5', marginBottom: 4 }}>Issues to resolve before proceeding</div>
                <div style={{ fontSize: 12, color: '#fca5a5', opacity: 0.7, marginBottom: 18 }}>Address each of these before allowing this vendor on your property.</div>
                {allFlags.map((flag, i) => {
                  const { title, detail } = humanizeFlag(flag)
                  return (
                    <div key={i} style={{ display: 'flex', gap: 14, marginBottom: i < allFlags.length - 1 ? 16 : 0, paddingBottom: i < allFlags.length - 1 ? 16 : 0, borderBottom: i < allFlags.length - 1 ? '1px solid rgba(220,38,38,0.10)' : 'none' }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, marginTop: 1, color: '#fca5a5' }}>!</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fca5a5', marginBottom: 4 }}>{title}</div>
                        <div style={{ fontSize: 12, color: '#fca5a5', opacity: 0.75, lineHeight: 1.6 }}>{detail}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Coverage details */}
            <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 14, padding: '24px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#D97706', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 6 }}>Coverage Details</div>
              <div style={{ fontSize: 13, color: '#8a8599', marginBottom: 20, lineHeight: 1.6 }}>What their policy actually covers.</div>
              {result.coverages.map((cov, i) => (
                <div key={i} style={{ marginBottom: i < result.coverages.length - 1 ? 20 : 0, paddingBottom: i < result.coverages.length - 1 ? 20 : 0, borderBottom: i < result.coverages.length - 1 ? '1px solid #1e1e2e' : 'none' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#f0ede8', marginBottom: 5 }}>{cov.type}</div>
                  <div style={{ fontSize: 13, color: '#8a8599', lineHeight: 1.65, marginBottom: 12 }}>{getCoverageDescription(cov.type)}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                    {[['Per Incident', cov.eachOccurrence], ['Annual Max', cov.aggregate], ['Deductible', cov.deductible]].map(([label, value]) => (
                      <div key={label} style={{ background: '#0a0a0f', borderRadius: 8, padding: '10px 14px', border: '1px solid #1e1e2e' }}>
                        <div style={{ fontSize: 9, color: '#8a8599', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 5 }}>{label}</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#f0ede8' }}>{value || '—'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 14, padding: '24px' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#f0ede8', marginBottom: 18 }}>What would you like to do next?</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={() => printReport(activeEntry)} style={{ background: '#0a0a0f', border: '1px solid #1e1e2e', color: '#f0ede8', fontSize: 14, fontWeight: 600, padding: '15px 20px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Download Compliance Report</span><span style={{ color: '#8a8599' }}>↓</span>
                </button>
                {activeEntry.normalizedStatus !== 'COMPLIANT' && (
                  <button
                    onClick={() => {
                      const vendorName = result.insuredName || 'your vendor'
                      const issues = allFlags.map(f => `• ${humanizeFlag(f).title}`).join('\n')
                      const subject = encodeURIComponent(`Updated Certificate of Insurance Required — ${vendorName}`)
                      const body = encodeURIComponent(`Hi,\n\nWe reviewed the certificate of insurance on file for ${vendorName} and need an updated certificate before work can proceed.\n\nPlease provide an updated COI that addresses the following:\n\n${issues}\n\nThank you.`)
                      window.open(`mailto:?subject=${subject}&body=${body}`)
                    }}
                    style={{ background: '#D97706', color: '#fff', fontSize: 14, fontWeight: 700, padding: '15px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <span>Request Updated Certificate</span><span>→</span>
                  </button>
                )}
                <button onClick={resetWizard} style={{ background: 'transparent', border: '1px solid #1e1e2e', color: '#f0ede8', fontSize: 14, fontWeight: 600, padding: '15px 20px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Analyze Another Certificate</span><span style={{ color: '#8a8599' }}>→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0f', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>
      <Sidebar />
      <main style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ padding: '0 32px', height: 64, borderBottom: '1px solid #1e1e2e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0a0a0f', position: 'sticky', top: 0, zIndex: 40 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#f0ede8', margin: 0 }}>Upload COI</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button style={{ position: 'relative', background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: '#8a8599' }}>
              <Bell size={20} />
              <span style={{ position: 'absolute', top: 5, right: 5, width: 8, height: 8, background: '#D97706', borderRadius: '50%', border: '2px solid #0a0a0f' }} />
            </button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>
        <div style={{ flex: 1, padding: '40px 32px', overflowY: 'auto' }}>
      <div style={{ maxWidth: 580, margin: '0 auto' }}>
        <StepIndicator current={wizardStep} completed={false} />

        {/* ── Step 1: Select Vendor ── */}
        {wizardStep === 1 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f0ede8', margin: '0 0 24px' }}>Select Vendor</h2>
            <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Existing vendor */}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', padding: '14px 16px', borderRadius: 10, border: `1px solid ${vendorMode === 'existing' ? '#D97706' : '#1e1e2e'}`, background: vendorMode === 'existing' ? 'rgba(217,119,6,0.06)' : 'transparent', transition: 'all 0.15s' }}>
                  <input type="radio" name="vendorMode" value="existing" checked={vendorMode === 'existing'} onChange={() => setVendorMode('existing')} style={{ marginTop: 3, accentColor: '#D97706' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#f0ede8', marginBottom: 8 }}>Select existing vendor</div>
                    {vendorMode === 'existing' && (
                      <div style={{ position: 'relative' }}>
                        <select
                          value={selectedVendor}
                          onChange={e => setSelectedVendor(e.target.value)}
                          style={{
                            width: '100%', background: '#0a0a0f', border: '1px solid #1e1e2e',
                            borderRadius: 8, padding: '9px 32px 9px 12px',
                            fontSize: 13, color: '#f0ede8', cursor: 'pointer',
                            appearance: 'none', outline: 'none',
                          }}
                        >
                          {VENDOR_NAMES.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                        <ChevronDown size={14} color="#8a8599" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      </div>
                    )}
                  </div>
                </label>

                {/* New vendor */}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', padding: '14px 16px', borderRadius: 10, border: `1px solid ${vendorMode === 'new' ? '#D97706' : '#1e1e2e'}`, background: vendorMode === 'new' ? 'rgba(217,119,6,0.06)' : 'transparent', transition: 'all 0.15s' }}>
                  <input type="radio" name="vendorMode" value="new" checked={vendorMode === 'new'} onChange={() => setVendorMode('new')} style={{ marginTop: 3, accentColor: '#D97706' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#f0ede8', marginBottom: 8 }}>Create new vendor</div>
                    {vendorMode === 'new' && (
                      <input
                        type="text"
                        placeholder="Enter vendor name..."
                        value={newVendorName}
                        onChange={e => setNewVendorName(e.target.value)}
                        style={{
                          width: '100%', background: '#0a0a0f', border: '1px solid #1e1e2e',
                          borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#f0ede8',
                          outline: 'none',
                        }}
                        onFocus={e => (e.target.style.borderColor = '#D97706')}
                        onBlur={e => (e.target.style.borderColor = '#1e1e2e')}
                      />
                    )}
                  </div>
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setWizardStep(2)}
                style={{ background: '#D97706', color: '#fff', fontSize: 14, fontWeight: 700, padding: '11px 28px', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#b45309')}
                onMouseLeave={e => (e.currentTarget.style.background = '#D97706')}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Upload Document ── */}
        {wizardStep === 2 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f0ede8', margin: '0 0 24px' }}>Upload Document</h2>

            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              onClick={() => !loading && document.getElementById('file-input')?.click()}
              style={{
                border: `2px dashed ${dragging ? '#D97706' : file ? 'rgba(5,150,105,0.45)' : '#D97706'}`,
                borderRadius: 16, padding: '64px 24px',
                textAlign: 'center', cursor: 'pointer',
                background: dragging ? 'rgba(217,119,6,0.04)' : file ? 'rgba(5,150,105,0.04)' : '#111118',
                transition: 'all 0.2s', marginBottom: 14,
              }}
            >
              <input id="file-input" type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
              {file ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 40 }}>📄</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#6ee7b7' }}>✓ {file.name}</div>
                  <div style={{ fontSize: 13, color: '#8a8599' }}>Click to choose a different file</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <UploadIcon size={36} color="#D97706" />
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#f0ede8' }}>Drag and drop your COI here</div>
                  <div style={{ fontSize: 14, color: '#8a8599' }}>or</div>
                  <button style={{ background: '#D97706', color: '#fff', fontSize: 13, fontWeight: 600, padding: '9px 20px', borderRadius: 8, border: 'none', cursor: 'pointer' }} onClick={e => e.stopPropagation()}>
                    Browse Files
                  </button>
                  <div style={{ fontSize: 12, color: '#8a8599', marginTop: 6 }}>PDF, JPG, PNG — Max 25MB</div>
                </div>
              )}
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 14, fontSize: 13, color: '#fca5a5' }}>
                ⚠ {error}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={() => setWizardStep(1)}
                style={{ background: 'transparent', border: '1px solid #1e1e2e', color: '#8a8599', fontSize: 14, fontWeight: 500, padding: '11px 24px', borderRadius: 8, cursor: 'pointer' }}
              >
                ← Back
              </button>
              <button
                onClick={() => file && setWizardStep(3)}
                disabled={!file}
                style={{
                  background: file ? '#D97706' : '#1e1e2e', color: file ? '#fff' : '#8a8599',
                  fontSize: 14, fontWeight: 700, padding: '11px 28px', borderRadius: 8,
                  border: 'none', cursor: file ? 'pointer' : 'not-allowed', transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (file) e.currentTarget.style.background = '#b45309' }}
                onMouseLeave={e => { if (file) e.currentTarget.style.background = '#D97706' }}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Review Requirements ── */}
        {wizardStep === 3 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f0ede8', margin: '0 0 8px' }}>Review Requirements</h2>
            <p style={{ fontSize: 14, color: '#8a8599', marginBottom: 24, lineHeight: 1.6 }}>
              These requirements will be checked against the uploaded COI.
            </p>

            <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {DEFAULT_REQUIREMENTS.map((req, i) => (
                  <div key={req.key} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 0',
                    borderBottom: i < DEFAULT_REQUIREMENTS.length - 1 ? '1px solid #1e1e2e' : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={12} color="#22c55e" strokeWidth={3} />
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#f0ede8' }}>{req.label}</span>
                    </div>
                    <span style={{ fontSize: 13, color: '#8a8599', fontWeight: 500 }}>{req.value}</span>
                  </div>
                ))}
              </div>

              {/* Additional toggles */}
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #1e1e2e' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#8a8599', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customize</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { key: 'requireWorkersComp', label: "Workers' Comp required" },
                    { key: 'requireAdditionalInsured', label: 'Additional Insured required' },
                    { key: 'requireWaiverOfSubrogation', label: 'Waiver of Subrogation required' },
                  ].map(item => (
                    <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={requirements[item.key as keyof Requirements] as boolean}
                        onChange={e => setRequirements(r => ({ ...r, [item.key]: e.target.checked }))}
                        style={{ accentColor: '#D97706', width: 15, height: 15, cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#c4bfd8' }}>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {loading && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#8a8599', fontSize: 14 }}>
                <div style={{ width: 36, height: 36, border: '3px solid rgba(217,119,6,0.15)', borderTop: '3px solid #D97706', borderRadius: '50%', animation: 'spin 0.85s linear infinite', margin: '0 auto 12px' }} />
                Analyzing your certificate...
              </div>
            )}

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 14, fontSize: 13, color: '#fca5a5' }}>
                ⚠ {error}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={() => setWizardStep(2)}
                style={{ background: 'transparent', border: '1px solid #1e1e2e', color: '#8a8599', fontSize: 14, fontWeight: 500, padding: '11px 24px', borderRadius: 8, cursor: 'pointer' }}
              >
                ← Back
              </button>
              <button
                onClick={handleAnalyze}
                disabled={loading}
                style={{
                  background: loading ? '#1e1e2e' : '#D97706', color: '#fff',
                  fontSize: 14, fontWeight: 700, padding: '11px 28px', borderRadius: 8,
                  border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s', boxShadow: loading ? 'none' : '0 2px 8px rgba(217,119,6,0.25)',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#b45309' }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#D97706' }}
              >
                {loading ? 'Analyzing...' : 'Analyze →'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Analyzing ── */}
        {wizardStep === 4 && loading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ width: 64, height: 64, border: '4px solid rgba(217,119,6,0.15)', borderTop: '4px solid #D97706', borderRadius: '50%', animation: 'spin 0.85s linear infinite', margin: '0 auto 24px' }} />
            <div style={{ fontSize: 20, fontWeight: 700, color: '#f0ede8', marginBottom: 8 }}>Reading your certificate...</div>
            <div style={{ fontSize: 14, color: '#8a8599', marginBottom: 20 }}>Extracting coverage details and checking compliance</div>
            <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['Identifying coverages', 'Checking expiration', 'Verifying endorsements'].map((t, i) => (
                <span key={i} style={{ fontSize: 11, color: '#8a8599', fontFamily: 'IBM Plex Mono, monospace' }}>↻ {t}</span>
              ))}
            </div>
          </div>
        )}
      </div>
        </div>
      </main>
    </div>
  )
}
