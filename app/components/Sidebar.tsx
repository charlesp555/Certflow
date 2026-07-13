'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import {
  LayoutDashboard, Building2, FileText, TrendingUp,
  Bell, ClipboardList, FolderOpen, Puzzle, Settings, User,
} from 'lucide-react'

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',    href: '/dashboard'                      },
  { icon: Building2,       label: 'Vendors',      href: '/vendors'                        },
  { icon: FileText,        label: 'Submissions',  href: '/submissions'                    },
  { icon: TrendingUp,      label: 'Reports',      href: '/reports'                        },
  { icon: Bell,            label: 'Alerts',       href: '/alerts',       comingSoon: true },
  { icon: ClipboardList,   label: 'Requirements', href: '/requirements'                   },
  { icon: FolderOpen,      label: 'Documents',    href: '/documents'                      },
  { icon: Puzzle,          label: 'Integrations', href: '/integrations', comingSoon: true },
  { icon: Settings,        label: 'Settings',     href: '/settings'                       },
]

// Design Bible tokens — the nav is a raised graphite surface over the carbon
// page ground, seam hairlines throughout. Orange is EARNED: here it marks
// only the ACTIVE nav item's icon + edge hairline.
const T = {
  bg: '#171A21',        // --graphite
  border: '#262B35',    // --seam
  orange: '#F97316',    // --verified
  primary: '#F2F4F8',   // --ink-primary
  secondary: '#9AA3B2', // --ink-secondary
  disabled: '#5F6774',  // ink-secondary, reduced — coming-soon items
}

function isActive(href: string, pathname: string) {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname === href || pathname.startsWith(href + '/')
}

export default function Sidebar() {
  const pathname = usePathname()
  const { user } = useUser()
  const userName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.emailAddresses[0]?.emailAddress || 'User'
  const userEmail = user?.emailAddresses[0]?.emailAddress || ''

  return (
    <aside style={{
      width: 240, flexShrink: 0,
      background: T.bg,
      borderRight: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, bottom: 0, left: 0,
      zIndex: 50,
      fontFamily: 'var(--font-voice), sans-serif',
    }}>
      {/* Logo — the standard Covira lockup: shield-C mark + COVIRA in the
          voice face, identical to the landing nav. */}
      <div style={{ padding: '22px 20px 18px', borderBottom: `1px solid ${T.border}` }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <Image src="/covira-logo.png?v=3" alt="" width={40} height={40} style={{ flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-voice)', fontSize: 15, fontWeight: 700, letterSpacing: '0.20em', color: 'var(--ink-primary, #F2F4F8)' }}>COVIRA</span>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto' }}>
        {NAV.map(({ icon: Icon, label, href, comingSoon }) => {
          const active = !comingSoon && isActive(href, pathname)
          // Active: ink-primary label, orange ICON + edge hairline + faint
          // tint — restrained, never a filled orange block (§Color).
          const color = comingSoon ? T.disabled : (active ? T.primary : T.secondary)
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8, marginBottom: 2,
                background: active ? 'rgba(249,115,22,0.07)' : 'transparent',
                borderLeft: `2px solid ${active ? T.orange : 'transparent'}`,
                color,
                fontSize: 14, fontWeight: active ? 600 : 500,
                textDecoration: 'none',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                if (comingSoon) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                } else if (!active) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.color = T.primary
                }
              }}
              onMouseLeave={e => {
                if (comingSoon) {
                  e.currentTarget.style.background = 'transparent'
                } else if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = T.secondary
                }
              }}
            >
              <Icon size={16} strokeWidth={2} color={active ? T.orange : 'currentColor'} />
              <span style={{ flex: 1 }}>{label}</span>
              {comingSoon && (
                <span style={{
                  background: 'transparent',
                  color: '#5F6774',
                  border: '1px solid #262B35',
                  borderRadius: 2, padding: '1px 6px',
                  fontSize: 9, fontFamily: 'var(--font-evidence), monospace', letterSpacing: '0.05em',
                  lineHeight: 1.6, flexShrink: 0,
                }}>
                  SOON
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div style={{
        padding: '14px 16px', borderTop: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        {/* Neutral account mark — orange is not earned by merely existing. */}
        <div style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
          background: '#1C2029', border: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <User size={16} color={T.primary} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {userName}
          </div>
          <div style={{ fontSize: 11, color: T.secondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {userEmail}
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
