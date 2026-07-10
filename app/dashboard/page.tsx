'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useUser, useAuth, UserButton } from '@clerk/nextjs'
import { createClerkSupabaseClient } from '@/lib/supabase'
import {
  Bell, User, ChevronDown, AlertTriangle,
  ArrowRight, Users, CheckCircle2, Clock,
} from 'lucide-react'
import Sidebar from '../components/Sidebar'

const T = {
  bg: '#0a0a0f',
  surface: '#0f0f17',
  card: '#13131f',
  border: '#1a1a2e',
  orange: '#F97316',
  green: '#22c55e',
  blue: '#3b82f6',
  primary: '#f8f8f8',
  secondary: '#8b8fa8',
  muted: '#4b5063',
}

type Vendor = {
  id: string
  name: string
  status: string
  expiration_date: string | null
}

type Submission = {
  id: string
  vendor_id: string | null
  status: string
  issues_count: number
  created_at: string
  analysis_result: { expirationDate?: string } | null
}

function useCountUp(target: number, duration = 1100): number {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let raf: number
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(target * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return val
}

function MetricCard({
  label, target, tag, tagColor, icon: Icon, isIssues = false,
}: {
  label: string
  target: number
  tag: string
  tagColor: 'green' | 'orange'
  icon: React.ElementType
  isIssues?: boolean
}) {
  const val = useCountUp(target)
  const [hov, setHov] = useState(false)
  const accent = tagColor === 'green' ? T.green : T.orange
  const tagBg = tagColor === 'green' ? 'rgba(34,197,94,0.10)' : 'rgba(249,115,22,0.10)'
  const tagBorder = tagColor === 'green' ? 'rgba(34,197,94,0.20)' : 'rgba(249,115,22,0.20)'

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, minWidth: 0,
        background: T.card, border: `1px solid ${T.border}`,
        borderTop: `2px solid ${hov ? T.orange : 'transparent'}`,
        borderRadius: 12, padding: '20px 22px', position: 'relative',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-top-color 0.2s ease',
        transform: hov ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hov ? '0 12px 40px rgba(0,0,0,0.55)' : '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      <div style={{
        position: 'absolute', top: 18, right: 18,
        width: 30, height: 30, borderRadius: 8,
        background: 'rgba(249,115,22,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={14} color={T.orange} strokeWidth={2} style={{ opacity: 0.6 }} />
      </div>
      <div style={{ fontSize: 12, color: T.secondary, fontWeight: 500, marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 33, fontWeight: 800, color: T.primary, lineHeight: 1, marginBottom: 12, letterSpacing: '-1px' }}>{val}</div>
      <div
        className={isIssues ? 'issues-badge' : ''}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: tagBg, color: accent, border: `1px solid ${tagBorder}`,
          borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600,
        }}
      >
        {tag}
      </div>
    </div>
  )
}

