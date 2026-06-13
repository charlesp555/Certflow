'use client'

import { Bell } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { UserButton } from '@clerk/nextjs'

const T = {
  bg: '#0a0a0f',
  border: '#1a1a2e',
  orange: '#D97706',
  primary: '#f8f8f8',
  secondary: '#8b8fa8',
}

export default function AlertsPage() {
  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: T.bg, fontFamily: 'Inter, -apple-system, sans-serif',
      color: T.primary,
    }}>
      <style>{`
        @keyframes csFade {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes csFloat {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-7px); }
        }
        .cs-content { animation: csFade 0.4s ease both; }
        .cs-icon    { animation: csFloat 4s ease-in-out infinite 0.4s; }
      `}</style>

      <Sidebar />

      <main style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        <header style={{
          position: 'sticky', top: 0, zIndex: 40,
          background: T.bg, borderBottom: `1px solid ${T.border}`,
          height: 64, padding: '0 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: T.primary, margin: 0, lineHeight: 1.2 }}>
              Alerts
            </h1>
            <p style={{ fontSize: 12, color: T.secondary, margin: 0 }}>
              Active compliance issues requiring attention
            </p>
          </div>
          <UserButton />
        </header>

        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 28,
        }}>
          <div className="cs-content" style={{ textAlign: 'center', maxWidth: 380 }}>
            <div className="cs-icon" style={{
              width: 76, height: 76, borderRadius: '50%',
              background: 'rgba(217,119,6,0.08)',
              border: '1px solid rgba(217,119,6,0.16)',
              boxShadow: '0 0 48px rgba(217,119,6,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 28px',
            }}>
              <Bell size={30} color={T.orange} strokeWidth={1.5} style={{ opacity: 0.7 }} />
            </div>

            <h2 style={{
              fontSize: 22, fontWeight: 700, color: T.primary,
              margin: '0 0 10px', letterSpacing: '-0.02em',
            }}>
              Alerts — Coming Soon
            </h2>
            <p style={{ fontSize: 14, color: T.secondary, margin: 0, lineHeight: 1.75 }}>
              This feature is launching soon. Stay tuned.
            </p>
          </div>
        </div>

      </main>
    </div>
  )
}
