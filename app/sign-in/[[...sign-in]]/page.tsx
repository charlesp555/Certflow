import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'
import { Shield } from 'lucide-react'

export default function SignInPage() {
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
      {/* Dot grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      {/* Orange center glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 700, height: 700, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(217,119,6,0.08) 0%, transparent 60%)',
        pointerEvents: 'none',
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
        <SignIn
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
