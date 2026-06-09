import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'
import { Shield } from 'lucide-react'

export default function SignUpPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      {/* Orange orb — top right */}
      <div style={{
        position: 'absolute', top: -100, right: -100,
        width: 600, height: 600, borderRadius: '50%',
        background: 'rgba(217,119,6,0.15)',
        filter: 'blur(120px)',
        pointerEvents: 'none',
      }} />
      {/* Purple/blue orb — bottom left */}
      <div style={{
        position: 'absolute', bottom: -100, left: -100,
        width: 600, height: 600, borderRadius: '50%',
        background: 'rgba(99,102,241,0.08)',
        filter: 'blur(100px)',
        pointerEvents: 'none',
      }} />
      {/* Dot grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />

      {/* Logo */}
      <div style={{ position: 'relative', zIndex: 1, marginBottom: 28 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'rgba(217,119,6,0.12)', border: '1px solid rgba(217,119,6,0.28)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={20} color="#D97706" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#f8f8f8', letterSpacing: '0.1em' }}>COVIRA</span>
        </Link>
      </div>

      {/* Card with orange glow */}
      <div style={{
        position: 'relative', zIndex: 1,
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 0 0 1px rgba(217,119,6,0.18), 0 0 50px rgba(217,119,6,0.10), 0 32px 80px rgba(0,0,0,0.55)',
      }}>
        <SignUp
          forceRedirectUrl="/dashboard"
          appearance={{
            variables: {
              colorPrimary: '#D97706',
              colorBackground: '#0a0a0f',
              colorInputBackground: '#111118',
              colorText: '#ffffff',
              colorTextSecondary: '#9ca3af',
              borderRadius: '8px',
            },
            elements: {
              card: 'bg-[#111118] border border-[#1e1e2e]',
              headerTitle: 'text-white',
              headerSubtitle: 'text-gray-400',
              formButtonPrimary: 'bg-[#D97706] hover:bg-[#B45309]',
            },
          }}
        />
      </div>
    </div>
  )
}
