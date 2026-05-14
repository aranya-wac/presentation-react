import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { presentationsApi, templatesApi } from '../api/client'
import { AppLayout } from '../components/Layout/AppLayout'
import { SlidePreview } from '../components/Presentation/SlidePreview'
import { Button } from '../components/ui/Button'
import type { PresentationListItem, TemplateListItem } from '../types'
import {
  Upload, MoreHorizontal, Sparkles, ArrowUpRight,
  LayoutGrid, ArrowDownToLine, Clock, Star,
} from 'lucide-react'
import { ImportModal } from '../components/Dashboard/ImportModal'

const SLIDE_W = 1280
const SLIDE_H = 720

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [presentations, setPresentations] = useState<PresentationListItem[]>([])
  const [templates, setTemplates] = useState<TemplateListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)

  useEffect(() => {
    Promise.all([presentationsApi.list(), templatesApi.list()])
      .then(([pRes, tRes]) => {
        setPresentations(pRes.data)
        setTemplates(tRes.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this presentation?')) return
    await presentationsApi.delete(id)
    setPresentations((ps) => ps.filter((p) => p.id !== id))
    setOpenMenu(null)
  }

  const heroTemplates = templates.slice(0, 3)

  return (
    <AppLayout>
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}

      {/* ── Sticky top bar ──────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between px-8 h-[54px]"
        style={{
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <p className="eyebrow" style={{ color: 'var(--ink-faint)' }}>— Home</p>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setShowImport(true)}
            leadingIcon={<Upload size={12} />}
          >
            Import
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/create')}
            leadingIcon={<Sparkles size={12} />}
          >
            New Presentation
          </Button>
        </div>
      </div>

      {/* ── Page content ────────────────────────────────────────────────────── */}
      <div className="px-10 lg:px-14 pt-14 pb-24 max-w-[1280px] mx-auto">

        {/* ── Hero ── */}
        <div className="mb-12 max-w-[920px]">
          <h1
            className="font-serif leading-[1.08] tracking-tightest mb-5"
            style={{
              fontSize: 'clamp(34px, 3.6vw, 46px)',
              color: 'var(--ink-strong)',
            }}
          >
            Create professional presentations <span className="font-serif-italic">faster.</span>
          </h1>
          <p
            className="text-[14.5px] max-w-md leading-relaxed"
            style={{ color: 'var(--ink-soft)' }}
          >
            AI-powered slides, templates, and PowerPoint editing — all in one workspace.
          </p>
        </div>

        {/* ── Quick generate input ── */}
        <QuickGenerateInput onSubmit={(prompt) => navigate(`/create?prompt=${encodeURIComponent(prompt)}`)} />

        {/* ── Quick actions ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-20">
          <QuickAction
            icon={<Sparkles size={15} />}
            label="01"
            title="Create with AI"
            description="Describe your topic or upload a document."
            onClick={() => navigate('/create')}
            accent="indigo"
          />
          <QuickAction
            icon={<LayoutGrid size={15} />}
            label="02"
            title="Start from a Template"
            description="Choose a professionally designed layout."
            onClick={() => navigate('/templates')}
          />
          <QuickAction
            icon={<ArrowDownToLine size={15} />}
            label="03"
            title="Import PowerPoint"
            description="Continue editing an existing presentation."
            onClick={() => setShowImport(true)}
          />
        </div>

        {/* ── Recent Presentations ── */}
        <section className="mb-16">
          <SectionHeader
            eyebrow="— Your work"
            title="Recent Presentations"
            icon={<Clock size={18} strokeWidth={1.75} />}
            action={{ label: 'All Presentations', onClick: () => navigate('/decks') }}
          />

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <div className="aspect-[16/9] rounded-xl shimmer mb-3" />
                  <div className="h-3.5 w-3/5 mb-2 rounded-md shimmer" />
                  <div className="h-2.5 w-2/5 rounded-md shimmer" />
                </div>
              ))}
            </div>
          )}

          {!loading && presentations.length === 0 && (
            <div
              className="rounded-2xl px-10 py-14 text-center"
              style={{
                background: 'rgba(0,0,0,0.02)',
                border: '1px dashed rgba(0,0,0,0.12)',
              }}
            >
              <p
                className="font-serif text-[26px] md:text-[30px] leading-tight tracking-tighter mb-2.5"
                style={{ color: 'var(--ink-strong)' }}
              >
                A blank page,
                <br />
                <span className="font-serif-italic" style={{ color: 'var(--ink-soft)' }}>waiting.</span>
              </p>
              <p
                className="text-[13.5px] mb-7 max-w-xs mx-auto leading-relaxed"
                style={{ color: 'var(--ink-soft)' }}
              >
                Create your first presentation — generate from a prompt, or start from a template.
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button variant="secondary" onClick={() => navigate('/templates')}>
                  Browse templates
                </Button>
                <Button
                  variant="primary"
                  onClick={() => navigate('/create')}
                  leadingIcon={<Sparkles size={12} />}
                >
                  Generate with AI
                </Button>
              </div>
            </div>
          )}

          {!loading && presentations.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
              {presentations.slice(0, 4).map((p) => (
                <DeckCard
                  key={p.id}
                  p={p}
                  menuOpen={openMenu === p.id}
                  onToggleMenu={() => setOpenMenu(openMenu === p.id ? null : p.id)}
                  onCloseMenu={() => setOpenMenu(null)}
                  onOpen={() => navigate(`/presentations/${p.id}`)}
                  onDelete={() => handleDelete(p.id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Featured templates ── */}
        {heroTemplates.length > 0 && (
          <section>
            <SectionHeader
              eyebrow="— Featured"
              title="A starting point"
              icon={<Star size={18} strokeWidth={1.75} />}
              action={{ label: 'All templates', onClick: () => navigate('/templates') }}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-10">
              {heroTemplates.map((t) => (
                <FeaturedTemplateCard
                  key={t.id}
                  t={t}
                  onClick={() => navigate(`/templates/${t.id}/create`)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  )
}

// ── Quick generate input ────────────────────────────────────────────────────
function QuickGenerateInput({ onSubmit }: { onSubmit: (prompt: string) => void }) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const ready = value.trim().length > 1

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ready) return
    onSubmit(value.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="mb-12 max-w-[820px] relative">
      {/* Ambient glow behind the bar so it visually pops off the page */}
      <div
        aria-hidden
        className="absolute inset-0 -m-6 rounded-[32px] pointer-events-none transition-opacity duration-500"
        style={{
          background:
            'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(99,102,241,0.10) 0%, rgba(139,92,246,0.06) 35%, transparent 70%)',
          opacity: focused ? 1 : 0.55,
        }}
      />

      <div className="relative">
        <p
          className="eyebrow mb-3 flex items-center gap-2"
          style={{ color: 'var(--ink-faint)' }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{
              background: '#8b5cf6',
              boxShadow: '0 0 8px rgba(139,92,246,0.6)',
            }}
          />
          AI Command Center
        </p>

        <div
          className="flex items-center gap-3 pl-5 pr-2 h-[64px] rounded-[20px] transition-all duration-200"
          style={{
            background: '#fff',
            border: `1.5px solid ${focused ? 'rgba(99,102,241,0.55)' : 'var(--line-strong, rgba(0,0,0,0.12))'}`,
            boxShadow: focused
              ? '0 0 0 4px rgba(99,102,241,0.12), 0 12px 32px -8px rgba(99,102,241,0.25), 0 4px 12px rgba(15,14,12,0.06)'
              : '0 2px 4px rgba(15,14,12,0.04), 0 12px 28px -10px rgba(15,14,12,0.10)',
          }}
        >
          <Sparkles
            size={18}
            style={{
              color: focused ? '#6366f1' : 'var(--ink-muted)',
              flexShrink: 0,
              transition: 'color 200ms ease',
            }}
          />
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && ready) {
                e.preventDefault()
                onSubmit(value.trim())
              }
            }}
            placeholder="What do you want to present about? Try “Q3 board update” or “AI in healthcare”…"
            className="flex-1 outline-none text-[15px] bg-transparent"
            style={{ color: 'var(--ink-strong)' }}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!ready}
            className="flex items-center gap-2 h-[48px] px-5 rounded-[14px] text-[13.5px] font-semibold transition-all flex-shrink-0"
            style={{
              background: ready
                ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                : 'rgba(0,0,0,0.04)',
              color: ready ? '#fff' : 'var(--ink-muted)',
              cursor: ready ? 'pointer' : 'not-allowed',
              whiteSpace: 'nowrap',
              boxShadow: ready
                ? '0 4px 12px rgba(99,102,241,0.35), 0 1px 2px rgba(99,102,241,0.4) inset, 0 -1px 2px rgba(0,0,0,0.1) inset'
                : 'none',
            }}
            onMouseEnter={(e) => {
              if (ready) {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow =
                  '0 6px 18px rgba(99,102,241,0.45), 0 1px 2px rgba(99,102,241,0.4) inset, 0 -1px 2px rgba(0,0,0,0.1) inset'
              }
            }}
            onMouseLeave={(e) => {
              if (ready) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow =
                  '0 4px 12px rgba(99,102,241,0.35), 0 1px 2px rgba(99,102,241,0.4) inset, 0 -1px 2px rgba(0,0,0,0.1) inset'
              }
            }}
          >
            <Sparkles size={14} />
            Generate
            <span
              className="font-mono"
              style={{
                opacity: ready ? 0.6 : 0.4,
                fontSize: 10.5,
                fontWeight: 600,
                marginLeft: 2,
                letterSpacing: 0.5,
              }}
            >
              ⌘↵
            </span>
          </button>
        </div>

        <p
          className="text-[11.5px] mt-2.5 ml-1"
          style={{ color: 'var(--ink-faint)' }}
        >
          Press <span className="font-mono" style={{ color: 'var(--ink-muted)' }}>⌘↵</span> to generate · or attach a document on the next step
        </p>
      </div>
    </form>
  )
}

// ── Section header ──────────────────────────────────────────────────────────
function SectionHeader({
  eyebrow,
  title,
  icon,
  action,
}: {
  eyebrow: string
  title: string
  /** Small outline icon shown before the title — improves scanability. */
  icon?: React.ReactNode
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="flex items-end justify-between mb-7">
      <div>
        <p className="eyebrow mb-2.5" style={{ color: 'var(--ink-faint)' }}>
          {eyebrow}
        </p>
        <h2
          className="font-serif leading-tight tracking-tighter flex items-center gap-2.5"
          style={{ fontSize: 'clamp(22px, 2.5vw, 28px)', color: 'var(--ink-strong)' }}
        >
          {icon && (
            <span
              aria-hidden
              className="flex items-center justify-center flex-shrink-0"
              style={{ color: 'var(--ink-muted)' }}
            >
              {icon}
            </span>
          )}
          {title}
        </h2>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="text-[12.5px] font-medium flex items-center gap-1 group transition-opacity hover:opacity-50"
          style={{ color: 'var(--ink-strong)' }}
        >
          {action.label}
          <ArrowUpRight
            size={12}
            className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
          />
        </button>
      )}
    </div>
  )
}

