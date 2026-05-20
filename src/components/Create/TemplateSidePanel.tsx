import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, Loader2 } from 'lucide-react'
import { templatesApi, BASE_URL } from '../../api/client'
import { SlidePreview } from '../Presentation/SlidePreview'
import type { PreviewResponse, Slide, TemplateListItem, Theme } from '../../types'

const SLIDE_W = 1280
const SLIDE_H = 720

/**
 * Renders a single actual template slide scaled to fit its container,
 * without the "01 / N" label — used for the hero preview tile.
 */
function TemplateSlideThumbInline({ slide, theme }: {
  slide: Slide
  theme: Theme | null
}) {
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
    <div ref={ref} style={{ position: 'absolute', inset: 0 }}>
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
  )
}

/**
 * Renders a single actual template slide scaled to fit its container.
 * Mirrors the SlideThumb used on CreateFromTemplatePage so the side panel
 * preview and the full-screen create-from-template preview look identical.
 */
function TemplateSlideThumb({ slide, theme, index, total }: {
  slide: Slide
  theme: Theme | null
  index: number
  total: number
}) {
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
    <div className="flex flex-col gap-1.5">
      <p
        className="text-[9.5px] font-semibold uppercase tracking-[0.14em] pl-0.5"
        style={{ color: 'var(--ink-faint)' }}
      >
        {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </p>
      <div
        ref={ref}
        style={{
          width: '100%',
          aspectRatio: '16/9',
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: '0 1px 1px rgba(15,14,12,0.05), 0 8px 18px -8px rgba(15,14,12,0.14)',
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

interface Props {
  selectedId: string | null
  onSelect: (id: string | null) => void
  disabled?: boolean
}

function resolveThumbnail(url: string): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

/**
 * Renders a designed preview using the template's theme palette. Mirrors
 * the mini-slide layout used by the "Start from a polished base" cards on
 * the same screen (side accent strip + category badge + title + subtitle +
 * content shapes that vary by category). Used when the backend has no
 * uploaded thumbnail, so every template still reads as a distinct design.
 */
function TemplateDesignPreview({ template }: { template: TemplateListItem }) {
  const theme = template.theme as
    | { colors?: { background?: string; accent?: string; text?: string; primary?: string; secondary?: string } }
    | undefined
  const bg     = theme?.colors?.background ?? '#FAFAFA'
  const ink    = theme?.colors?.primary    ?? '#0A0907'
  const accent = theme?.colors?.accent     ?? '#B43C28'

  const category = (template.category || 'Template').toUpperCase()

  // Variant key: which content-block arrangement to render under the title.
  // Mirrors the variety logic in the "polished base" cards so the right-side
  // preview feels like the same family of mocks.
  const cat = (template.category || '').toLowerCase()
  const variant: 'kpis' | 'lines' | 'pair' | 'split' =
    /sales|product|launch/.test(cat) ? 'kpis' :
    /executive|success|review|internal|all-?hands/.test(cat) ? 'lines' :
    /education|workshop/.test(cat) ? 'pair' :
    'split'

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        background: bg,
        overflow: 'hidden',
      }}
    >
      {/* Side accent strip — matches the slide-renderer chrome */}
      <span
        style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
          background: accent,
        }}
      />

      {/* Category badge */}
      <span
        style={{
          position: 'absolute', left: 16, top: 14,
          fontSize: 8, fontWeight: 800, letterSpacing: 1.4,
          color: accent,
          padding: '3px 8px',
          border: `1px solid ${accent}55`,
          borderRadius: 100,
          background: `${accent}11`,
        }}
      >
        {category}
      </span>

      {/* Title bar */}
      <div
        style={{
          position: 'absolute', left: 16, top: 38, right: 16,
          height: 10, borderRadius: 2,
          background: ink, opacity: 0.92,
        }}
      />

      {/* Subtitle bar */}
      <div
        style={{
          position: 'absolute', left: 16, top: 52, width: '52%',
          height: 7, borderRadius: 2,
          background: ink, opacity: 0.55,
        }}
      />

      {/* Content blocks — varied by category */}
      {variant === 'kpis' && (
        <>
          <div style={{ position: 'absolute', left: 16,  top: 72, width: 42, height: 28, borderRadius: 5, background: `${accent}33`, border: `1px solid ${accent}66` }} />
          <div style={{ position: 'absolute', left: 62,  top: 72, width: 42, height: 28, borderRadius: 5, background: `${ink}22` }} />
          <div style={{ position: 'absolute', left: 108, top: 72, width: 42, height: 28, borderRadius: 5, background: `${ink}22` }} />
        </>
      )}
      {variant === 'lines' && (
        <>
          <div style={{ position: 'absolute', left: 16, top: 76,  right: 16, height: 5, borderRadius: 2, background: `${ink}33` }} />
          <div style={{ position: 'absolute', left: 16, top: 86,  right: 60, height: 5, borderRadius: 2, background: `${ink}33` }} />
          <div style={{ position: 'absolute', left: 16, top: 96,  right: 90, height: 5, borderRadius: 2, background: `${ink}33` }} />
        </>
      )}
      {variant === 'pair' && (
        <>
          <div style={{ position: 'absolute', left: 16, top: 74, width: 72, height: 28, borderRadius: 5, background: `${accent}33` }} />
          <div style={{ position: 'absolute', left: 92, top: 74, width: 72, height: 28, borderRadius: 5, background: `${ink}22` }} />
        </>
      )}
      {variant === 'split' && (
        <>
          <div style={{ position: 'absolute', left: 16, top: 74, width: 84, height: 28, borderRadius: 5, background: `${ink}22` }} />
          <div style={{ position: 'absolute', left: 104, top: 74, width: 40, height: 28, borderRadius: 5, background: `${accent}33`, border: `1px solid ${accent}55` }} />
        </>
      )}
    </div>
  )
}

