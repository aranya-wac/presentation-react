import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutTemplate,
  Library,
  Search,
  Home,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  FolderKanban,
  Palette,
  Keyboard,
  Sparkles,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../ui/Toast'
import { usageApi, type UsageInfo } from '../../api/client'
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal'
import { ThemeToggle } from './ThemeToggle'

// ── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const toast = useToast()
  const [usage, setUsage] = useState<UsageInfo | null>(null)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  // Load usage when sidebar mounts and when route changes (to catch new
  // presentations created elsewhere in the app).
  useEffect(() => {
    if (!user) return
    usageApi.get()
      .then(({ data }) => setUsage(data))
      .catch(() => {/* sidebar should never block on this — fail quietly */})
  }, [user, location.pathname])

  // Global `?` opens the shortcuts modal (skip when typing in inputs).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '?' || e.shiftKey === false && e.key !== '?') return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      e.preventDefault()
      setShortcutsOpen(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Esc closes the modal.
  useEffect(() => {
    if (!shortcutsOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShortcutsOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [shortcutsOpen])

  const handleLogout = async () => {
    const firstName = user?.full_name?.split(' ')[0]
    const toastId = toast.loading('Signing you out…', 'Clearing your session.')
    await new Promise((r) => setTimeout(r, 700))
    logout()
    toast.update(toastId, {
      variant: 'success',
      title: firstName ? `Signed out. See you, ${firstName}.` : 'Signed out.',
      description: 'You can sign back in anytime.',
    })
    await new Promise((r) => setTimeout(r, 900))
    navigate('/login')
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'U'

  const primary = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: LayoutTemplate, label: 'Presentations', path: '/decks' },
    { icon: FolderKanban, label: 'Projects', path: '/projects' },
    { icon: Library, label: 'Templates', path: '/templates' },
  ]

  const isActive = (path: string) =>
    path === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(path)

  // ── Collapsed ──────────────────────────────────────────────────────────────
  if (collapsed) {
    return (
      <aside
        className="w-[60px] flex-shrink-0 flex flex-col items-center py-4 gap-0.5"
        style={{ background: 'var(--surface-2)', borderRight: '1px solid var(--line)' }}
      >
        {/* Logo mark */}
        <button
          onClick={onToggle}
          className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 transition-opacity hover:opacity-80"
          style={{ background: 'var(--ink-strong)', color: 'var(--paper)' }}
        >
          <span className="text-[8px] font-bold tracking-tight">WAC</span>
        </button>

        {/* New presentation */}
        <button
          onClick={() => navigate('/create')}
          title="New Presentation"
          className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 transition-colors"
          style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--ink-strong)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.10)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.06)')}
        >
          <Plus size={14} />
        </button>

        {/* Nav icons */}
        {primary.map(({ icon: Icon, label, path }) => {
          const active = isActive(path)
          return (
            <button
              key={label}
              title={label}
              onClick={() => navigate(path)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{
                background: active ? 'var(--ink-strong)' : 'transparent',
                color: active ? 'var(--paper)' : 'var(--ink-muted)',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(0,0,0,0.06)'
                  e.currentTarget.style.color = 'var(--ink-strong)'
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--ink-muted)'
                }
              }}
            >
              <Icon size={15} />
            </button>
          )
        })}

        <div className="flex-1" />

        {/* Expand + avatar */}
        <button
          onClick={onToggle}
          title="Expand"
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ color: 'var(--ink-faint)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink-muted)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink-faint)')}
        >
          <ChevronsRight size={14} />
        </button>
        <button
          onClick={handleLogout}
          title={user?.full_name ?? 'Account'}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold mt-1 transition-opacity hover:opacity-80"
          style={{ background: 'var(--ink-strong)', color: 'var(--paper)' }}
        >
          {initials}
        </button>
      </aside>
    )
  }

  // ── Expanded ───────────────────────────────────────────────────────────────
  return (
    <aside
      className="w-[248px] flex-shrink-0 flex flex-col"
      style={{ background: 'var(--surface-2)', borderRight: '1px solid var(--line)' }}
    >
      {/* Studio header */}
      <div
        className="h-[54px] flex items-center px-4 gap-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--line)' }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--ink-strong)', color: 'var(--paper)' }}
        >
          <span className="text-[8px] font-bold tracking-tight">WAC</span>
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-[13.5px] font-semibold truncate leading-none"
            style={{ color: 'var(--ink-strong)', letterSpacing: '-0.02em' }}
          >
            Presentation Studio
          </p>
          <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--ink-faint)' }}>
            {user?.email ?? 'studio'}
          </p>
        </div>
        <button
          onClick={onToggle}
          title="Collapse"
          className="w-6 h-6 rounded-md flex items-center justify-center transition-colors flex-shrink-0"
          style={{ color: 'var(--ink-faint)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink-muted)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink-faint)')}
        >
          <ChevronsLeft size={13} />
        </button>
      </div>

      {/* Actions */}
      <div className="px-3 pt-3 pb-2 space-y-1.5">
        <button
          onClick={() => navigate('/create')}
          className="w-full h-9 px-3 rounded-xl text-[13px] font-semibold flex items-center gap-2 transition-all"
          style={{ background: 'var(--ink-strong)', color: 'var(--paper)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#1C1A17')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--ink-strong)')}
        >
          <Plus size={13} strokeWidth={2.5} />
          <span className="flex-1 text-left">New Presentation</span>
        </button>

        <button
          className="w-full flex items-center gap-2 px-3 h-8 rounded-lg text-[12.5px] transition-colors"
          style={{ background: 'rgba(0,0,0,0.04)', color: 'var(--ink-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.07)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
        >
          <Search size={12} />
          <span className="flex-1 text-left">Search</span>
          <span
            className="font-mono text-[10.5px]"
            style={{ color: 'var(--ink-faint)' }}
          >
            ⌘K
          </span>
        </button>
      </div>

      {/* Section label */}
      <p
        className="px-4 pt-4 pb-1.5 font-mono text-[10px] uppercase tracking-[0.14em]"
        style={{ color: 'var(--ink-faint)' }}
      >
        Studio
      </p>

      {/* Nav */}
      <nav className="px-2 flex flex-col gap-px">
        {primary.map(({ icon: Icon, label, path }) => {
          const active = isActive(path)
          return (
            <button
              key={label}
              onClick={() => navigate(path)}
              className="relative w-full flex items-center gap-2.5 px-3 h-[33px] rounded-lg text-[13px] transition-all"
              style={{
                background: active ? 'rgba(0,0,0,0.06)' : 'transparent',
                color: active ? 'var(--ink-strong)' : 'var(--ink-soft)',
                fontWeight: active ? 600 : 400,
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(0,0,0,0.04)'
                  e.currentTarget.style.color = 'var(--ink-strong)'
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--ink-soft)'
                }
              }}
            >
              {/* Active indicator */}
              {active && (
                <span
                  className="absolute left-0 top-[5px] bottom-[5px] w-[2.5px] rounded-full"
                  style={{ background: 'var(--ink-strong)' }}
                />
              )}
              <Icon size={14} />
              <span className="flex-1 text-left">{label}</span>
            </button>
          )
        })}
      </nav>

      <div className="flex-1" />

      {/* Plan + usage meter */}
      {usage && (
        <div className="px-3 pt-3 pb-2" style={{ borderTop: '1px solid var(--line)' }}>
          <PlanUsageBlock usage={usage} onUpgrade={() => toast.info('Upgrade plans', 'Paid plans launching soon.')} />
        </div>
      )}

      {/* Secondary footer links */}
      <div className="px-3 pb-2 flex flex-col gap-0.5" style={{ borderTop: usage ? 'none' : '1px solid var(--line)', paddingTop: usage ? 0 : 12 }}>
        <FooterLink
          icon={<Palette size={13} />}
          label="Brand kit"
          onClick={() => navigate('/brand-kit')}
        />
        <FooterLink
          icon={<Keyboard size={13} />}
          label="Shortcuts"
          shortcut="?"
          onClick={() => setShortcutsOpen(true)}
        />

        {/* Theme toggle */}
        <div
          className="flex items-center justify-between px-2 mt-1"
          style={{ height: 30 }}
        >
          <span className="text-[12px] font-medium" style={{ color: 'var(--ink-soft)' }}>
            Theme
          </span>
          <ThemeToggle />
        </div>
      </div>

      {/* Bottom — user + settings */}
      <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid var(--line)' }}>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 flex-1 px-2 py-1.5 rounded-lg transition-colors text-left min-w-0"
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
              style={{ background: 'var(--ink-strong)', color: 'var(--paper)' }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-[12.5px] font-semibold truncate leading-tight"
                style={{ color: 'var(--ink-strong)' }}
              >
                {user?.full_name ?? 'Account'}
              </p>
              <p className="text-[11px] truncate" style={{ color: 'var(--ink-muted)' }}>
                Sign out
              </p>
            </div>
          </button>

          <button
            title="Settings"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
            style={{ color: 'var(--ink-faint)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.05)'
              e.currentTarget.style.color = 'var(--ink-strong)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--ink-faint)'
            }}
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {shortcutsOpen && <KeyboardShortcutsModal onClose={() => setShortcutsOpen(false)} />}
    </aside>
  )
}

