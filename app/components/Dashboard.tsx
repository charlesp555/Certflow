'use client'
import { useEffect, useState } from 'react'

const vendors = [
  { name: 'Apex Plumbing LLC',      type: 'maintenance',  coverage: 'GL + Workers Comp', date: '04.02.26', status: 'expired'   },
  { name: 'Greenleaf Landscaping',  type: 'grounds',      coverage: 'General Liability',  date: '05.14.26', status: 'expiring'  },
  { name: 'CleanRight Services',    type: 'janitorial',   coverage: 'GL + Auto',          date: '01.30.27', status: 'compliant' },
  { name: 'Metro Electric Co.',     type: 'electrical',   coverage: 'GL + Workers Comp',  date: '03.15.27', status: 'compliant' },
  { name: 'Ironclad HVAC',          type: 'mechanical',   coverage: 'GL + Umbrella',      date: '06.01.26', status: 'expiring'  },
]

const logs = [
  { type: 'r', text: '[ALERT] apex_plumbing: GL policy expired 21 days ago — vendor blocked' },
  { type: 'a', text: '[WARN]  greenleaf: expiring in 21 days — automated outreach queued' },
  { type: 'a', text: '[WARN]  ironclad_hvac: expiring in 39 days — reminder scheduled' },
  { type: 'g', text: '[OK]    cleanright: all coverage verified + AI-audited ✓' },
  { type: 'm', text: 'covira engine v1.4 // last_sync: just now // 41 vendors monitored' },
]

const statusStyle = {
  expired:   { bg: 'var(--red-dim)',   color: '#fca5a5', border: 'rgba(239,68,68,0.25)',    label: 'EXPIRED'   },
  expiring:  { bg: 'var(--amber-glow)', color: '#fcd34d', border: 'rgba(245,158,11,0.3)',   label: 'EXPIRING'  },
  compliant: { bg: 'var(--green-dim)', color: '#6ee7b7', border: 'rgba(16,185,129,0.25)',   label: 'COMPLIANT' },
}

const dateColor = {
  expired:   'var(--red)',
  expiring:  'var(--amber)',
  compliant: 'var(--green)',
}

export default function Dashboard() {
  const [visibleLogs, setVisibleLogs] = useState<typeof logs>([])
  const [logIdx, setLogIdx] = useState(0)

  useEffect(() => {
    if (logIdx >= logs.length) return
    const t = setTimeout(() => {
      setVisibleLogs((prev) => [...prev, logs[logIdx]])
      setLogIdx((i) => i + 1)
    }, 700 + logIdx * 500)
    return () => clearTimeout(t)
  }, [logIdx])

  const logColor = { r: '#fca5a5', a: '#fcd34d', g: '#6ee7b7', m: 'var(--muted)' }

  return (
    <div
      className="rounded-lg overflow-hidden border"
      style={{ borderColor: 'var(--border2)', background: 'var(--bg2)' }}
    >
      {/* Window chrome */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '0.5px solid var(--border)', background: 'var(--bg)' }}
      >
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#f59e0b' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#10b981' }} />
        </div>
        <div className="mono text-[10px]" style={{ color: 'var(--muted)' }}>
          covira // vendor_compliance_dashboard
        </div>
        <div className="flex items-center gap-1.5 mono text-[10px]" style={{ color: 'var(--green)' }}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse-slow" style={{ background: 'var(--green)' }} />
          live
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3" style={{ borderBottom: '0.5px solid var(--border)' }}>
        {[
          { val: '03', label: 'expired',      color: 'var(--red)'   },
          { val: '07', label: 'expiring_soon', color: 'var(--amber)' },
          { val: '31', label: 'compliant',     color: 'var(--green)' },
        ].map((m, i) => (
          <div
            key={i}
            className="px-4 py-3"
            style={{ borderRight: i < 2 ? '0.5px solid var(--border)' : 'none' }}
          >
            <div className="mono text-2xl font-medium" style={{ color: m.color }}>{m.val}</div>
            <div className="mono text-[9px] tracking-widest uppercase mt-0.5" style={{ color: 'var(--muted)' }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Table header */}
      <div
        className="grid gap-2 px-4 py-2.5"
        style={{
          gridTemplateColumns: 'minmax(0,2fr) minmax(0,1.3fr) minmax(0,1fr) 76px',
          background: 'var(--bg3)',
          borderBottom: '0.5px solid var(--border)',
        }}
      >
        {['vendor', 'coverage', 'expires', 'status'].map((h) => (
          <div key={h} className="mono text-[9px] tracking-widest uppercase" style={{ color: 'var(--muted)' }}>{h}</div>
        ))}
      </div>

      {/* Rows */}
      {vendors.map((v, i) => {
        const s = statusStyle[v.status as keyof typeof statusStyle]
        return (
          <div
            key={i}
            className="grid gap-2 px-4 py-2.5 items-center"
            style={{
              gridTemplateColumns: 'minmax(0,2fr) minmax(0,1.3fr) minmax(0,1fr) 76px',
              borderBottom: i < vendors.length - 1 ? '0.5px solid var(--border)' : 'none',
            }}
          >
            <div>
              <div className="text-xs font-medium truncate">{v.name}</div>
              <div className="mono text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>// {v.type}</div>
            </div>
            <div className="mono text-[11px] truncate" style={{ color: 'var(--muted2)' }}>{v.coverage}</div>
            <div className="mono text-[11px]" style={{ color: dateColor[v.status as keyof typeof dateColor] }}>{v.date}</div>
            <div>
              <span
                className="mono text-[9px] px-2 py-0.5 rounded-sm font-medium tracking-wide"
                style={{ background: s.bg, color: s.color, border: `0.5px solid ${s.border}` }}
              >
                {s.label}
              </span>
            </div>
          </div>
        )
      })}

      {/* Terminal */}
      <div
        className="px-4 py-3 mono text-[10px] leading-relaxed"
        style={{ borderTop: '0.5px solid var(--border)', background: 'var(--bg)', minHeight: 96 }}
      >
        {visibleLogs.map((log, i) => (
          <div key={i} className="flex gap-2">
            <span style={{ color: 'var(--amber)', opacity: 0.6 }}>→</span>
            <span style={{ color: logColor[log.type as keyof typeof logColor] }}>{log.text}</span>
          </div>
        ))}
        {logIdx < logs.length && (
          <div className="flex gap-2">
            <span style={{ color: 'var(--amber)', opacity: 0.6 }}>→</span>
            <span className="animate-pulse" style={{ color: 'var(--muted)' }}>_</span>
          </div>
        )}
      </div>
    </div>
  )
}
