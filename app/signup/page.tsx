'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Shield, Eye, EyeOff } from 'lucide-react'

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })

  function updateField(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [key]: e.target.value }))
  }

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
        borderRadius: 20, padding: '40px',
        width: '100%', maxWidth: 440,
        boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
        position: 'relative',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
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
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0ede8', margin: '0 0 6px' }}>Create your account</h1>
          <p style={{ fontSize: 14, color: '#8a8599', margin: 0 }}>Start verifying vendor insurance in minutes</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Full Name */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#c4bfd8', marginBottom: 7 }}>Full Name</label>
            <input
              type="text"
              placeholder="Jane Smith"
              value={form.name}
              onChange={updateField('name')}
              style={{
                width: '100%', background: '#0a0a0f', border: '1px solid #1e1e2e',
                borderRadius: 8, padding: '11px 14px', fontSize: 14, color: '#f0ede8',
                outline: 'none', transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target.style.borderColor = '#D97706')}
              onBlur={e => (e.target.style.borderColor = '#1e1e2e')}
            />
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#c4bfd8', marginBottom: 7 }}>Email</label>
            <input
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={updateField('email')}
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
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#c4bfd8', marginBottom: 7 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={updateField('password')}
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
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#8a8599', padding: 2, display: 'flex', alignItems: 'center' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#c4bfd8', marginBottom: 7 }}>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-enter your password"
                value={form.confirm}
                onChange={updateField('confirm')}
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
                onClick={() => setShowConfirm(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#8a8599', padding: 2, display: 'flex', alignItems: 'center' }}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Create Account button */}
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
            Create Account
          </button>

          <p style={{ fontSize: 12, color: '#8a8599', textAlign: 'center', margin: '4px 0 0', lineHeight: 1.6 }}>
            By creating an account, you agree to our{' '}
            <a href="#" style={{ color: '#D97706', textDecoration: 'none' }}>Terms</a>
            {' '}and{' '}
            <a href="#" style={{ color: '#D97706', textDecoration: 'none' }}>Privacy Policy</a>.
          </p>
        </div>

        {/* Log in link */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#8a8599', margin: '20px 0 0' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#D97706', textDecoration: 'none', fontWeight: 600 }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
