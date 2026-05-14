import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { presentationsApi } from '../api/client'
import { AppLayout } from '../components/Layout/AppLayout'
import { SlidePreview } from '../components/Presentation/SlidePreview'
import { Button } from '../components/ui/Button'
import type { PresentationListItem } from '../types'
import { Upload, MoreHorizontal, Sparkles, Pencil } from 'lucide-react'
import { ImportModal } from '../components/Dashboard/ImportModal'

const SLIDE_W = 1280
const SLIDE_H = 720

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} ${mins === 1 ? 'min' : 'mins'} ago`
  if (hours < 24) return `${hours} ${hours === 1 ? 'hr' : 'hrs'} ago`
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatTokenCount(count?: number) {
  const safe = Math.max(0, Number(count || 0))
  if (safe >= 1_000_000) return `${(safe / 1_000_000).toFixed(safe >= 10_000_000 ? 0 : 1)}M`
  if (safe >= 1_000) return `${(safe / 1_000).toFixed(safe >= 10_000 ? 0 : 1)}K`
  return safe.toLocaleString()
}

export function DecksPage() {
  const navigate = useNavigate()
  const [presentations, setPresentations] = useState<PresentationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)

  useEffect(() => {
    presentationsApi.list()
      .then((res) => {
        const sorted = [...res.data].sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        )
        setPresentations(sorted)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this presentation?')) return
    await presentationsApi.delete(id)
    setPresentations((ps) => ps.filter((p) => p.id !== id))
    setOpenMenu(null)
  }

  return (
    <AppLayout>
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}

      <div className="px-12 pt-12 pb-20 max-w-[1280px] mx-auto">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <p className="eyebrow mb-3">— Home</p>
            <h1
              className="font-serif leading-[1.05] tracking-tighter text-[34px] md:text-[44px]"
              style={{ color: 'var(--ink-strong)' }}
            >
              Presentations
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowImport(true)}
              leadingIcon={<Upload size={13} />}
            >
              Import
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/create')}
              leadingIcon={<Sparkles size={13} />}
            >
              New Presentation
            </Button>
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-10">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div className="aspect-[16/9] rounded-2xl shimmer mb-4" />
                <div className="h-4 w-2/3 mb-2 rounded shimmer" />
                <div className="h-3 w-1/3 rounded shimmer" />
              </div>
            ))}
          </div>
        )}

        {!loading && presentations.length === 0 && (
          <div
            className="rounded-3xl px-12 py-16 text-center"
            style={{ background: 'var(--surface)', border: '1px dashed var(--line-strong)' }}
          >
            <p
              className="font-serif text-[28px] md:text-[34px] leading-tight tracking-tighter mb-3"
              style={{ color: 'var(--ink-strong)' }}
            >
              A blank page,
              <br />
              <span className="font-serif-italic" style={{ color: 'var(--accent)' }}>waiting.</span>
            </p>
            <p
              className="text-[14px] mb-7 max-w-sm mx-auto leading-relaxed"
              style={{ color: 'var(--ink-soft)' }}
            >
              Create your first presentation — generate from a prompt, or start from a template.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button variant="secondary" onClick={() => navigate('/templates')}>
                Browse templates
              </Button>
              <Button variant="primary" onClick={() => navigate('/create')} leadingIcon={<Sparkles size={13} />}>
                Generate with AI
              </Button>
            </div>
          </div>
        )}

        {!loading && presentations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-10">
            {presentations.map((p) => (
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
      </div>
    </AppLayout>
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
      <div
        onClick={onOpen}
        className="relative aspect-[16/9] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ease-out"
        style={{
          background: 'var(--paper-2)', border: '1px solid var(--line)',
          boxShadow: '0 1px 1px rgba(15,14,12,0.06), 0 4px 14px -4px rgba(15,14,12,0.10)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow =
            '0 1px 1px rgba(15,14,12,0.06), 0 16px 36px -10px rgba(15,14,12,0.18)'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow =
            '0 1px 1px rgba(15,14,12,0.06), 0 4px 14px -4px rgba(15,14,12,0.10)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        {p.preview_slide ? (
          <div ref={ref} className="absolute inset-0">
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
            <span className="font-serif text-sm">No preview</span>
          </div>
        )}
      </div>

      <div className="pt-4 px-1 flex items-start justify-between gap-3">
        <button
          onClick={onOpen}
          className="min-w-0 flex-1 text-left cursor-pointer"
        >
          <p
            className="font-serif text-[17px] leading-tight tracking-tighter truncate hover:underline underline-offset-4 decoration-[1px]"
            style={{ color: 'var(--ink-strong)' }}
          >
            {p.title}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="eyebrow">{timeAgo(p.updated_at)}</span>
            {p.total_slides > 0 && (
              <>
                <span className="w-0.5 h-0.5 rounded-full" style={{ background: 'var(--ink-faint)' }} />
                <span className="eyebrow">{p.total_slides}p</span>
              </>
            )}
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none"
              style={{
                background: 'rgba(245, 158, 11, 0.14)',
                color: '#92400e',
                border: '1px solid rgba(245, 158, 11, 0.32)',
              }}
              title={`${(p.token_count || 0).toLocaleString()} tokens used`}
            >
              <span style={{ color: '#b45309', fontWeight: 800 }}>{formatTokenCount(p.token_count)}</span>
              <span className="uppercase tracking-[0.08em]">tokens</span>
            </span>
          </div>
        </button>

        <div className="relative flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleMenu() }}
            className="w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
            style={{ color: 'var(--ink-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(10,9,7,0.06)'
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
              className="absolute right-0 top-9 z-10 rounded-xl py-1.5 w-40 shadow-lift"
              style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => { onOpen(); onCloseMenu() }}
                className="w-full text-left px-3.5 py-2 text-[13px] transition-colors"
                style={{ color: 'var(--ink)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                Open
              </button>
              <button
                onClick={() => { onOpen(); onCloseMenu() }}
                className="w-full text-left px-3.5 py-2 text-[13px] transition-colors flex items-center gap-2"
                style={{ color: 'var(--ink)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Pencil size={12} />
                Edit slides
              </button>
              <button
                onClick={onDelete}
                className="w-full text-left px-3.5 py-2 text-[13px] transition-colors"
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
