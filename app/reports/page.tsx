'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Bell, Download, CheckCircle2,
  Upload, AlertTriangle, Clock, TrendingUp, TrendingDown,
  FileText,
} from 'lucide-react'
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
  red: '#ef4444',
  primary: '#f8f8f8',
  secondary: '#8b8fa8',
  muted: '#4b5063',
}

// ── Types ─────────────────────────────────────────────────────────────────────

type DateRange = 'This Week' | 'This Month' | 'Last 3 Months' | 'This Year'
const DATE_RANGES: DateRange[] = ['This Week', 'This Month', 'Last 3 Months', 'This Year']

type AnalysisResult = {
  insuredName?: string | null
  flags?: string[]
  overallStatus?: string | null
  isExpired?: boolean | null
  additionalInsured?: boolean | null
  waiverOfSubrogation?: boolean | null
  expirationDate?: string | null
}

type SubRow = {
  id: string
  vendor_id: string | null
  status: string | null
  issues_count: number | null
  risk_score: number | null
  analysis_result: AnalysisResult | null
  created_at: string | null
  vendors: { id: string; name: string } | null
}

// ── Data helpers ──────────────────────────────────────────────────────────────

function computeRiskScore(ar: AnalysisResult | null): number {
  if (!ar) return 0
  const flags = ar.flags ?? []
  const overallStatus = ar.overallStatus ?? ''
  let score = 100
  if (ar.isExpired || overallStatus === 'EXPIRED') score -= 40
  else if (overallStatus === 'EXPIRING') score -= 15
  if (!ar.additionalInsured) score -= 10
  if (!ar.waiverOfSubrogation) score -= 10
  score -= Math.min(flags.length * 8, 40)
  return Math.max(score, 0)
}

function rangeStart(range: DateRange): Date {
  const now = new Date()
  switch (range) {
    case 'This Week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case 'This Month': {
      const d = new Date(now.getFullYear(), now.getMonth(), 1)
      d.setHours(0, 0, 0, 0)
      return d
    }
    case 'Last 3 Months':
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
    case 'This Year': {
      const d = new Date(now.getFullYear(), 0, 1)
      d.setHours(0, 0, 0, 0)
      return d
    }
  }
}

function applyRange(subs: SubRow[], range: DateRange): SubRow[] {
  const cutoff = rangeStart(range)
  return subs.filter(s => s.created_at && new Date(s.created_at) >= cutoff)
}

// Last 6 calendar months from today
function lastSixMonths(): Array<{ label: string; year: number; month: number }> {
  const now = new Date()
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return { label: d.toLocaleDateString('en-US', { month: 'short' }), year: d.getFullYear(), month: d.getMonth() }
  })
}

function complianceByMonth(subs: SubRow[]): Array<{ label: string; pct: number }> {
  const months = lastSixMonths()
  return months.map(({ label, year, month }) => {
    const bucket = subs.filter(s => {
      if (!s.created_at) return false
      const d = new Date(s.created_at)
      return d.getFullYear() === year && d.getMonth() === month
    })
    if (bucket.length === 0) return { label, pct: 0 }
    const compliant = bucket.filter(s => s.status === 'Compliant').length
    return { label, pct: Math.round((compliant / bucket.length) * 100) }
  })
}

function topIssues(subs: SubRow[]): Array<{ label: string; count: number }> {
  const counts: Record<string, number> = {}
  subs.forEach(s => {
    ;(s.analysis_result?.flags ?? []).forEach(f => {
      counts[f] = (counts[f] ?? 0) + 1
    })
  })
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => ({ label, count }))
}

function vendorRisk(subs: SubRow[]): Array<{ name: string; vendorId: string; score: number }> {
  // Group by vendor, take latest submission per vendor (score derived from analysis_result)
  const byVendor = new Map<string, SubRow>()
  ;[...subs].sort((a, b) =>
    new Date(b.created_at ?? '').getTime() - new Date(a.created_at ?? '').getTime()
  ).forEach(s => {
    const key = s.vendor_id ?? s.analysis_result?.insuredName ?? s.id
    if (!byVendor.has(key)) byVendor.set(key, s)
  })
  return Array.from(byVendor.values())
    .map(s => ({
      name: s.vendors?.name ?? s.analysis_result?.insuredName ?? 'Unknown',
      vendorId: s.vendors?.id ?? s.vendor_id ?? '',
      score: computeRiskScore(s.analysis_result),
    }))
    .sort((a, b) => a.score - b.score) // most risky first
    .slice(0, 5)
}