// ── Sidebar bits ────────────────────────────────────────────────────────────

function PlanUsageBlock({ usage, onUpgrade }: { usage: UsageInfo; onUpgrade: () => void }) {
  const limit = usage.generations_limit
  const used = usage.generations_used
  // Percentage with sane bounds. Unlimited plans show a quiet "Unlimited" hint
  // instead of a filled bar.
  const pct = limit ? Math.min(100, Math.round((used / Math.max(limit, 1)) * 100)) : 0
  const isNearLimit = limit !== null && pct >= 80
  const isAtLimit = limit !== null && used >= limit

  return (
    <div className="flex flex-col gap-2">
      {/* Plan row */}
      <div className="flex items-center justify-between">
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-semibold uppercase tracking-[0.06em]"
          style={{
            background: 'rgba(99,102,241,0.10)',
            color: '#6366f1',
            border: '1px solid rgba(99,102,241,0.18)',
          }}
        >
          <Sparkles size={9} strokeWidth={2.5} />
          {usage.plan_label}
        </span>
        {usage.upgrade_available && (
          <button
            onClick={onUpgrade}
            className="text-[11.5px] font-semibold transition-opacity hover:opacity-70"
            style={{ color: 'var(--ink-strong)' }}
          >
            Upgrade →
          </button>
        )}
      </div>

      {/* Usage meter */}
      {limit !== null ? (
        <>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: 'rgba(0,0,0,0.06)' }}
          >
            <div
              className="h-full transition-all"
              style={{
                width: `${pct}%`,
                background: isAtLimit
                  ? '#dc2626'
                  : isNearLimit
                    ? '#f59e0b'
                    : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                transition: 'width 300ms ease',
              }}
            />
          </div>
          <p className="text-[10.5px]" style={{ color: 'var(--ink-muted)' }}>
            {used} of {limit} generations this month
          </p>
        </>
      ) : (
        <p className="text-[10.5px]" style={{ color: 'var(--ink-muted)' }}>
          Unlimited generations
        </p>
      )}
    </div>
  )
}

function FooterLink({
  icon, label, onClick, shortcut,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  shortcut?: string
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-2 h-7 rounded-md transition-colors text-left"
      style={{ color: 'var(--ink-soft)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(0,0,0,0.04)'
        ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--ink-strong)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
        ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--ink-soft)'
      }}
    >
      <span style={{ display: 'inline-flex', width: 16, justifyContent: 'center' }}>{icon}</span>
      <span className="flex-1 text-[12px] font-medium">{label}</span>
      {shortcut && (
        <kbd
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            color: 'var(--ink-faint)',
          }}
        >
          {shortcut}
        </kbd>
      )}
    </button>
  )
}

// ── AppLayout ────────────────────────────────────────────────────────────────
export function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--paper)' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--paper)' }}>
        {children}
      </main>
    </div>
  )
}