function AnimatedDonut({ compliant, issues, expiring, total }: {
  compliant: number
  issues: number
  expiring: number
  total: number
}) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setProgress(0)
    let raf: number
    const duration = 1050
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setProgress(eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [compliant, issues, expiring])

  const R = 70, cx = 100, cy = 100
  const C = 2 * Math.PI * R
  const safeTotal = total || 1

  const segments = [
    { pct: compliant / safeTotal, color: T.green,  label: 'Compliant',     count: compliant },
    { pct: issues   / safeTotal, color: T.orange, label: 'Issues Found',  count: issues    },
    { pct: expiring / safeTotal, color: T.blue,   label: 'Expiring Soon', count: expiring  },
  ]

  let cum = 0
  const arcs = segments.map(seg => {
    const start = cum
    const end = cum + seg.pct
    let drawn = 0
    if (progress >= end)       drawn = seg.pct * C
    else if (progress > start) drawn = (progress - start) * C
    cum += seg.pct
    return { ...seg, dash: drawn, gap: C - drawn, rotation: start * 360 - 90 }
  })

  const centerPct = total === 0 ? 0 : Math.round((compliant / total) * 100 * progress)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
      <div style={{ position: 'relative', width: 200, height: 200, flexShrink: 0 }}>
        <svg width="200" height="200" viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
          <circle cx={cx} cy={cy} r={R} fill="none" stroke="#1a1a2e" strokeWidth={24} />
          {total > 0 && arcs.map((arc, i) => (
            <circle
              key={i} cx={cx} cy={cy} r={R}
              fill="none" stroke={arc.color} strokeWidth={24}
              strokeDasharray={`${arc.dash} ${arc.gap}`}
              strokeLinecap="butt"
              style={{ transform: `rotate(${arc.rotation}deg)`, transformOrigin: `${cx}px ${cy}px` }}
            />
          ))}
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: T.primary, lineHeight: 1.1, letterSpacing: '-1px' }}>
            {centerPct}%
          </div>
          <div style={{ fontSize: 12, color: T.secondary, marginTop: 4 }}>
            {total === 0 ? 'No data' : 'Compliant'}
          </div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {segments.map(seg => (
          <div key={seg.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: T.secondary }}>{seg.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.primary }}>{seg.count}</span>
              <span style={{
                fontSize: 11, color: T.muted,
                background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
                borderRadius: 4, padding: '1px 7px',
              }}>
                {total === 0 ? '0%' : `${Math.round(seg.pct * 100)}%`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ActionItem({ text, index, mounted }: { text: string; index: number; mounted: boolean }) {
  const [hov, setHov] = useState(false)
  return (
    <Link
      href="/vendors"
      className={mounted ? 'action-animate' : 'pre-animate'}
      style={{
        display: 'flex', alignItems: 'center', gap: 11,
        padding: '11px 13px',
        background: hov ? 'rgba(249,115,22,0.10)' : 'rgba(249,115,22,0.05)',
        border: `1px solid ${hov ? 'rgba(249,115,22,0.25)' : 'rgba(249,115,22,0.12)'}`,
        borderRadius: 9, textDecoration: 'none',
        animationDelay: mounted ? `${index * 80 + 150}ms` : undefined,
        transition: 'background 0.15s, border-color 0.15s',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <AlertTriangle size={15} color={T.orange} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: T.primary, lineHeight: 1.5, fontWeight: 500, flex: 1 }}>{text}</span>
      <ArrowRight
        size={13} color={T.secondary}
        style={{ flexShrink: 0, opacity: hov ? 1 : 0, transition: 'opacity 0.15s' }}
      />
    </Link>
  )
}

export default function Dashboard() {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const supabase = useMemo(() => createClerkSupabaseClient(getToken), [getToken])
  const [mounted, setMounted] = useState(false)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!isLoaded || !user) return
    const userId = user.id

    async function fetchData() {
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('*')
        .eq('clerk_user_id', userId)

      const { data: submissionData } = await supabase
        .from('submissions')
        .select('*')
        .eq('clerk_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      setVendors(vendorData || [])
      setSubmissions(submissionData || [])
      setLoading(false)
    }

    fetchData()
  }, [user, isLoaded])

  const totalVendors    = vendors.length
  const compliantVendors = vendors.filter(v => v.status === 'active').length
  const expiringSoon    = vendors.filter(v => v.status === 'expiring').length
  const issuesFound     = vendors.filter(v => v.status === 'non_compliant' || v.status === 'expired').length
  const compliantPct    = totalVendors === 0 ? 0 : Math.round((compliantVendors / totalVendors) * 100)

  const actionItems: string[] = []
  if (issuesFound > 0)   actionItems.push(`${issuesFound} vendor${issuesFound > 1 ? 's have' : ' has'} compliance issues`)
  if (expiringSoon > 0)  actionItems.push(`${expiringSoon} COI${expiringSoon > 1 ? 's' : ''} expiring soon`)
  const expired = vendors.filter(v => v.status === 'expired').length
  if (expired > 0)       actionItems.push(`${expired} COI${expired > 1 ? 's' : ''} already expired`)

  const vendorMap = Object.fromEntries(vendors.map(v => [v.id, v.name]))

  const userName  = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.emailAddresses[0]?.emailAddress || 'User'
  const firstName = user?.firstName || 'there'

  if (!isLoaded || loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: 'Inter, -apple-system, sans-serif', color: T.primary }}>
        <Sidebar />
        <main style={{ marginLeft: 240, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: T.secondary, fontSize: 14 }}>Loading...</div>
        </main>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: 'Inter, -apple-system, sans-serif', color: T.primary }}>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(18px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes issueGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(249,115,22,0); }
          50%       { box-shadow: 0 0 10px 3px rgba(249,115,22,0.20); }
        }
        @keyframes bellDot {
          0%, 100% { transform: scale(1);    opacity: 1; }
          50%       { transform: scale(0.72); opacity: 0.45; }
        }
        .pre-animate     { opacity: 0; }
        .row-animate     { animation: fadeSlideUp 0.38s ease both; }
        .action-animate  { animation: slideInRight 0.38s ease both; }
        .issues-badge    { animation: issueGlow 3.2s ease-in-out infinite; }
        .bell-dot        { animation: bellDot 2.8s ease-in-out infinite; }
      `}</style>

      <Sidebar />

      <main style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* Header */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 40,
          background: T.bg, borderBottom: `1px solid ${T.border}`,
          height: 64, padding: '0 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: T.primary, margin: 0, lineHeight: 1.2 }}>Dashboard</h1>
            <p style={{ fontSize: 12, color: T.secondary, margin: 0 }}>Welcome back, {firstName}</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button style={{
              position: 'relative', background: 'none',
              border: `1px solid ${T.border}`, borderRadius: 8,
              width: 38, height: 38, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: T.secondary, transition: 'border-color 0.15s, color 0.15s, background 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.orange; e.currentTarget.style.color = T.primary; e.currentTarget.style.background = 'rgba(249,115,22,0.06)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.secondary; e.currentTarget.style.background = 'none' }}
            >
              <Bell size={17} />
              <span className="bell-dot" style={{
                position: 'absolute', top: 9, right: 9,
                width: 7, height: 7, borderRadius: '50%',
                background: T.orange, border: `2px solid ${T.bg}`,
              }} />
            </button>

            <UserButton />
          </div>
        </header>

        {/* Content */}
        <div style={{ padding: 24, flex: 1 }}>

          {totalVendors === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 40px' }}>
              <h2 style={{ color: '#ffffff', fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
                Welcome to Covira
              </h2>
              <p style={{ color: '#9ca3af', fontSize: 16, marginBottom: 32 }}>
                Add your first vendor to start verifying compliance.
              </p>
              <a href="/vendors" style={{ background: '#F97316', color: '#ffffff', padding: '12px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
                Add Your First Vendor
              </a>
            </div>
          ) : (
            <>
              {/* Metric cards */}
              <div style={{ display: 'flex', gap: 14, marginBottom: 22 }}>
                <MetricCard label="Total Vendors" target={totalVendors}     tag={`${totalVendors} total`}                        tagColor="green"  icon={Users}         />
                <MetricCard label="Compliant"     target={compliantVendors} tag={`${compliantPct}%`}                             tagColor="green"  icon={CheckCircle2}  />
                <MetricCard label="Issues Found"  target={issuesFound}      tag={issuesFound > 0 ? 'Review needed' : 'None'}     tagColor="orange" icon={AlertTriangle} isIssues />
                <MetricCard label="Expiring Soon" target={expiringSoon}     tag={expiringSoon > 0 ? 'Action needed' : 'None'}    tagColor="orange" icon={Clock}         />
              </div>

              {/* Two-column layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 310px', gap: 18, alignItems: 'start' }}>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                  {/* Compliance Overview */}
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, transition: 'border-color 0.2s, box-shadow 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#2a2a3e'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                      <h2 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: 0 }}>Compliance Overview</h2>
                      <button style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`,
                        borderRadius: 6, padding: '5px 10px',
                        fontSize: 12, color: T.secondary, cursor: 'pointer',
                        transition: 'border-color 0.15s',
                      }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = '#2a2a3e')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
                      >
                        This Month <ChevronDown size={11} />
                      </button>
                    </div>
                    <AnimatedDonut
                      compliant={compliantVendors}
                      issues={issuesFound}
                      expiring={expiringSoon}
                      total={totalVendors}
                    />
                  </div>

                  {/* Recent Submissions */}
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, transition: 'border-color 0.2s, box-shadow 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#2a2a3e'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                      <h2 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: 0 }}>Recent Submissions</h2>
                      <Link href="/reports"
                        style={{ fontSize: 13, color: T.orange, textDecoration: 'none', fontWeight: 500, transition: 'opacity 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                      >
                        View all →
                      </Link>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            {['Vendor', 'COI Uploaded', 'Status', 'Issues', 'Expiration Date'].map(col => (
                              <th key={col} style={{
                                textAlign: 'left', padding: '0 12px 12px',
                                fontSize: 10, color: T.muted, fontWeight: 600,
                                textTransform: 'uppercase', letterSpacing: '0.07em',
                                borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap',
                              }}>
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {submissions.length === 0 ? (
                            <tr>
                              <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                                No submissions yet. Upload your first COI to get started.
                              </td>
                            </tr>
                          ) : (
                            submissions.map((row, i) => {
                              const vendorName = vendorMap[row.vendor_id ?? ''] || 'Unknown Vendor'
                              const expDate = row.analysis_result?.expirationDate || '—'
                              const uploadedDate = row.created_at
                                ? new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                : '—'
                              return (
                                <tr
                                  key={row.id}
                                  className={mounted ? 'row-animate' : 'pre-animate'}
                                  style={{ cursor: 'pointer', animationDelay: mounted ? `${i * 80}ms` : undefined, transition: 'background 0.15s' }}
                                  onMouseEnter={e => (e.currentTarget.style.background = '#1a1a2e')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                  <td style={{ padding: '13px 12px', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>
                                    <Link
                                      href={row.vendor_id ? `/vendors/${row.vendor_id}` : '/vendors'}
                                      style={{ fontSize: 13, fontWeight: 600, color: T.primary, textDecoration: 'none', transition: 'color 0.15s' }}
                                      onMouseEnter={e => (e.currentTarget.style.color = T.orange)}
                                      onMouseLeave={e => (e.currentTarget.style.color = T.primary)}
                                    >
                                      {vendorName}
                                    </Link>
                                  </td>
                                  <td style={{ padding: '13px 12px', fontSize: 12, color: T.secondary, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>
                                    {uploadedDate}
                                  </td>
                                  <td style={{ padding: '13px 12px', borderBottom: `1px solid ${T.border}` }}>
                                    {row.status === 'Compliant' ? (
                                      <span style={{ background: 'rgba(34,197,94,0.09)', color: T.green, border: '1px solid rgba(34,197,94,0.22)', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                        Compliant
                                      </span>
                                    ) : (
                                      <span style={{ background: 'rgba(249,115,22,0.09)', color: T.orange, border: '1px solid rgba(249,115,22,0.22)', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                        Issues Found
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ padding: '13px 12px', fontSize: 13, fontWeight: 700, color: row.issues_count > 0 ? T.orange : T.muted, borderBottom: `1px solid ${T.border}`, textAlign: 'center' }}>
                                    {row.issues_count}
                                  </td>
                                  <td style={{ padding: '13px 12px', fontSize: 12, color: T.secondary, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>
                                    {expDate}
                                  </td>
                                </tr>
                              )
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Action Items */}
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 22, transition: 'border-color 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#2a2a3e'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: 0 }}>Action Items</h2>
                    <Link href="/vendors"
                      style={{ fontSize: 13, color: T.orange, textDecoration: 'none', fontWeight: 500, transition: 'opacity 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                      View all →
                    </Link>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                    {actionItems.length === 0 ? (
                      <p style={{ color: '#9ca3af', fontSize: 14 }}>No action items. All vendors are compliant.</p>
                    ) : (
                      actionItems.map((text, i) => (
                        <ActionItem key={i} text={text} index={i} mounted={mounted} />
                      ))
                    )}
                  </div>

                  {actionItems.length > 0 && (
                    <div style={{
                      marginTop: 16, padding: '11px 13px',
                      background: 'rgba(255,255,255,0.025)', border: `1px solid ${T.border}`,
                      borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Users size={13} color={T.secondary} />
                        <span style={{ fontSize: 12, color: T.secondary }}>Total open items</span>
                      </div>
                      <span style={{
                        background: 'rgba(249,115,22,0.12)', color: T.orange,
                        fontSize: 12, fontWeight: 700,
                        borderRadius: 20, padding: '2px 10px',
                        border: '1px solid rgba(249,115,22,0.20)',
                      }}>
                        {actionItems.length}
                      </span>
                    </div>
                  )}
                </div>

              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