// ── Quick action card ───────────────────────────────────────────────────────
// All three cards share the same canvas, border, and shadow — equal visual
// weight at rest. Only the icon tile carries an `accent` color cue so the
// "AI" path is recognizable without dominating the row.
function QuickAction({
  icon,
  label,
  title,
  description,
  onClick,
  accent,
}: {
  icon: React.ReactNode
  label: string
  title: string
  description: string
  onClick: () => void
  /** Optional accent for the icon tile only. Cards otherwise look identical. */
  accent?: 'indigo'
}) {
  // Icon tile palette per accent. Default is neutral gray.
  const iconBg =
    accent === 'indigo' ? 'rgba(99,102,241,0.10)' : 'rgba(0,0,0,0.05)'
  const iconColor =
    accent === 'indigo' ? '#6366f1' : 'var(--ink-strong)'

  return (
    <button
      onClick={onClick}
      className="group relative text-left p-6 rounded-2xl transition-all duration-200 ease-out"
      style={{
        background: '#fff',
        border: '1px solid var(--line)',
        boxShadow: '0 1px 2px rgba(15,14,12,0.05)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow =
          '0 1px 2px rgba(15,14,12,0.06), 0 14px 32px -8px rgba(15,14,12,0.13)'
        e.currentTarget.style.borderColor = 'rgba(0,0,0,0.16)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(15,14,12,0.05)'
        e.currentTarget.style.borderColor = 'var(--line)'
      }}
    >
      {/* Icon tile + label number */}
      <div className="flex items-start justify-between mb-7">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-200"
          style={{
            background: iconBg,
            color: iconColor,
          }}
        >
          {icon}
        </div>
        <span className="eyebrow" style={{ color: 'var(--ink-faint)' }}>
          {label}
        </span>
      </div>

      {/* Title with inline supporting icon for scannability */}
      <div className="flex items-center gap-2 mb-2">
        <span
          aria-hidden
          className="flex items-center justify-center w-4 h-4 flex-shrink-0"
          style={{ color: iconColor, opacity: accent ? 1 : 0.75 }}
        >
          {icon}
        </span>
        <p
          className="font-serif text-[19px] leading-snug tracking-tighter"
          style={{ color: 'var(--ink-strong)' }}
        >
          {title}
        </p>
      </div>
      <p className="text-[13px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
        {description}
      </p>

      {/* Arrow on hover */}
      <ArrowUpRight
        size={14}
        className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150"
        style={{ color: 'var(--ink-muted)' }}
      />
    </button>
  )
}

