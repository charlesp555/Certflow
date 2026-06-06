'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Shield } from 'lucide-react'
import { UserButton, useAuth } from '@clerk/nextjs'

export default function Nav() {
  const [open, setOpen] = useState(false)
  const { isSignedIn } = useAuth()

  return (
    <nav style={{
      borderBottom: '1px solid var(--border)',
      background: 'rgba(10,10,15,0.92)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div
        className="flex items-center justify-between"
        style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 60 }}
      >
        <Link href="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
          <Shield size={18} color="#D97706" strokeWidth={2.5} />
          <span style={{ letterSpacing: '-0.5px', fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>
            COVIRA
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center" style={{ gap: 28 }}>
          <Link href="/dashboard" className="nav-link">Product</Link>
          <Link href="/pricing" className="nav-link">Pricing</Link>
          {!isSignedIn && (
            <>
              <Link href="/sign-in" className="nav-link">Log In</Link>
              <Link href="/sign-up" style={{ background: 'var(--amber)', color: '#ffffff', fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 8, textDecoration: 'none', transition: 'background 0.15s' }}>
                Get Started
              </Link>
            </>
          )}
          {isSignedIn && <UserButton />}
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex md:hidden items-center justify-center"
          onClick={() => setOpen(v => !v)}
          aria-label="Toggle menu"
          style={{
            background: 'transparent',
            border: '1px solid var(--border2)',
            borderRadius: 8,
            width: 38,
            height: 38,
            cursor: 'pointer',
            color: 'var(--text)',
            fontSize: 15,
          }}
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div
          className="flex md:hidden flex-col"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--bg2)', padding: '8px 24px 24px' }}
        >
          {[
            { href: '/dashboard', label: 'Product' },
            { href: '/pricing',   label: 'Pricing' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              style={{
                display: 'block',
                color: 'var(--text)',
                fontSize: 16,
                textDecoration: 'none',
                fontWeight: 500,
                padding: '13px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              {item.label}
            </Link>
          ))}
          {!isSignedIn && (
            <>
              <Link href="/sign-in" onClick={() => setOpen(false)} style={{ display: 'block', color: 'var(--text)', fontSize: 16, fontWeight: 500, padding: '13px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none' }}>
                Log In
              </Link>
              <Link href="/sign-up" onClick={() => setOpen(false)} style={{ display: 'block', width: '100%', background: 'var(--amber)', color: '#ffffff', fontSize: 15, fontWeight: 600, padding: '14px 20px', borderRadius: 10, textAlign: 'center', marginTop: 16, textDecoration: 'none' }}>
                Get Started →
              </Link>
            </>
          )}
          {isSignedIn && (
            <div style={{ padding: '13px 0', borderTop: '1px solid var(--border)' }}>
              <UserButton />
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