/**
 * Right-side template panel for the New Presentation screen.
 *
 * Shows every template as a vertical stack of chips. Selecting a chip
 * reveals a preview block with the template's thumbnail, name, category,
 * and slide count. Clicking the same chip again (or the Clear button)
 * deselects.
 */
export function TemplateSidePanel({ selectedId, onSelect, disabled }: Props) {
  const [templates, setTemplates] = useState<TemplateListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [imgError, setImgError] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  // Real slide preview cache, keyed by template id. We fetch once per
  // template the user actually selects, so the list loads fast even when
  // the user only inspects a couple of templates.
  const [previewCache, setPreviewCache] = useState<Record<string, { slides: Slide[]; theme: Theme | null }>>({})
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')

  useEffect(() => {
    templatesApi
      .list({ source: 'all' })
      .then((r) => setTemplates(r.data))
      .finally(() => setLoading(false))
  }, [])

  // Reset image load state whenever the selected template changes so the
  // fade-in plays for each new preview.
  useEffect(() => {
    setImgError(false)
    setImgLoaded(false)
  }, [selectedId])

  // Fetch the actual slide previews for the selected template (cached).
  useEffect(() => {
    if (!selectedId) return
    if (previewCache[selectedId]) return  // cache hit
    setPreviewError('')
    setPreviewLoading(true)
    templatesApi
      .getPreview(selectedId)
      .then((r) => {
        const data = r.data as PreviewResponse
        setPreviewCache((prev) => ({
          ...prev,
          [selectedId]: { slides: data.slides ?? [], theme: data.theme ?? null },
        }))
      })
      .catch((e: any) => {
        setPreviewError(e?.response?.data?.detail ?? 'Failed to load preview')
      })
      .finally(() => setPreviewLoading(false))
  }, [selectedId, previewCache])

  const selected = templates.find((t) => t.id === selectedId) ?? null
  const thumb = selected ? resolveThumbnail(selected.thumbnail_url) : ''
  const realPreview = selected ? previewCache[selected.id] : undefined

  return (
    <aside
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        boxShadow:
          '0 1px 2px rgba(15,14,12,0.04), 0 8px 24px -10px rgba(15,14,12,0.10)',
      }}
    >
      <div className="px-4 pt-4 pb-2">
        <span
          className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: 'var(--ink-faint)' }}
        >
          Templates
        </span>
        <p className="text-[11.5px] mt-0.5" style={{ color: 'var(--ink-muted)' }}>
          Pick a design to apply
        </p>
      </div>

      {/* Chip list */}
      <div className="px-3 pb-3 flex flex-col gap-1.5 max-h-[42vh] overflow-y-auto">
        {loading && (
          <span
            className="text-[12px] px-2 py-2"
            style={{ color: 'var(--ink-faint)' }}
          >
            Loading…
          </span>
        )}
        {!loading && templates.length === 0 && (
          <span
            className="text-[12px] px-2 py-2"
            style={{ color: 'var(--ink-faint)' }}
          >
            No templates available.
          </span>
        )}
        {!loading &&
          templates.map((t) => {
            const isSelected = selectedId === t.id
            const accent = t.theme?.colors?.accent ?? '#B43C28'
            const bg = t.theme?.colors?.background ?? '#FAFAFA'
            const ink = t.theme?.colors?.text ?? '#0A0907'
            return (
              <motion.button
                key={t.id}
                type="button"
                onClick={() => onSelect(isSelected ? null : t.id)}
                disabled={disabled}
                aria-pressed={isSelected}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 600, damping: 30, mass: 0.4 }}
                className="flex items-center gap-2 h-9 px-2.5 rounded-lg text-left transition-colors"
                style={{
                  background: isSelected ? 'var(--ink-strong)' : 'transparent',
                  color: isSelected ? 'var(--paper)' : 'var(--ink-strong)',
                  border: `1px solid ${isSelected ? 'var(--ink-strong)' : 'var(--line)'}`,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  outline: 'none',
                }}
              >
                {/* Miniature template-card preview — mirrors the "polished
                    base" card design at chip scale: side accent strip,
                    title bar, subtitle bar, and a content tile. Gives each
                    chip a recognisable design language at a glance. */}
                <span
                  aria-hidden
                  style={{
                    width: 28,
                    height: 18,
                    borderRadius: 3,
                    background: bg,
                    border: `1px solid ${isSelected ? 'rgba(255,255,255,0.25)' : `${ink}22`}`,
                    position: 'relative',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {/* Side accent strip */}
                  <span
                    style={{
                      position: 'absolute',
                      left: 0, top: 0, bottom: 0,
                      width: 2,
                      background: accent,
                    }}
                  />
                  {/* Title bar */}
                  <span
                    style={{
                      position: 'absolute',
                      left: 4, top: 3, right: 3,
                      height: 2,
                      borderRadius: 1,
                      background: ink,
                      opacity: 0.85,
                    }}
                  />
                  {/* Subtitle bar */}
                  <span
                    style={{
                      position: 'absolute',
                      left: 4, top: 7, width: 12,
                      height: 1.5,
                      borderRadius: 1,
                      background: ink,
                      opacity: 0.45,
                    }}
                  />
                  {/* Content tile (accent) */}
                  <span
                    style={{
                      position: 'absolute',
                      left: 4, bottom: 3,
                      width: 8, height: 5,
                      borderRadius: 1.5,
                      background: `${accent}55`,
                      border: `0.5px solid ${accent}99`,
                    }}
                  />
                  {/* Content tile (neutral) */}
                  <span
                    style={{
                      position: 'absolute',
                      left: 14, bottom: 3,
                      width: 8, height: 5,
                      borderRadius: 1.5,
                      background: `${ink}22`,
                    }}
                  />
                </span>
                <span className="text-[12px] font-semibold truncate flex-1">
                  {t.name}
                </span>
              </motion.button>
            )
          })}
      </div>

      {/* Preview block */}
      <AnimatePresence initial={false}>
        {selected && (
          <motion.div
            key={selected.id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{ borderTop: '1px solid var(--line)', overflow: 'hidden' }}
          >
            <div className="p-3">
              {/* Hero preview — first real slide if loaded, else mock + image thumb */}
              <div
                className="aspect-[16/9] relative overflow-hidden rounded-lg"
                style={{ background: 'var(--paper-2)', border: '1px solid var(--line)' }}
              >
                {realPreview && realPreview.slides.length > 0 ? (
                  <TemplateSlideThumbInline
                    slide={realPreview.slides[0]}
                    theme={realPreview.theme}
                  />
                ) : thumb && !imgError ? (
                  <>
                    <img
                      src={thumb}
                      alt={selected.name}
                      onLoad={() => setImgLoaded(true)}
                      onError={() => setImgError(true)}
                      className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                    />
                    {!imgLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FileText size={20} style={{ color: 'var(--ink-faint)' }} />
                      </div>
                    )}
                  </>
                ) : (
                  <TemplateDesignPreview template={selected} />
                )}
                {previewLoading && !realPreview && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.55)' }}>
                    <Loader2 size={18} className="animate-spin" style={{ color: 'var(--ink-muted)' }} />
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p
                    className="text-[10px] font-bold tracking-wider uppercase"
                    style={{ color: 'var(--ink-muted)' }}
                  >
                    {selected.category}
                  </p>
                  <h4
                    className="font-semibold text-[13.5px] leading-snug mt-0.5 truncate"
                    style={{ color: 'var(--ink-strong)' }}
                    title={selected.name}
                  >
                    {selected.name}
                  </h4>
                  <p
                    className="text-[11.5px] mt-0.5"
                    style={{ color: 'var(--ink-soft)' }}
                  >
                    {selected.total_slides} slides
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelect(null)}
                  disabled={disabled}
                  title="Clear selection"
                  aria-label="Clear template selection"
                  className="w-7 h-7 rounded-md flex items-center justify-center transition-colors flex-shrink-0"
                  style={{
                    background: 'var(--paper-2)',
                    border: '1px solid var(--line)',
                    color: 'var(--ink-soft)',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!disabled) {
                      e.currentTarget.style.background = 'rgba(10,9,7,0.06)'
                      e.currentTarget.style.color = 'var(--ink-strong)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--paper-2)'
                    e.currentTarget.style.color = 'var(--ink-soft)'
                  }}
                >
                  <X size={12} />
                </button>
              </div>

              {selected.description && (
                <p
                  className="text-[11.5px] mt-2 leading-relaxed"
                  style={{ color: 'var(--ink-soft)' }}
                >
                  {selected.description}
                </p>
              )}

              {/* Full deck preview — scrollable stack of real slide thumbnails
                  for the selected template. This is the same renderer used on
                  /templates/:id/create so the user gets a faithful preview
                  of every slide in the template right in the side panel. */}
              {(previewLoading && !realPreview) && (
                <div className="flex items-center gap-2 mt-4 px-1 text-[11px]" style={{ color: 'var(--ink-soft)' }}>
                  <Loader2 size={12} className="animate-spin" />
                  Loading slide previews…
                </div>
              )}
              {previewError && !previewLoading && (
                <p className="text-[11px] mt-4 px-1" style={{ color: 'var(--accent)' }}>
                  {previewError}
                </p>
              )}
              {realPreview && realPreview.slides.length > 1 && (
                <div className="mt-4">
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.14em] mb-2 px-0.5"
                    style={{ color: 'var(--ink-faint)' }}
                  >
                    All slides — {realPreview.slides.length}
                  </p>
                  <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-1">
                    {realPreview.slides.slice(1).map((s, i) => (
                      <TemplateSlideThumb
                        key={s.order ?? i}
                        slide={s}
                        theme={realPreview.theme}
                        index={i + 1}
                        total={realPreview.slides.length}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  )
}
