'use client'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--bg3)' }}>
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px' }}
      >
        <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.4px', color: 'var(--text)' }}>
          Covira
        </div>
        <div className="flex flex-wrap gap-6">
          {['privacy', 'terms', 'security', 'status'].map((item) => (
            <Link
              key={item}
              href="#"
              style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}
              className="nav-link"
            >
              {item}
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