// ── Deck card ───────────────────────────────────────────────────────────────
function DeckCard({
  p,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onOpen,
  onDelete,
}: {
  p: PresentationListItem
  menuOpen: boolean
  onToggleMenu: () => void
  onCloseMenu: () => void
  onOpen: () => void
  onDelete: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.21)
  useLayoutEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const update = () => setScale(el.clientWidth / SLIDE_W)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="group">
      {/* Thumbnail */}
      <div
        ref={ref}
        onClick={onOpen}
        className="relative aspect-[16/9] rounded-xl overflow-hidden cursor-pointer transition-all duration-250 ease-out"
        style={{
          background: 'var(--paper-2)',
          border: '1px solid var(--line)',
          boxShadow: '0 1px 3px rgba(15,14,12,0.07), 0 4px 12px -4px rgba(15,14,12,0.09)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow =
            '0 1px 3px rgba(15,14,12,0.07), 0 16px 36px -10px rgba(15,14,12,0.18)'
          e.currentTarget.style.transform = 'translateY(-3px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow =
            '0 1px 3px rgba(15,14,12,0.07), 0 4px 12px -4px rgba(15,14,12,0.09)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        {p.preview_slide ? (
          <div className="absolute inset-0">
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: SLIDE_W,
                height: SLIDE_H,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
            >
              <SlidePreview slide={p.preview_slide} scale={1} />
            </div>
          </div>
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'var(--paper)', color: 'var(--ink-faint)' }}
          >
            <span className="font-serif text-[13px]">No preview</span>
          </div>
        )}

        {/* Hover overlay */}
        <div
          className="absolute inset-0 flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.28) 0%, transparent 60%)',
          }}
        >
          <span
            className="text-[11px] font-semibold tracking-wide uppercase"
            style={{ color: 'rgba(255,255,255,0.9)' }}
          >
            Open →
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p
            className="font-serif text-[15.5px] leading-tight tracking-tighter truncate mb-1"
            style={{ color: 'var(--ink-strong)' }}
          >
            {p.title}
          </p>
          <div className="flex items-center gap-1.5">
            <span className="eyebrow" style={{ color: 'var(--ink-faint)' }}>
              {timeAgo(p.updated_at)}
            </span>
            {p.total_slides > 0 && (
              <>
                <span
                  className="w-[3px] h-[3px] rounded-full flex-shrink-0"
                  style={{ background: 'var(--ink-faint)' }}
                />
                <span className="eyebrow" style={{ color: 'var(--ink-faint)' }}>
                  {p.total_slides} slides
                </span>
              </>
            )}
          </div>
        </div>

        {/* Context menu */}
        <div className="relative flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleMenu()
            }}
            className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
            style={{ color: 'var(--ink-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.07)'
              e.currentTarget.style.color = 'var(--ink-strong)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--ink-muted)'
            }}
          >
            <MoreHorizontal size={14} />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-8 z-10 rounded-xl py-1 w-36 shadow-lift"
              style={{ background: '#fff', border: '1px solid var(--line)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  onOpen()
                  onCloseMenu()
                }}
                className="w-full text-left px-3.5 py-2 text-[12.5px] transition-colors"
                style={{ color: 'var(--ink)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                Open
              </button>
              <button
                onClick={onDelete}
                className="w-full text-left px-3.5 py-2 text-[12.5px] transition-colors"
                style={{ color: 'var(--accent)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-soft)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Featured template card ──────────────────────────────────────────────────
function FeaturedTemplateCard({ t, onClick }: { t: TemplateListItem; onClick: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.2)
  useLayoutEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const update = () => setScale(el.clientWidth / SLIDE_W)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <button onClick={onClick} className="group text-left w-full">
      {/* Thumbnail */}
      <div
        ref={ref}
        className="aspect-[16/9] relative overflow-hidden rounded-xl transition-all duration-250 ease-out"
        style={{
          background: 'var(--paper-2)',
          border: '1px solid var(--line)',
          boxShadow: '0 1px 3px rgba(15,14,12,0.07), 0 4px 12px -4px rgba(15,14,12,0.09)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow =
            '0 1px 3px rgba(15,14,12,0.07), 0 16px 36px -10px rgba(15,14,12,0.18)'
          e.currentTarget.style.transform = 'translateY(-3px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow =
            '0 1px 3px rgba(15,14,12,0.07), 0 4px 12px -4px rgba(15,14,12,0.09)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        {t.preview_slide ? (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: SLIDE_W,
              height: SLIDE_H,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            <SlidePreview slide={t.preview_slide} theme={t.theme ?? undefined} scale={1} />
          </div>
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'var(--paper)', color: 'var(--ink-faint)' }}
          >
            <span className="font-serif text-[13px]">No preview</span>
          </div>
        )}

        {/* "Use template" hover badge */}
        <div
          className="absolute inset-0 flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.28) 0%, transparent 60%)',
          }}
        >
          <span
            className="text-[11px] font-semibold tracking-wide uppercase"
            style={{ color: 'rgba(255,255,255,0.9)' }}
          >
            Use template →
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="font-serif text-[16px] leading-tight tracking-tighter truncate mb-1"
            style={{ color: 'var(--ink-strong)' }}
          >
            {t.name}
          </p>
          {t.category && (
            <span className="eyebrow" style={{ color: 'var(--ink-faint)' }}>
              {t.category}
            </span>
          )}
        </div>
        <ArrowUpRight
          size={13}
          className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          style={{ color: 'var(--ink-muted)' }}
        />
      </div>
    </button>
  )
}
