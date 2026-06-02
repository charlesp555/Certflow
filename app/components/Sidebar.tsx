'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Building2, FileText, TrendingUp,
  Bell, ClipboardList, FolderOpen, Puzzle, Settings,
  Shield, User,
} from 'lucide-react'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',    href: '/dashboard',  exact: true  },
  { icon: Building2,       label: 'Vendors',      href: '/vendors',    exact: false },
  { icon: FileText,        label: 'Submissions',  href: '/report',     exact: true  },
  { icon: TrendingUp,      label: 'Reports',      href: '/report',     exact: false },
  { icon: Bell,            label: 'Alerts',       href: '/dashboard',  exact: false },
  { icon: ClipboardList,   label: 'Requirements', href: '/dashboard',  exact: false },
  { icon: FolderOpen,      label: 'Documents',    href: '/vendors',    exact: false },
  { icon: Puzzle,          label: 'Integrations', href: '/dashboard',  exact: false },
  { icon: Settings,        label: 'Settings',     href: '/dashboard',  exact: false },
]

export default function Sidebar() {
  const pathname = usePathname()

  function isActive(href: string, label: string, exact: boolean) {
    if (label === 'Vendors' || href === '/vendors') {
      return pathname === '/vendors' || pathname.startsWith('/vendors/')
    }
    if (label === 'Dashboard' || (href === '/dashboard' && exact)) {
      return pathname === '/dashboard'
    }
    if (label === 'Submissions' && href === '/report') {
      return pathname === '/report'
    }
    if (exact) return pathname === href
    return false
  }

  return (
    <aside style={{
      width: 240, flexShrink: 0, background: '#111118',
      borderRight: '1px solid #1e1e2e',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, bottom: 0, left: 0,
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #1e1e2e' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 32, height: 32, background: 'rgba(217,119,6,0.15)',
            border: '1px solid rgba(217,119,6,0.30)', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={18} color="#D97706" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.5px', color: '#f0ede8' }}>COVIRA</span>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
        {NAV_ITEMS.map(({ icon: Icon, label, href, exact }) => {
          const active = isActive(href, label, exact)
          return (
            <Link
              key={label}
              href={href}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '9px 12px',
                borderRadius: 8, marginBottom: 2,
                background: active ? 'rgba(217,119,6,0.10)' : 'transparent',
                borderLeft: active ? '2px solid #D97706' : '2px solid transparent',
                color: active ? '#D97706' : '#8a8599',
                fontSize: 14, fontWeight: active ? 600 : 500,
                cursor: 'pointer', textDecoration: 'none',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.color = '#f0ede8'
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#8a8599'
                }
              }}
            >
              <Icon size={16} strokeWidth={2} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom user section */}
      <div style={{
        padding: '16px', borderTop: '1px solid #1e1e2e',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'rgba(217,119,6,0.20)', border: '1px solid rgba(217,119,6,0.30)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <User size={16} color="#D97706" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#f0ede8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>James Carter</div>
          <div style={{ fontSize: 11, color: '#8a8599', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Operations Manager</div>
        </div>
        <Link href="/dashboard" style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          padding: 4, borderRadius: 6, color: '#8a8599',
          display: 'flex', alignItems: 'center',
          transition: 'color 0.15s', textDecoration: 'none',
        }}>
          <Settings size={14} color="#8a8599" />
        </Link>
      </div>
    </aside>
  )
}
