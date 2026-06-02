'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Shield, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 300, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(217,119,6,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        background: '#111118', border: '1px solid #1e1e2e',
        borderRadius: 20, padding: '40px 40px',
        width: '100%', maxWidth: 440,
        boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
        position: 'relative',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, background: 'rgba(217,119,6,0.15)',
            border: '1px solid rgba(217,119,6,0.30)', borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 12,
          }}>
            <Shield size={26} color="#D97706" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', color: '#f0ede8' }}>COVIRA</span>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0ede8', margin: '0 0 6px' }}>Welcome back</h1>
          <p style={{ fontSize: 14, color: '#8a8599', margin: 0 }}>Sign in to your Covira account</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#c4bfd8', marginBottom: 7 }}>
              Email address
            </label>
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                width: '100%', background: '#0a0a0f', border: '1px solid #1e1e2e',
                borderRadius: 8, padding: '11px 14px', fontSize: 14, color: '#f0ede8',
                outline: 'none', transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target.style.borderColor = '#D97706')}
              onBlur={e => (e.target.style.borderColor = '#1e1e2e')}
            />
          </div>

          {/* Password */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#c4bfd8' }}>Password</label>
              <a href="#" style={{ fontSize: 12, color: '#D97706', textDecoration: 'none', fontWeight: 500 }}>Forgot password?</a>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%', background: '#0a0a0f', border: '1px solid #1e1e2e',
                  borderRadius: 8, padding: '11px 42px 11px 14px', fontSize: 14, color: '#f0ede8',
                  outline: 'none', transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = '#D97706')}
                onBlur={e => (e.target.style.borderColor = '#1e1e2e')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: '#8a8599', padding: 2, display: 'flex', alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Sign In button */}
          <button
            style={{
              background: '#D97706', color: '#fff', fontSize: 15, fontWeight: 700,
              padding: '12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              width: '100%', marginTop: 4, transition: 'background 0.15s',
              boxShadow: '0 2px 8px rgba(217,119,6,0.30)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#b45309')}
            onMouseLeave={e => (e.currentTarget.style.background = '#D97706')}
          >
            Sign In
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#1e1e2e' }} />
            <span style={{ fontSize: 12, color: '#8a8599', flexShrink: 0 }}>or</span>
            <div style={{ flex: 1, height: 1, background: '#1e1e2e' }} />
          </div>

          {/* Google */}
          <button
            style={{
              background: 'transparent', color: '#f0ede8', fontSize: 14, fontWeight: 600,
              padding: '11px', borderRadius: 8, border: '1px solid #1e1e2e', cursor: 'pointer',
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.20)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e2e'; e.currentTarget.style.background = 'transparent' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Sign up link */}
        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#8a8599', margin: '24px 0 0' }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ color: '#D97706', textDecoration: 'none', fontWeight: 600 }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
