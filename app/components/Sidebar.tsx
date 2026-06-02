'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Building2, FileText, TrendingUp,
  Bell, ClipboardList, FolderOpen, Puzzle, Settings, Shield, User,
} from 'lucide-react'

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',    href: '/dashboard'    },
  { icon: Building2,       label: 'Vendors',      href: '/vendors'      },
  { icon: FileText,        label: 'Submissions',  href: '/submissions'  },
  { icon: TrendingUp,      label: 'Reports',      href: '/reports'      },
  { icon: Bell,            label: 'Alerts',       href: '/alerts'       },
  { icon: ClipboardList,   label: 'Requirements', href: '/requirements' },
  { icon: FolderOpen,      label: 'Documents',    href: '/documents'    },
  { icon: Puzzle,          label: 'Integrations', href: '/integrations' },
  { icon: Settings,        label: 'Settings',     href: '/settings'     },
]

const T = {
  bg: '#0f0f17',
  border: '#1a1a2e',
  orange: '#D97706',
  primary: '#f8f8f8',
  secondary: '#8b8fa8',
}

function isActive(href: string, pathname: string) {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname === href || pathname.startsWith(href + '/')
}

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      width: 240, flexShrink: 0,
      background: T.bg,
      borderRight: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, bottom: 0, left: 0,
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ padding: '22px 20px 18px', borderBottom: `1px solid ${T.border}` }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 32, height: 32,
            background: 'rgba(217,119,6,0.12)', border: '1px solid rgba(217,119,6,0.25)',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={17} color={T.orange} strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.07em', color: T.primary }}>COVIRA</span>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto' }}>
        {NAV.map(({ icon: Icon, label, href }) => {
          const active = isActive(href, pathname)
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8, marginBottom: 2,
                background: active ? 'rgba(217,119,6,0.10)' : 'transparent',
                borderLeft: `2px solid ${active ? T.orange : 'transparent'}`,
                color: active ? T.orange : T.secondary,
                fontSize: 14, fontWeight: active ? 600 : 500,
                textDecoration: 'none',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.color = T.primary
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = T.secondary
                }
              }}
            >
              <Icon size={16} strokeWidth={2} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div style={{
        padding: '14px 16px', borderTop: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(217,119,6,0.15)', border: '1px solid rgba(217,119,6,0.28)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <User size={16} color={T.orange} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            James Carter
          </div>
          <div style={{ fontSize: 11, color: T.secondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Operations Manager
          </div>
        </div>
        <Link href="/settings" style={{
          display: 'flex', color: T.secondary, textDecoration: 'none',
          padding: 4, borderRadius: 6, transition: 'color 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = T.primary)}
          onMouseLeave={e => (e.currentTarget.style.color = T.secondary)}
        >
          <Settings size={14} />
        </Link>
      </div>
    </aside>
  )
}