// ── Visual helpers ────────────────────────────────────────────────────────────

function scoreColor(s: number) {
  if (s >= 90) return T.green
  if (s >= 80) return '#86efac'
  if (s >= 70) return T.orange
  return T.red
}

function riskLabel(s: number): { label: string; color: string } {
  if (s >= 90) return { label: 'Low Risk',    color: T.green    }
  if (s >= 80) return { label: 'Medium Risk', color: '#86efac'  }
  if (s >= 70) return { label: 'High Risk',   color: T.orange   }
  return             { label: 'Critical',     color: T.red      }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)   return 'just now'
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
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

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, trendDir,
}: {
  label: string
  value: string
  sub: string
  trendDir?: 'positive' | 'negative' | 'neutral'
}) {
  const color = trendDir === 'positive' ? T.green : trendDir === 'negative' ? T.red : T.orange
  const TrendIcon = trendDir === 'negative' ? TrendingDown : TrendingUp

  return (
    <div style={{
      flex: 1, minWidth: 0,
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 12, padding: '20px 22px',
      transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderAccent; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.4)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <p style={{ fontSize: 12, color: T.secondary, fontWeight: 500, margin: '0 0 10px' }}>{label}</p>
      <p style={{ fontSize: 32, fontWeight: 800, color: T.primary, margin: '0 0 10px', letterSpacing: '-1.5px', lineHeight: 1 }}>
        {value}
      </p>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: `${color}18`, color,
        border: `1px solid ${color}30`,
        borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600,
      }}>
        {trendDir && <TrendIcon size={11} strokeWidth={2.5} />}
        {sub}
      </div>
    </div>
  )
}

// ── Compliance Bar Chart ──────────────────────────────────────────────────────

