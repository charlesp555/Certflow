'use client'
import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--bg3)' }}>
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px' }}
      >
        {/* Standard Covira lockup — shield-C mark + COVIRA in the voice face */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Image src="/covira-logo.png?v=3" alt="" width={40} height={40} style={{ flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-voice)', fontWeight: 700, fontSize: 15, letterSpacing: '0.20em', color: 'var(--ink-primary, #F2F4F8)' }}>
            COVIRA
          </span>
        </div>
        <div className="flex flex-wrap gap-6">
          {[
            { label: 'privacy',  href: '/privacy' },
            { label: 'terms',    href: '/terms'   },
            { label: 'security', href: '#'        },
            { label: 'status',   href: '#'        },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}
              className="nav-link"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: 'var(--muted)', lineHeight: 1.6 }}>
          © 2026 covira.io
        </p>
      </div>
    </footer>
  )
}
