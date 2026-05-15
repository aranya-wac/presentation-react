import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { templatesApi, presentationsApi, BASE_URL } from '../api/client'
import { AppLayout } from '../components/Layout/AppLayout'
import { SlidePreview } from '../components/Presentation/SlidePreview'
import { Button } from '../components/ui/Button'
import { Chip } from '../components/ui/Chip'
import type { PreviewResponse, Slide, TemplateListItem, Theme } from '../types'
import { Loader2, Sparkles, X, Copy, Search, FileText, ArrowUpRight, Plus, Trash2 } from 'lucide-react'

const SLIDE_W = 1280
const SLIDE_H = 720

function resolveThumbnail(url: string): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

// ── Card thumbnail ──────────────────────────────────────────────────────────
function TemplateThumbnail({
  name,
  thumbnailUrl,
  previewSlide,
  theme,
}: {
  name: string
  thumbnailUrl: string
  previewSlide?: Slide | null
  theme?: Theme | null
}) {
  const [imgError, setImgError] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const resolved = resolveThumbnail(thumbnailUrl)
  const hasImage = !!resolved && !imgError
  const hasSlide = !!previewSlide

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

  if (hasSlide) {
    return (
      <div ref={ref} className="aspect-[16/9] relative overflow-hidden" style={{ background: 'var(--paper-2)' }}>
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
          <SlidePreview slide={previewSlide!} theme={theme ?? undefined} scale={1} />
        </div>
      </div>
    )
  }

  return (
    <div className="aspect-[16/9] relative overflow-hidden" style={{ background: 'var(--paper)' }}>
      {hasImage && (
        <img
          src={resolved}
          alt={name}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
      {(!hasImage || !imgLoaded) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <FileText size={20} style={{ color: 'var(--ink-faint)' }} />
        </div>
      )}
    </div>
  )
}

// ── Preview modal ───────────────────────────────────────────────────────────
function TemplatePreviewModal({
  template,
  onClose,
}: {
  template: TemplateListItem
  onClose: () => void
}) {
  const navigate = useNavigate()

  const [slides, setSlides] = useState<Slide[]>([])
  const [theme, setTheme] = useState<Theme | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<'edit' | null>(null)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  useEffect(() => {
    setLoading(true)
    setError('')
    templatesApi.getPreview(template.id)
      .then((r) => {
        const data = r.data as PreviewResponse
        setSlides(data.slides ?? [])
        setTheme(data.theme ?? null)
      })
      .catch((err) => setError(err.response?.data?.detail ?? 'Failed to load preview'))
      .finally(() => setLoading(false))
  }, [template.id])

  const handleEditCopy = async () => {
    if (busy || !theme || slides.length === 0) return
    setBusy('edit')
    setActionError('')
    try {
      const { data } = await presentationsApi.create({
        title: `${template.name} (Copy)`,
        description: template.description ?? '',
        slides: slides as unknown as object[],
        theme_id: theme.id,
        template_id: template.id,
      })
      navigate(`/presentations/${(data as { id: string }).id}`)
    } catch (err: any) {
      setActionError(err.response?.data?.detail ?? 'Could not create copy')
      setBusy(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      style={{ background: 'rgba(10,9,7,0.55)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl h-full max-h-[92vh] rounded-3xl flex flex-col overflow-hidden"
        style={{
          background: 'var(--paper)',
          boxShadow: '0 2px 4px rgba(15,14,12,0.08), 0 28px 56px -12px rgba(15,14,12,0.22)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex-shrink-0 px-8 py-6 flex items-start justify-between gap-4"
          style={{ background: 'var(--paper-2)', borderBottom: '1px solid var(--line)' }}
        >
          <div className="min-w-0">
            <p className="eyebrow mb-2">{template.category}</p>
            <h2
              className="font-serif text-[28px] leading-tight tracking-tighter"
              style={{ color: 'var(--ink-strong)' }}
            >
              {template.name}
            </h2>
            {template.description && (
              <p
                className="text-[13px] mt-1.5 max-w-xl line-clamp-2"
                style={{ color: 'var(--ink-soft)' }}
              >
                {template.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
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
            <X size={16} />
          </button>
        </div>

        {/* Slide gallery */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 size={22} style={{ color: 'var(--ink-muted)' }} className="animate-spin" />
              <p className="text-[13px]" style={{ color: 'var(--ink-soft)' }}>Loading preview…</p>
            </div>
          )}

          {error && !loading && (
            <div
              className="rounded-xl px-4 py-3"
              style={{ background: 'var(--accent-soft)', border: "1px solid var(--line)" }}
            >
              <p className="text-sm" style={{ color: 'var(--accent)' }}>{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="max-w-3xl mx-auto flex flex-col gap-6">
              {slides.map((slide, idx) => (
                <SlidePreviewCard
                  key={slide.order ?? idx}
                  slide={slide}
                  theme={theme}
                  index={idx}
                  total={slides.length}
                />
              ))}
            </div>
          )}
        </div>

        {/* Action footer */}
        <div
          className="flex-shrink-0 px-8 py-5 flex items-center justify-between gap-4"
          style={{ background: 'var(--paper-2)', borderTop: '1px solid var(--line)' }}
        >
          {actionError ? (
            <p className="text-[12.5px] flex-1" style={{ color: 'var(--accent)' }}>{actionError}</p>
          ) : (
            <p className="eyebrow flex-1">{slides.length} slides</p>
          )}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={handleEditCopy}
              disabled={busy !== null || loading || !theme}
              leadingIcon={<Copy size={13} />}
            >
              {busy === 'edit' ? 'Creating…' : 'Edit copy'}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const path = (template as any).slide_source === 'simple'
                  ? `/templates/${template.id}/use`
                  : `/templates/${template.id}/create`
                navigate(path)
              }}
              disabled={busy !== null || loading}
              leadingIcon={<Sparkles size={13} />}
              trailingIcon={<ArrowUpRight size={13} />}
            >
              Create from template
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Slide preview card (modal) ──────────────────────────────────────────────
function SlidePreviewCard({
  slide,
  theme,
  index,
  total,
}: {
  slide: Slide
  theme: Theme | null
  index: number
  total: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.6)

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
    <div className="flex flex-col gap-2.5">
      <p className="eyebrow pl-0.5">
        {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </p>
      <div
        ref={ref}
        style={{
          width: '100%',
          aspectRatio: '16/9',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 1px 1px rgba(15,14,12,0.06), 0 12px 28px -8px rgba(15,14,12,0.16)',
          background: 'var(--paper-2)',
          border: '1px solid var(--line)',
          position: 'relative',
        }}
      >
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
          <SlidePreview slide={slide} theme={theme ?? undefined} scale={1} />
        </div>
      </div>
    </div>
  )
}

type SourceFilter = 'all' | 'mine' | 'builtin'

// ── Templates page ──────────────────────────────────────────────────────────
export function TemplatesPage() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<TemplateListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [previewing, setPreviewing] = useState<TemplateListItem | null>(null)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')

  useEffect(() => {
    setLoading(true)
    templatesApi
      .list({ source: sourceFilter })
      .then((r) => setTemplates(r.data))
      .finally(() => setLoading(false))
  }, [sourceFilter])

  const openTemplate = (t: TemplateListItem) => {
    // Wizard-built templates use the simpler prompt-only flow.
    if ((t as any).slide_source === 'simple') {
      navigate(`/templates/${t.id}/use`)
    } else {
      navigate(`/templates/${t.id}/create`)
    }
  }

  const handleDelete = async (t: TemplateListItem) => {
    if (!confirm(`Delete "${t.name}"? This can't be undone.`)) return
    // Optimistic remove — drop locally first, restore on failure so the user
    // never stares at a 1.5s spinner for a routine action.
    setTemplates((prev) => prev.filter((x) => x.id !== t.id))
    try {
      await templatesApi.delete(t.id)
    } catch (err: any) {
      // Reinsert at original position so the order is preserved.
      setTemplates((prev) => {
        const next = [...prev]
        // Best-effort: append if we can't reconstruct the original index.
        next.push(t)
        return next
      })
      alert(err?.response?.data?.detail ?? 'Could not delete the template.')
    }
  }

  const categories = useMemo(() => {
    const set = new Set<string>()
    templates.forEach((t) => t.category && set.add(t.category))
    return ['all', ...Array.from(set)]
  }, [templates])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return templates.filter((t) => {
      if (activeCategory !== 'all' && t.category !== activeCategory) return false
      if (!q) return true
      return (
        t.name.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q) ||
        (t.tags ?? []).some((tag) => tag.toLowerCase().includes(q))
      )
    })
  }, [templates, search, activeCategory])

  return (
    <AppLayout>
      <div className="px-12 pt-12 pb-20 max-w-[1280px] mx-auto">
        {/* Editorial hero */}
        <div className="mb-14 max-w-4xl">
          <p className="eyebrow mb-4">— The library</p>
          <h1
            className="font-serif leading-[1.0] tracking-tightest text-[40px] md:text-[56px]"
            style={{ color: 'var(--ink-strong)' }}
          >
            Premium decks,
            <br />
            <span className="font-serif-italic" style={{ color: 'var(--accent)' }}>half-written.</span>
          </h1>
          <p
            className="text-[15.5px] mt-7 max-w-xl leading-relaxed"
            style={{ color: 'var(--ink-soft)' }}
          >
            Templates designed by humans, finished by AI. Pick one, paste your idea, and watch it become a deck — layout, typography, and rhythm intact.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-6 mb-6 flex-wrap">
          <div className="relative max-w-sm flex-1 min-w-[280px]">
            <Search
              size={14}
              className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--ink-faint)' }}
            />
            <input
              type="text"
              placeholder="Search templates…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-full text-[13px] focus:outline-none transition-colors"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                color: 'var(--ink-strong)',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--ink-strong)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--line)')}
            />
          </div>
          <div className="flex items-center gap-3">
            <p className="eyebrow">{filtered.length} of {templates.length}</p>
            <Button
              variant="primary"
              onClick={() => navigate('/templates/new')}
              leadingIcon={<Plus size={13} />}
            >
              Create template
            </Button>
          </div>
        </div>

        {/* Source filter pills */}
        <div className="flex items-center gap-1 mb-4 flex-wrap">
          {([
            { value: 'all', label: 'All' },
            { value: 'mine', label: 'Mine' },
            { value: 'builtin', label: 'Built-in' },
          ] as const).map((opt) => (
            <Chip
              key={opt.value}
              active={sourceFilter === opt.value}
              onClick={() => setSourceFilter(opt.value)}
            >
              {opt.label}
            </Chip>
          ))}
        </div>

        {/* Category chips */}
        <div className="flex items-center gap-1 mb-12 flex-wrap">
          {categories.map((cat) => (
            <Chip
              key={cat}
              active={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === 'all' ? 'All' : cat}
            </Chip>
          ))}
        </div>

        {/* Grid */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <div className="aspect-[16/9] rounded-2xl shimmer mb-4" />
                <div className="h-4 w-2/3 mb-2 rounded shimmer" />
                <div className="h-3 w-1/2 rounded shimmer" />
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-24">
            <p
              className="font-serif text-[28px] leading-tight tracking-tighter"
              style={{ color: 'var(--ink-strong)' }}
            >
              No matches found
            </p>
            <p className="text-[14px] mt-2" style={{ color: 'var(--ink-soft)' }}>
              Try a different search or category.
            </p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-14">
            {filtered.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                onView={() => setPreviewing(t)}
                onCreate={() => openTemplate(t)}
                // Only user-owned templates are deletable. Built-ins (is_system)
                // are shared across the workspace and never user-removable.
                onDelete={!(t as any).is_system ? () => handleDelete(t) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {previewing && (
        <TemplatePreviewModal
          template={previewing}
          onClose={() => setPreviewing(null)}
        />
      )}
    </AppLayout>
  )
}

// ── Template card ───────────────────────────────────────────────────────────
function TemplateCard({
  template,
  onView,
  onCreate,
  onDelete,
}: {
  template: TemplateListItem
  onView: () => void
  onCreate: () => void
  /** Optional — only user-owned templates get the delete control. */
  onDelete?: () => void
}) {
  return (
    <div className="group">
      {/* Thumbnail */}
      <div
        onClick={onView}
        className="relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ease-out"
        style={{
          boxShadow: '0 1px 1px rgba(15,14,12,0.05), 0 4px 12px -4px rgba(15,14,12,0.08)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow =
            '0 1px 1px rgba(15,14,12,0.06), 0 16px 36px -10px rgba(15,14,12,0.20)'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow =
            '0 1px 1px rgba(15,14,12,0.05), 0 4px 12px -4px rgba(15,14,12,0.08)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        <TemplateThumbnail
          name={template.name}
          thumbnailUrl={template.thumbnail_url}
          previewSlide={template.preview_slide ?? null}
          theme={template.theme ?? null}
        />

        {/* Delete (hover-revealed, top-right). Built-in templates never
            get this control — see TemplatesPage's guard on is_system. */}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            title="Delete template"
            aria-label="Delete template"
            className="absolute top-3 right-3 w-8 h-8 rounded-full items-center justify-center transition-all flex opacity-0 group-hover:opacity-100"
            style={{
              background: 'rgba(255,255,255,0.92)',
              color: 'var(--ink-strong)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(220,38,38,0.95)'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#fff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.92)'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--ink-strong)'
            }}
          >
            <Trash2 size={13} />
          </button>
        )}

        {/* Hover actions */}
        <div className="absolute inset-x-0 bottom-0 p-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-out">
          <button
            onClick={(e) => { e.stopPropagation(); onView() }}
            className="h-9 px-4 rounded-full text-[12.5px] font-semibold transition-colors"
            style={{
              background: 'rgba(255,255,255,0.95)',
              color: 'var(--ink-strong)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            Preview
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onCreate() }}
            className="ml-auto h-9 px-4 rounded-full text-[12.5px] font-semibold flex items-center gap-1.5 transition-colors"
            style={{
              background: 'var(--ink-strong)',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            }}
          >
            <Sparkles size={12} />
            Use template
          </button>
        </div>
      </div>

      {/* Caption — editorial under-the-thumbnail */}
      <div className="pt-5 px-1">
        <div className="flex items-baseline justify-between gap-3 mb-1">
          <p
            className="font-serif text-[20px] leading-tight tracking-tighter"
            style={{ color: 'var(--ink-strong)' }}
          >
            {template.name}
          </p>
          <p className="eyebrow flex-shrink-0">{template.total_slides}p</p>
        </div>
        <p
          className="text-[12.5px] leading-relaxed line-clamp-2 mb-3"
          style={{ color: 'var(--ink-soft)' }}
        >
          {template.description}
        </p>
        <div className="flex items-center gap-3">
          <span className="eyebrow">{template.category}</span>
          {template.tags?.[0] && (
            <>
              <span className="w-0.5 h-0.5 rounded-full" style={{ background: 'var(--ink-faint)' }} />
              <span className="font-serif-italic text-[12px]" style={{ color: 'var(--ink-muted)' }}>
                {template.tags[0]}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