function ComplianceChart({ data }: { data: Array<{ label: string; pct: number }> }) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 80)
    return () => clearTimeout(t)
  }, [])

  const maxPct = Math.max(...data.map(m => m.pct), 1)

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 160, paddingTop: 24 }}>
      {data.map((m, i) => {
        const heightPct = (m.pct / maxPct) * 100
        const isHighest = m.pct === maxPct && m.pct > 0
        return (
          <div key={m.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: m.pct === 0 ? T.muted : isHighest ? T.orange : T.secondary,
              transition: 'opacity 0.4s ease',
              opacity: animated ? 1 : 0,
              transitionDelay: `${i * 80 + 300}ms`,
            }}>
              {m.pct > 0 ? `${m.pct}%` : '—'}
            </span>
            <div style={{
              flex: 1, width: '100%', borderRadius: 5,
              background: 'rgba(255,255,255,0.04)',
              position: 'relative', overflow: 'hidden', minHeight: 80,
            }}>
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                borderRadius: 5,
                background: isHighest
                  ? `linear-gradient(180deg, ${T.orange}, rgba(217,119,6,0.6))`
                  : `linear-gradient(180deg, rgba(217,119,6,0.55), rgba(217,119,6,0.25))`,
                height: animated ? `${heightPct}%` : '0%',
                transition: 'height 0.75s cubic-bezier(0.34,1.56,0.64,1)',
                transitionDelay: `${i * 80}ms`,
              }} />
            </div>
            <span style={{ fontSize: 11, color: T.muted, fontWeight: 500 }}>{m.label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Top Issues bars ───────────────────────────────────────────────────────────

function TopIssuesChart({ issues }: { issues: Array<{ label: string; count: number }> }) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 120)
    return () => clearTimeout(t)
  }, [])

  const maxCount = Math.max(...issues.map(i => i.count), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {issues.map((issue, i) => (
        <div key={issue.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: T.secondary, fontWeight: 500 }}>{issue.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.orange }}>{issue.count}</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3,
              background: T.orange,
              width: animated ? `${(issue.count / maxCount) * 100}%` : '0%',
              transition: 'width 0.6s ease',
              transitionDelay: `${i * 80}ms`,
            }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { user, isLoaded } = useUser()
  const [allSubs,      setAllSubs]      = useState<SubRow[]>([])
  const [loading,      setLoading]      = useState(true)
  const [dateRange,    setDateRange]    = useState<DateRange>('This Month')
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  useEffect(() => {
    if (!isLoaded) return
    if (!user) { setLoading(false); return }

    async function fetchSubs() {
      const { data, error } = await supabase
        .from('submissions')
        .select('id, vendor_id, status, issues_count, risk_score, analysis_result, created_at, vendors(id, name)')
        .eq('clerk_user_id', user!.id)
        .order('created_at', { ascending: false })

      if (!error && data) setAllSubs(data as unknown as SubRow[])
      setLoading(false)
    }

    fetchSubs()
  }, [isLoaded, user])

  function showToast(msg: string) {
    setToastMessage(msg)
    if (timerRef.current) clearTimeout(timerRef.current)
    setToastVisible(true)
    timerRef.current = setTimeout(() => setToastVisible(false), 3000)
  }

  function handleExport() {
    const rows = filtered.length > 0 ? filtered : allSubs
    if (rows.length === 0) return
    const header = ['Date', 'Vendor', 'Status', 'Risk Score', 'Issues', 'Flags', 'Policy Expiration']
    const lines = rows.map(s => {
      const ar = s.analysis_result
      const vendor = (s.vendors?.name ?? ar?.insuredName ?? 'Unknown').replace(/,/g, ' ')
      const date = s.created_at ? new Date(s.created_at).toLocaleDateString('en-US') : ''
      const flags = `"${(ar?.flags ?? []).join('; ')}"`
      return [
        date,
        vendor,
        s.status ?? '',
        computeRiskScore(ar),
        s.issues_count ?? 0,
        flags,
        ar?.expirationDate ?? '',
      ].join(',')
    })
    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `covira-report-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('Report downloaded')
  }

  // Filtered slice for stats / issues / activity
  const filtered = applyRange(allSubs, dateRange)

  // Derived analytics
  const totalAnalyzed  = filtered.length
  const compliantCount = filtered.filter(s => s.status === 'Compliant').length
  const complianceRate = totalAnalyzed === 0 ? 0 : Math.round((compliantCount / totalAnalyzed) * 100)
  const totalIssues    = filtered.reduce((acc, s) => acc + (s.issues_count ?? 0), 0)
  const avgRiskScore   = totalAnalyzed === 0
    ? 0
    : Math.round(filtered.reduce((acc, s) => acc + computeRiskScore(s.analysis_result), 0) / totalAnalyzed)

  const monthlyChart  = complianceByMonth(allSubs)
  const issuesList    = topIssues(filtered)
  const vendorSummary = vendorRisk(allSubs)
  const recentSubs    = allSubs.slice(0, 5)

  const hasData = allSubs.length > 0

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: T.bg, fontFamily: 'Inter, -apple-system, sans-serif',
      color: T.primary,
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Toast message={toastMessage} visible={toastVisible} />
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
            <h1 style={{ fontSize: 16, fontWeight: 700, color: T.primary, margin: 0, lineHeight: 1.2 }}>Reports</h1>
            <p style={{ fontSize: 12, color: T.secondary, margin: 0 }}>
              Compliance analytics and audit-ready exports
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handleExport}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: T.orange, color: '#fff', border: 'none',
                borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 2px 12px rgba(217,119,6,0.25)',
                transition: 'background 0.15s, transform 0.1s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = T.orangeHover; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = T.orange; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <Download size={14} /> Export Report
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
                position: 'absolute', top: 9, right: 9, width: 7, height: 7,
                borderRadius: '50%', background: T.orange, border: `2px solid ${T.bg}`,
              }} />
            </button>

            <UserButton />
          </div>
        </header>

        {/* ── Content ── */}
        <div style={{ padding: 28, flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Date range pills */}
          <div style={{ display: 'flex', gap: 8 }}>
            {DATE_RANGES.map(dr => {
              const active = dateRange === dr
              return (
                <button
                  key={dr}
                  onClick={() => setDateRange(dr)}
                  style={{
                    background: active ? T.orange : T.card,
                    color: active ? '#fff' : T.secondary,
                    border: `1px solid ${active ? T.orange : T.border}`,
                    borderRadius: 8, padding: '7px 16px',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = T.borderAccent; e.currentTarget.style.color = T.primary } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.secondary } }}
                >
                  {dr}
                </button>
              )
            })}
          </div>

          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
              <div style={{
                width: 36, height: 36,
                border: `3px solid rgba(217,119,6,0.15)`,
                borderTop: `3px solid ${T.orange}`,
                borderRadius: '50%',
                animation: 'spin 0.85s linear infinite',
              }} />
            </div>
          ) : !hasData ? (
            /* ── Empty state ── */
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '72px 24px', textAlign: 'center',
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: 'rgba(217,119,6,0.08)', border: `1px solid rgba(217,119,6,0.18)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}>
                <FileText size={28} color={T.orange} />
              </div>
              <p style={{ fontSize: 18, fontWeight: 700, color: T.primary, margin: '0 0 10px' }}>
                No reports yet
              </p>
              <p style={{ fontSize: 14, color: T.secondary, margin: '0 0 28px', maxWidth: 360, lineHeight: 1.6 }}>
                Upload a COI to see your compliance analytics, issue breakdown, and vendor risk scores here.
              </p>
              <Link href="/upload" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: T.orange, color: '#fff', textDecoration: 'none',
                borderRadius: 8, padding: '11px 22px', fontSize: 14, fontWeight: 600,
                boxShadow: '0 2px 16px rgba(217,119,6,0.3)',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = T.orangeHover)}
                onMouseLeave={e => (e.currentTarget.style.background = T.orange)}
              >
                <Upload size={15} /> Upload a COI
              </Link>
            </div>
          ) : (
            <>
              {/* ── Stat cards ── */}
              <div style={{ display: 'flex', gap: 14 }}>
                <StatCard
                  label="COIs Analyzed"
                  value={String(totalAnalyzed)}
                  sub={`${allSubs.length} total all time`}
                  trendDir="positive"
                />
                <StatCard
                  label="Compliance Rate"
                  value={`${complianceRate}%`}
                  sub={`${compliantCount} of ${totalAnalyzed} compliant`}
                  trendDir={complianceRate >= 70 ? 'positive' : 'negative'}
                />
                <StatCard
                  label="Issues Detected"
                  value={String(totalIssues)}
                  sub={`${filtered.filter(s => (s.issues_count ?? 0) > 0).length} submissions with flags`}
                  trendDir={totalIssues === 0 ? 'positive' : 'negative'}
                />
                <StatCard
                  label="Avg Risk Score"
                  value={totalAnalyzed > 0 ? String(avgRiskScore) : '—'}
                  sub={avgRiskScore >= 80 ? 'Low overall risk' : avgRiskScore >= 60 ? 'Moderate risk' : 'High risk — review needed'}
                  trendDir={avgRiskScore >= 80 ? 'positive' : avgRiskScore >= 60 ? 'neutral' : 'negative'}
                />
              </div>

              {/* ── Two-column layout ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 18, alignItems: 'start' }}>

                {/* Left column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                  {/* Compliance trend chart */}
                  <div style={{
                    background: T.card, border: `1px solid ${T.border}`,
                    borderRadius: 12, padding: 24,
                    transition: 'border-color 0.2s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = T.borderAccent)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <h2 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: 0 }}>
                        Compliance Rate Over Time
                      </h2>
                      <span style={{ fontSize: 11, color: T.muted }}>Last 6 months</span>
                    </div>
                    <p style={{ fontSize: 12, color: T.muted, margin: '0 0 4px' }}>
                      Monthly compliance percentage across your COI submissions
                    </p>
                    <ComplianceChart data={monthlyChart} />
                  </div>

                  {/* Top issues */}
                  <div style={{
                    background: T.card, border: `1px solid ${T.border}`,
                    borderRadius: 12, padding: 24,
                    transition: 'border-color 0.2s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = T.borderAccent)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                      <h2 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: 0 }}>
                        Most Common Issues
                      </h2>
                      <span style={{ fontSize: 11, color: T.muted }}>{dateRange}</span>
                    </div>
                    {issuesList.length === 0 ? (
                      <div style={{ padding: '28px 0', textAlign: 'center' }}>
                        <CheckCircle2 size={28} color={T.green} style={{ marginBottom: 10 }} />
                        <p style={{ fontSize: 13, fontWeight: 600, color: T.green, margin: '0 0 4px' }}>No issues detected</p>
                        <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>All COIs in this period are fully compliant.</p>
                      </div>
                    ) : (
                      <TopIssuesChart issues={issuesList} />
                    )}
                  </div>
                </div>

                {/* Right column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                  {/* Vendor risk summary */}
                  <div style={{
                    background: T.card, border: `1px solid ${T.border}`,
                    borderRadius: 12, padding: 24,
                    transition: 'border-color 0.2s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = T.borderAccent)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
                  >
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: '0 0 18px' }}>
                      Vendor Risk Summary
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 44px 90px',
                        gap: 8, padding: '0 0 8px',
                        borderBottom: `1px solid ${T.border}`, marginBottom: 4,
                      }}>
                        {['Vendor', 'Score', 'Status'].map(col => (
                          <span key={col} style={{
                            fontSize: 10, color: T.muted, fontWeight: 600,
                            textTransform: 'uppercase', letterSpacing: '0.07em',
                          }}>{col}</span>
                        ))}
                      </div>
                      {vendorSummary.length === 0 ? (
                        <p style={{ fontSize: 13, color: T.muted, padding: '16px 0', margin: 0, textAlign: 'center' }}>
                          No vendor data yet
                        </p>
                      ) : vendorSummary.map((v, i) => {
                        const risk = riskLabel(v.score)
                        return (
                          <div
                            key={v.vendorId || i}
                            style={{
                              display: 'grid', gridTemplateColumns: '1fr 44px 90px',
                              gap: 8, padding: '11px 4px',
                              borderBottom: i < vendorSummary.length - 1 ? `1px solid ${T.border}` : 'none',
                              transition: 'background 0.12s',
                              borderRadius: 4, margin: '0 -4px',
                              cursor: v.vendorId ? 'pointer' : 'default',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#1a1a2e')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <span style={{ fontSize: 12, fontWeight: 600, color: T.primary, alignSelf: 'center' }}>
                              {v.vendorId ? (
                                <Link href={`/vendors/${v.vendorId}`} style={{ color: T.primary, textDecoration: 'none' }}
                                  onMouseEnter={e => (e.currentTarget.style.color = T.orange)}
                                  onMouseLeave={e => (e.currentTarget.style.color = T.primary)}
                                >
                                  {v.name}
                                </Link>
                              ) : v.name}
                            </span>
                            <span style={{
                              fontSize: 14, fontWeight: 800,
                              color: scoreColor(v.score),
                              alignSelf: 'center', letterSpacing: '-0.5px',
                            }}>
                              {v.score}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: risk.color, alignSelf: 'center' }}>
                              {risk.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Recent activity */}
                  <div style={{
                    background: T.card, border: `1px solid ${T.border}`,
                    borderRadius: 12, padding: 24,
                    transition: 'border-color 0.2s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = T.borderAccent)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
                  >
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: '0 0 18px' }}>
                      Recent Activity
                    </h2>
                    {recentSubs.length === 0 ? (
                      <p style={{ fontSize: 13, color: T.muted, margin: 0, textAlign: 'center', padding: '16px 0' }}>
                        No recent activity
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {recentSubs.map((s, i) => {
                          const isCompliant = s.status === 'Compliant'
                          const Icon  = isCompliant ? CheckCircle2 : AlertTriangle
                          const color = isCompliant ? T.green : T.orange
                          const label = isCompliant ? 'COI verified compliant' : `${s.issues_count} issue${(s.issues_count ?? 0) !== 1 ? 's' : ''} detected`
                          const vendor = s.vendors?.name ?? s.analysis_result?.insuredName ?? 'Unknown Vendor'
                          return (
                            <div
                              key={s.id}
                              style={{
                                display: 'flex', alignItems: 'flex-start', gap: 11,
                                padding: '11px 4px',
                                borderBottom: i < recentSubs.length - 1 ? `1px solid ${T.border}` : 'none',
                                transition: 'background 0.12s',
                                borderRadius: 4, margin: '0 -4px',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#1a1a2e')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <div style={{
                                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                                background: `${color}18`, border: `1px solid ${color}30`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <Icon size={13} color={color} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 12, fontWeight: 600, color: T.primary, margin: '0 0 2px' }}>
                                  {label}
                                </p>
                                <p style={{ fontSize: 11, color: T.secondary, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {vendor}
                                </p>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                                <Clock size={10} color={T.muted} />
                                <span style={{ fontSize: 11, color: T.muted, whiteSpace: 'nowrap' }}>
                                  {s.created_at ? relativeTime(s.created_at) : '—'}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
