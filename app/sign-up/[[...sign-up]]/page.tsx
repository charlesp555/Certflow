import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'

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
      {/* Blue orb — bottom left */}
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
          <svg fill="none" viewBox="0 0 100 115" style={{ height: 34, width: 'auto', flexShrink: 0 }}>
            <path
              d="M50 8C44 6 38 4 33 5C19 3 9 13 9 28L9 55C9 77 24 93 50 104C76 93 91 77 91 55L91 28C91 13 81 3 67 5C62 4 56 6 50 8Z"
              fill="#D97706"
            />
          </svg>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#f8f8f8', letterSpacing: '0.1em' }}>
            COVIRA
          </span>
        </Link>
      </div>

      {/* Clerk SignUp card */}
      <div style={{
        position: 'relative', zIndex: 1,
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 0 0 1px rgba(217,119,6,0.18), 0 0 50px rgba(217,119,6,0.10), 0 32px 80px rgba(0,0,0,0.55)',
      }}>
        <SignUp
          signInUrl="/sign-in"
          forceRedirectUrl="/dashboard"
          appearance={{
            variables: {
              colorPrimary: '#D97706',
              colorBackground: '#111118',
              colorInputBackground: '#1a1a24',
              colorText: '#f8f8f8',
              colorTextSecondary: '#9ca3af',
              colorTextOnPrimaryBackground: '#ffffff',
              colorInputText: '#f8f8f8',
              colorNeutral: '#6b7280',
              borderRadius: '8px',
              fontFamily: 'Inter, -apple-system, sans-serif',
            },
            elements: {
              card: {
                background: '#111118',
                border: '1px solid #1e1e2e',
                boxShadow: 'none',
                borderRadius: '12px',
              },
              headerTitle: { color: '#f8f8f8' },
              headerSubtitle: { color: '#9ca3af' },
              formButtonPrimary: {
                backgroundColor: '#D97706',
                color: '#ffffff',
                fontWeight: '600',
              },
              formFieldInput: {
                backgroundColor: '#1a1a24',
                borderColor: '#2a2a3a',
                color: '#f8f8f8',
              },
              formFieldLabel: { color: '#d1d5db' },
              socialButtonsBlockButton: {
                backgroundColor: 'transparent',
                borderColor: '#2a2a3a',
                color: '#d1d5db',
              },
              socialButtonsBlockButtonText: { color: '#d1d5db' },
              dividerLine: { backgroundColor: '#2a2a3a' },
              dividerText: { color: '#6b7280' },
              footerActionLink: { color: '#D97706' },
              footerActionText: { color: '#9ca3af' },
              identityPreviewText: { color: '#f8f8f8' },
              identityPreviewEditButtonIcon: { color: '#D97706' },
              formFieldSuccessText: { color: '#22c55e' },
              alertText: { color: '#f87171' },
              alert: {
                backgroundColor: 'rgba(239,68,68,0.10)',
                borderColor: 'rgba(239,68,68,0.25)',
              },
            },
          }}
        />
      </div>
    </div>
  )
}
