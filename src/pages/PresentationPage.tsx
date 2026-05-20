import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { presentationsApi, exportApi, themesApi, shareApi, imagesApi, generationApi } from '../api/client'
import { SlidePreview } from '../components/Presentation/SlidePreview'
import { PropertyPanel } from '../components/Presentation/SlideEditor'
import { ThemePanel } from '../components/Presentation/ThemePanel'
import { SlideChat } from '../components/Presentation/SlideChat'
import { EditorToolbar } from '../components/Presentation/EditorToolbar'
import { ChartModal } from '../components/Presentation/ChartModal'
import { AddSlideMenu, type SlideTemplateKind } from '../components/Presentation/AddSlideMenu'
import { NotesPanel } from '../components/Presentation/NotesPanel'
import { SlideRewritePanel } from '../components/Presentation/SlideRewritePanel'
import { VersionHistoryPanel } from '../components/Presentation/VersionHistoryPanel'
import {
  LayoutsPanel,
  applyLayoutToSlide,
  makeLayoutFromSlide,
} from '../components/Presentation/LayoutsPanel'
import { getThemeById } from '../data/themes'
import type { ThemePreset } from '../data/themes'
import { useSlideHistory } from '../hooks/useSlideHistory'
import { presetToTheme as sharedPresetToTheme, applyPresetToSlides as sharedApplyPresetToSlides } from '../utils/themePreset'
import type {
  Block, ChartDataPoint, ChartType, DeckLayout,
  PresentationDetail, Position, Slide, Styling, Theme,
} from '../types'

type SaveStatus = 'idle' | 'saving' | 'saved'
type CtxMenu = { index: number; x: number; y: number } | null
type ExportReady = { jobId: string; format: string } | null

const SLIDE_W = 1280
const SLIDE_H = 720

// ── Helpers ───────────────────────────────────────────────────────────────────

const presetToTheme = sharedPresetToTheme
const applyPresetToSlides = sharedApplyPresetToSlides

function getCanvasBg(hex: string): string {
  // Use the theme's background as the canvas surround when available.
  // Falls back to a neutral mid-gray only when no valid hex is provided.
  if (!hex || !hex.startsWith('#') || hex.length < 7) return '#1A1814'
  return hex
}

// Block types whose `content` should be wiped to a placeholder when cloning
// a slide as a blank starter — leaves the template chrome (badge, accent
// shapes, footer text) intact while inviting the user to fill in fresh
// title/body copy.
const PLACEHOLDERS: Record<string, string> = {
  title:    'New title',
  heading:  'Section heading',
  subtitle: 'Subtitle',
  body:     'Add your content here.',
  text:     'Add text',
  bullet:   '• First point\n• Second point\n• Third point',
  quote:    'Quotation goes here',
  caption:  'Caption',
  card:     'Card title\nCard body text',
  stat:     '00',
}

/**
 * Clone an existing slide as a blank starter — preserves block types,
 * positions, styling, icons, chart shells, and the slide background, but
 * wipes the text content of text-like blocks. The result reads as a
 * "fresh slide" in the same design language as the source.
 */
function cloneSlideAsBlank(src: Slide, kind: SlideTemplateKind, order: number): Slide {
  return {
    ...src,
    order,
    type: kind,
    blocks: src.blocks.map((b) => ({
      ...b,
      id: crypto.randomUUID(),
      content: b.type in PLACEHOLDERS ? PLACEHOLDERS[b.type] : b.content,
      // Strip chart data so the new chart block renders the empty state
      // — the user picks their own data via the chart modal.
      chart_data: b.type === 'chart' ? [] : b.chart_data,
    })),
  }
}

/**
 * Pick the best donor slide in the deck for a given new-slide kind. We
 * prefer an existing slide of the same `type`; failing that, an
 * "anything-but-title" slide for content/agenda kinds, or a title-ish
 * slide for the title kind. Returns undefined when nothing usable exists
 * — caller falls back to the hardcoded layout.
 */
function findDonorSlide(slides: Slide[], kind: SlideTemplateKind): Slide | undefined {
  if (kind === 'blank') return undefined
  const exact = slides.find((s) => s.type === kind && s.blocks.length > 0)
  if (exact) return exact
  if (kind === 'title') {
    return slides.find((s) =>
      s.blocks.some((b) => b.type === 'title') && s.blocks.length > 0,
    )
  }
  // content / agenda → first non-title slide with blocks
  return slides.find((s) => s.type !== 'title' && s.blocks.length > 0)
}

function makeSlideOfKind(
  kind: SlideTemplateKind,
  order: number,
  theme: ThemePreset,
  inheritFrom?: Slide,
  deck?: Slide[],
): Slide {
  // 1. If the deck already has a same-kind slide, clone its structure as
  //    a blank starter so the new slide carries the template's chrome
  //    (badge, accent rule, footer line, etc.) and just needs fresh text.
  if (deck && kind !== 'blank') {
    const donor = findDonorSlide(deck, kind)
    if (donor) return cloneSlideAsBlank(donor, kind, order)
  }

  // 2. Blank slide → inherit the donor slide's full background AND
  //    editor_background, PLUS any full-bleed decorative image blocks
  //    (the AI often puts a sand-dune / silk pattern as an image block
  //    sized to the slide, used as a de-facto backdrop). Without copying
  //    those, the blank slide loses the deck's visual atmosphere even
  //    though slide.background is correct.
  if (kind === 'blank') {
    const donor = inheritFrom ?? deck?.find((s) => s.background || s.editor_background || s.blocks.length > 0)
    const decorativeBlocks = (donor?.blocks ?? []).filter((b) => {
      if (b.type !== 'image') return false
      const p = b.position
      // "Full-bleed": covers ~90%+ of the 1280×720 canvas and starts near 0,0.
      return p.x <= 40 && p.y <= 40 && p.w >= 1152 && p.h >= 648
    }).map((b) => ({ ...b, id: crypto.randomUUID() }))

    return {
      order,
      type: kind,
      background: donor?.background ?? { type: 'color' as const, value: theme.colors.background },
      editor_background: donor?.editor_background,
      blocks: decorativeBlocks,
    }
  }

  // 3. Fallback hardcoded layouts — used when the deck has no same-kind
  //    donor (e.g. a fresh deck without any content slides yet). Skip
  //    image backgrounds here because the hardcoded text layout assumes
  //    a flat-ish canvas to read against.
  const src = inheritFrom?.background
  const inheritedBg = src && src.type !== 'image'
    ? src
    : { type: 'color' as const, value: theme.colors.background }

  const base: Pick<Slide, 'order' | 'type' | 'background'> = {
    order,
    type: kind,
    background: inheritedBg,
  }
  const titleStyle: Styling = {
    font_family: theme.fonts.heading, font_size: 56, font_weight: 800,
    color: theme.colors.heading, background_color: 'transparent', text_align: 'left',
  }
  const subtitleStyle: Styling = {
    font_family: theme.fonts.body, font_size: 22, font_weight: 400,
    color: theme.colors.body, background_color: 'transparent', text_align: 'left',
  }
  const bodyStyle: Styling = {
    font_family: theme.fonts.body, font_size: 20, font_weight: 400,
    color: theme.colors.body, background_color: 'transparent', text_align: 'left',
  }
  const id = () => crypto.randomUUID()

  if (kind === 'title') {
    return {
      ...base,
      blocks: [
        { id: id(), type: 'title',    content: 'Presentation Title', position: { x: 80, y: 260, w: 1120, h: 140 }, styling: { ...titleStyle, font_size: 72, text_align: 'center' } },
        { id: id(), type: 'subtitle', content: 'Subtitle goes here', position: { x: 80, y: 410, w: 1120, h: 60  }, styling: { ...subtitleStyle, text_align: 'center' } },
      ],
    }
  }
  if (kind === 'agenda') {
    return {
      ...base,
      blocks: [
        { id: id(), type: 'heading', content: 'Agenda', position: { x: 80, y: 80, w: 1120, h: 90 }, styling: { ...titleStyle, font_size: 48 } },
        { id: id(), type: 'bullet',  content: '• First topic\n• Second topic\n• Third topic\n• Fourth topic', position: { x: 80, y: 200, w: 1120, h: 440 }, styling: bodyStyle },
      ],
    }
  }
  if (kind === 'content') {
    return {
      ...base,
      blocks: [
        { id: id(), type: 'heading', content: 'Section heading', position: { x: 80, y: 80, w: 1120, h: 90 }, styling: { ...titleStyle, font_size: 48 } },
        { id: id(), type: 'body',    content: 'Add your content here. Click any element to select it, double-click to edit.', position: { x: 80, y: 200, w: 1120, h: 440 }, styling: bodyStyle },
      ],
    }
  }
  // blank
  return { ...base, blocks: [] }
}

function makeImageBlock(src: string): Block {
  return {
    id: crypto.randomUUID(),
    type: 'image',
    content: src,
    position: { x: 440, y: 220, w: 400, h: 280 },
    styling: {},
  }
}

function makeChartBlock(chartType: ChartType, data: ChartDataPoint[]): Block {
  return {
    id: crypto.randomUUID(),
    type: 'chart',
    content: '',
    position: { x: 380, y: 180, w: 520, h: 360 },
    styling: { background_color: 'rgba(255,255,255,0.04)' },
    chart_type: chartType,
    chart_data: data,
  }
}

function makeTextBlock(theme: ThemePreset): Block {
  return {
    id: crypto.randomUUID(),
    type: 'text',
    content: 'Double-click to edit',
    position: { x: 480, y: 320, w: 320, h: 60 },
    styling: {
      font_family: theme.fonts.body, font_size: 22, font_weight: 500,
      color: theme.colors.body, background_color: 'transparent', text_align: 'left',
    },
  }
}

// ── PresentationPage ──────────────────────────────────────────────────────────

export function PresentationPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [presentation, setPresentation] = useState<PresentationDetail | null>(null)
  const history = useSlideHistory([])
  const slides = history.slides
  const setSlides = history.setSlides
  const [activeSlide, setActiveSlide]   = useState(0)

  const [themeOpen, setThemeOpen]       = useState(false)
  const [saveStatus, setSaveStatus]     = useState<SaveStatus>('idle')
  const [regenerating, setRegenerating] = useState(false)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [editingBlockId, setEditingBlockId]   = useState<string | null>(null)
  const [activeTheme, setActiveTheme]   = useState<ThemePreset>(getThemeById('vortex'))
  const [canvasScale, setCanvasScale]   = useState(0.72)
  const [presentMode, setPresentMode]   = useState(false)
  const [presentSlide, setPresentSlide] = useState(0)

  // Context menu for slide strip
  const [ctxMenu, setCtxMenu] = useState<CtxMenu>(null)

  // AI Chat panel
  const [chatOpen, setChatOpen] = useState(false)

  // P1 panels: presenter notes drawer, version history, deck-scoped layouts
  const [notesOpen, setNotesOpen]       = useState(false)
  const [historyOpen, setHistoryOpen]   = useState(false)
  const [layoutsOpen, setLayoutsOpen]   = useState(false)
  const [layouts, setLayouts]           = useState<DeckLayout[]>([])
  const [aiImageOpen, setAiImageOpen]   = useState(false)
  const [aiImageBlockId, setAiImageBlockId] = useState<string | null>(null)
  const [rewriteOpen, setRewriteOpen]   = useState(false)

  // Chart insert / edit modal
  const [chartModalOpen, setChartModalOpen]   = useState(false)
  const [editingChartId, setEditingChartId]   = useState<string | null>(null)

  // Hidden file input for image upload
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Drag-and-drop for slide reordering
  const [dragIdx, setDragIdx]   = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  // Download modal
  const [downloadOpen, setDownloadOpen]   = useState(false)
  const [exporting, setExporting]         = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportReady, setExportReady]     = useState<ExportReady>(null)
  const [exportError, setExportError]     = useState<string | null>(null)

  // Share link
  const [shareUrl, setShareUrl]   = useState<string | null>(null)
  const [shareCopied, setShareCopied] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const centerRef   = useRef<HTMLDivElement>(null)
  const slidesRef   = useRef<Slide[]>([])

  // Keep slidesRef in sync so handleApplyTheme always has the latest slides
  useEffect(() => { slidesRef.current = slides }, [slides])

  // Mirror activeTheme into a ref so async AI-restyle callbacks can check
  // whether the user has switched themes again before they finished.
  const activeThemeRef = useRef<ThemePreset>(getThemeById('vortex'))
  useEffect(() => { activeThemeRef.current = activeTheme }, [activeTheme])

  // DB theme used as the canvas/preview backdrop (full theme object from API).
  const [dbTheme, setDbTheme] = useState<Theme | null>(null)

  // Load presentation
  // The DB `theme_id` is a UUID FK (not a preset name like 'vortex'). We fetch
  // the real theme by id so the canvas background, fonts, and SlidePreview
  // fallbacks match the template the user picked. We do NOT overwrite slide
  // styling on load — the seeded slides already have correct fonts/colors per
  // block, and overwriting them with a frontend preset is what made every
  // copy look black. Only when the user explicitly picks a new theme via
  // ThemePanel do we recolor slides.
  useEffect(() => {
    if (!id) return
    presentationsApi.get(id).then(async (r) => {
      setPresentation(r.data)
      history.resetTo(r.data.slides)
      setLayouts((r.data as any).layouts ?? [])

      // Restore the per-deck theme cache from localStorage so cross-session
      // theme switching stays a cache hit. We key on a version (`v2`) so when
      // the cache schema changes (e.g. backgrounds-on-theme-switch rules) we
      // discard stale entries from older clients instead of rendering old
      // photo backdrops.
      try {
        const raw = localStorage.getItem(`theme_cache_${id}_v2`)
        if (raw) {
          const parsed: Record<string, Slide[]> = JSON.parse(raw)
          // Drop any cache entry that still carries the old photo backdrop
          // or an image-type background — those entries pre-date the rule
          // that theme switches strip old atmosphere. Dropping forces a
          // fresh restyle next time the user visits that theme.
          for (const key of Object.keys(parsed)) {
            const stale = parsed[key].some((s) =>
              !!s.editor_background?.image || s.background?.type === 'image'
            )
            if (stale) delete parsed[key]
          }
          themeCacheRef.current = parsed
        }
        localStorage.removeItem(`theme_cache_${id}`)
      } catch {
        themeCacheRef.current = {}
      }

      const savedPreset = localStorage.getItem(`theme_preset_${id}`)
      if (savedPreset) {
        const preset = getThemeById(savedPreset)
        setActiveTheme(preset)
        // Prefer the cached rendering for the saved preset if we have one —
        // the slides on disk are already in the saved preset's palette, but
        // the cache may carry additional per-theme decoration (gradient
        // backgrounds dropped on theme switch) that we want to preserve.
        const cached = themeCacheRef.current[preset.id]
        history.resetTo(cached ?? applyPresetToSlides(r.data.slides, preset, preset))
        setDbTheme(presetToTheme(preset))
      } else if (r.data.theme_id) {
        // Fetch the actual DB theme for canvas/fallback rendering.
        try {
          const themeRes = await themesApi.get(r.data.theme_id)
          setDbTheme(themeRes.data as Theme)
        } catch {
          /* fall through — render will use whatever defaults exist */
        }
      }
    })
  }, [id])

  // ── Theme pre-warm ───────────────────────────────────────────────────────
  // Generate background images for a small set of popular themes upfront so
  // that when the user switches between them, the cache hits and no extra
  // /images/generate calls are needed. One image per theme is reused across
  // every slide in that theme — visually less varied than per-slide images
  // but stays cleanly inside the 20/hour image-gen rate limit (this spends
  // 5 calls total).
  //
  // Runs in the background after the presentation loads. Each pre-warm step
  // also runs the algorithmic restyle so the cached entry is ready for an
  // instant `setSlides()` swap on theme switch.
  const prewarmRanRef = useRef(false)
  useEffect(() => {
    if (!presentation || slidesRef.current.length === 0) return
    if (prewarmRanRef.current) return
    prewarmRanRef.current = true

    const PREWARM_IDS = ['vortex', 'pearl', 'gamma-midnight', 'gamma-sunset', 'gamma-aurora']
    let cancelled = false

    const bgPrompt = (theme: ThemePreset, isTitle: boolean) => {
      const subject = isTitle
        ? 'sweeping wave-like ridges and flowing dune textures, dramatic side-lit topography, deep shadows and bright highlights along the crests'
        : 'subtle organic ridges and softly draped textured surface, low-key atmospheric lighting'
      return [
        `Cinematic full-bleed background photograph for a ${theme.name}-themed presentation slide.`,
        `Subject: ${subject}.`,
        `Dominant palette: deep ${theme.colors.background} tones with ${theme.colors.accent} highlights catching the light.`,
        `Mood: premium editorial magazine aesthetic, moody and atmospheric, high contrast, rich texture, professional studio photography.`,
        `Composition: ample negative space for headline overlay, off-center focal point, 16:9 aspect ratio.`,
        `No text, no logos, no people.`,
      ].join(' ')
    }

    ;(async () => {
      // Give the editor a moment to settle before we start hammering the API.
      await new Promise((r) => setTimeout(r, 2000))

      for (const themeId of PREWARM_IDS) {
        if (cancelled) return
        // Skip the active theme (already on screen) and anything we've cached.
        if (themeId === activeThemeRef.current.id) continue
        if (themeCacheRef.current[themeId]) continue

        const targetTheme = getThemeById(themeId)
        const restyled = applyPresetToSlides(
          slidesRef.current,
          targetTheme,
          activeThemeRef.current,
        )

        // Two images per theme: A for first/last (title-style bookends),
        // B for middle slides (content-style). Falls through if either
        // call hits the rate limiter — partial cache is still useful.
        let imageA: string | null = null
        let imageB: string | null = null
        try {
          const { data: dataA } = await imagesApi.generate(bgPrompt(targetTheme, true))
          imageA = imagesApi.resolveUrl(dataA.url)
        } catch {
          // Rate limit / network — stop pre-warming; later themes can be
          // generated on-demand if the user picks them.
          return
        }
        if (cancelled) return

        if (restyled.length > 2) {
          try {
            const { data: dataB } = await imagesApi.generate(bgPrompt(targetTheme, false))
            imageB = imagesApi.resolveUrl(dataB.url)
          } catch {
            // If B fails, we still cache with A reused everywhere — better
            // than dropping the whole theme.
            imageB = imageA
          }
        }
        if (cancelled) return

        const lastIndex = restyled.length - 1
        const withBg = restyled.map((s, i) => {
          const url =
            i === 0 || i === lastIndex
              ? imageA
              : (imageB ?? imageA)
          if (!url) return s
          const bgBlock: Block = {
            id: `ai-bg-${targetTheme.id}-${i}-${Date.now()}`,
            type: 'image',
            content: url,
            position: { x: 0, y: 0, w: 1280, h: 720 },
            styling: {},
          }
          return { ...s, blocks: [bgBlock, ...s.blocks] }
        })

        themeCacheRef.current[targetTheme.id] = withBg
        if (id) {
          try {
            localStorage.setItem(`theme_cache_${id}_v2`, JSON.stringify(themeCacheRef.current))
          } catch { /* quota exceeded — best effort */ }
        }
      }
    })()

    return () => { cancelled = true }
  }, [presentation, id])

  // Dynamic canvas scale
  useEffect(() => {
    const compute = () => {
      if (!centerRef.current) return
      const { clientWidth, clientHeight } = centerRef.current
      const scaleW = (clientWidth  - 80) / 1280
      const scaleH = (clientHeight - 80) / 720
      setCanvasScale(Math.min(scaleW, scaleH, 1))
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])

  // Close context menu on outside click
  useEffect(() => {
    if (!ctxMenu) return
    const close = () => setCtxMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [ctxMenu])

  // Present mode keyboard navigation
  useEffect(() => {
    if (!presentMode) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')           setPresentMode(false)
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ')
        setPresentSlide((p) => Math.min(p + 1, slides.length - 1))
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')
        setPresentSlide((p) => Math.max(p - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [presentMode, slides.length])

  const enterPresent = () => {
    setPresentSlide(activeSlide)
    setPresentMode(true)
  }

  // Auto-save
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    if (!id) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSaveStatus('saving')
    debounceRef.current = setTimeout(async () => {
      try {
        await presentationsApi.update(id, { slides, layouts })
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch {
        setSaveStatus('idle')
      }
    }, 500)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [slides, layouts, id])

  // Manual save — cancels the pending debounce and writes immediately.
  const saveNow = useCallback(async () => {
    if (!id) return
    if (debounceRef.current) { clearTimeout(debounceRef.current); debounceRef.current = null }
    setSaveStatus('saving')
    try {
      await presentationsApi.update(id, { slides, layouts })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch {
      setSaveStatus('idle')
    }
  }, [id, slides, layouts])

  // Ctrl/Cmd+S → manual save.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        const t = e.target as HTMLElement | null
        // Don't hijack save inside editable elements — let the browser/editor
        // handle it. But still trigger our save afterwards.
        e.preventDefault()
        saveNow()
        // Touch t to satisfy lint without changing behavior.
        void t
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [saveNow])

  // ── Block interactions ──────────────────────────────────────────────────────
  // Gamma-style: single click on an UNSELECTED block selects it; clicking
  // an ALREADY-selected block enters in-place edit mode. Double-click also
  // enters edit mode immediately. The right-side property panel still
  // works but inline editing is the primary path.
  const handleBlockClick = useCallback((blockId: string) => {
    if (!blockId) { setSelectedBlockId(null); setEditingBlockId(null); return }
    setSelectedBlockId((prevSel) => {
      if (prevSel === blockId) {
        setEditingBlockId(blockId)  // second click on same block → edit
      } else {
        setEditingBlockId(null)
      }
      return blockId
    })
  }, [])

  const handleBlockDoubleClick = useCallback((blockId: string) => {
    setSelectedBlockId(blockId)
    setEditingBlockId(blockId)
  }, [])

  const handleBlockContentChange = useCallback((blockId: string, content: string) => {
    setSlides((prev) =>
      prev.map((s, i) =>
        i !== activeSlide ? s : {
          ...s,
          blocks: s.blocks.map((b) => b.id === blockId ? { ...b, content } : b),
        }
      ),
      { mergeKey: `content:${activeSlide}:${blockId}` },
    )
  }, [activeSlide, setSlides])

  const updateStyling = (blockId: string, updates: Partial<Styling>) => {
    const mergeKey = `styling:${activeSlide}:${blockId}:${Object.keys(updates).sort().join(',')}`
    setSlides((prev) =>
      prev.map((s, i) =>
        i !== activeSlide ? s : {
          ...s,
          blocks: s.blocks.map((b) =>
            b.id === blockId ? { ...b, styling: { ...b.styling, ...updates } } : b
          ),
        }
      ),
      { mergeKey },
    )
  }

  const updateContent = (blockId: string, content: string) => {
    setSlides((prev) =>
      prev.map((s, i) =>
        i !== activeSlide ? s : {
          ...s,
          blocks: s.blocks.map((b) => b.id === blockId ? { ...b, content } : b),
        }
      ),
      { mergeKey: `content:${activeSlide}:${blockId}` },
    )
  }

  // ── Theme ───────────────────────────────────────────────────────────────────
  // Per-deck cache of slides-by-theme. When the user switches themes we stash
  // the current rendering under the *outgoing* theme id, then check if we
  // already have a rendering for the *incoming* theme. Cache hit → instant
  // restore; cache miss → algorithmic restyle now + Gemini refinement in the
  // background. Once Gemini finishes we replace and persist the cache, so
  // the next visit to that theme is also instant.
  const themeCacheRef = useRef<Record<string, Slide[]>>({})
  const themeAiSeqRef = useRef(0)  // cancels stale in-flight AI restyles
  const [aiRestyling, setAiRestyling] = useState(false)
  // Progressive reveal state for theme switches. Non-null while bg images are
  // being generated; drives the small loader badge above the canvas and the
  // entrance animation key on the canvas wrapper.
  const [themeSwitchProgress, setThemeSwitchProgress] = useState<{
    ready: number
    total: number
    themeId: string
  } | null>(null)

  const persistThemeCache = useCallback(() => {
    if (!id) return
    try {
      localStorage.setItem(`theme_cache_${id}_v2`, JSON.stringify(themeCacheRef.current))
    } catch {
      /* quota exceeded — cache is best-effort */
    }
  }, [id])

  const handleApplyTheme = useCallback((theme: ThemePreset) => {
    if (theme.id === activeTheme.id) {
      setThemeOpen(false)
      return
    }

    // Snapshot the outgoing theme so we can restore it later.
    themeCacheRef.current[activeTheme.id] = slidesRef.current

    const cached = themeCacheRef.current[theme.id]
    const algorithmic = applyPresetToSlides(slidesRef.current, theme, activeTheme)

    // ── Cache hit: instant swap ───────────────────────────────────────────
    if (cached) {
      setSlides(cached)
      setActiveTheme(theme)
      setDbTheme(presetToTheme(theme))
      setThemeOpen(false)
      if (id) {
        localStorage.setItem(`theme_preset_${id}`, theme.id)
        persistThemeCache()
        presentationsApi.update(id, { slides: cached })
      }
      return
    }

    // ── Cache miss: progressive reveal (Gamma-style) ──────────────────────
    // The user explicitly does NOT want to see the flat-gradient intermediate
    // state, so we DON'T call setSlides(algorithmic) up front. Instead we
    // keep the OLD theme's slides on screen and replace them one-by-one as
    // each new bg image arrives. The first slide that finishes also switches
    // the active theme so the canvas chrome (toolbar bg, etc.) matches.
    //
    // The per-slide AI text restyle (/generate/slide/rewrite, 60/hour) is
    // intentionally not called — the algorithmic pass already covers color
    // remapping and role styling, and the marginal Gemini icing isn't worth
    // burning quota.

    setThemeOpen(false)
    const seq = ++themeAiSeqRef.current
    const total = algorithmic.length
    setThemeSwitchProgress({ ready: 0, total, themeId: theme.id })
    setAiRestyling(true)

    if (id) localStorage.setItem(`theme_preset_${id}`, theme.id)

    // Working copy starts as the OUTGOING theme's slides so the user keeps
    // seeing the previous render until each slot's new bg image is ready.
    const partial: Slide[] = [...slidesRef.current]
    let readyCount = 0

    // Two prompts per theme — one for "title-style" slides (the first and
    // last, which read as bookends), one for "content-style" slides (every
    // middle slide). This keeps total API spend to 2 calls per switch (or 1
    // on tiny decks) and gives the deck a coherent bookended look: the
    // opening and closing share the same dramatic backdrop, while the body
    // shares a calmer, subtler one.
    const bgPrompt = (isTitle: boolean) => {
      const subject = isTitle
        ? 'sweeping wave-like ridges and flowing dune textures, dramatic side-lit topography, deep shadows and bright highlights along the crests'
        : 'subtle organic ridges and softly draped textured surface, low-key atmospheric lighting'
      return [
        `Cinematic full-bleed background photograph for a ${theme.name}-themed presentation slide.`,
        `Subject: ${subject}.`,
        `Dominant palette: deep ${theme.colors.background} tones with ${theme.colors.accent} highlights catching the light.`,
        `Mood: premium editorial magazine aesthetic, moody and atmospheric, high contrast, rich texture, professional studio photography.`,
        `Composition: ample negative space for headline overlay, off-center focal point, 16:9 aspect ratio.`,
        `No text, no logos, no people.`,
      ].join(' ')
    }

    const tryGenerate = async (isTitle: boolean): Promise<string | null> => {
      try {
        const { data } = await imagesApi.generate(bgPrompt(isTitle))
        return imagesApi.resolveUrl(data.url)
      } catch {
        return null
      }
    }

    const applySlide = (i: number, bgUrl: string | null) => {
      const newSlide: Slide = bgUrl
        ? {
            ...algorithmic[i],
            blocks: [
              {
                id: `ai-bg-${theme.id}-${i}-${Date.now()}`,
                type: 'image',
                content: bgUrl,
                position: { x: 0, y: 0, w: 1280, h: 720 },
                styling: {},
              } as Block,
              ...algorithmic[i].blocks,
            ],
          }
        : algorithmic[i]
      partial[i] = newSlide
      readyCount++
      if (readyCount === 1) {
        setActiveTheme(theme)
        setDbTheme(presetToTheme(theme))
      }
      setSlides([...partial])
      setThemeSwitchProgress({ ready: readyCount, total, themeId: theme.id })
    }

    // Sequential progressive reveal:
    //   1. Generate image A (title-style)  → reveal slide 0.
    //   2. Generate image B (content-style) → reveal middle slides one by
    //      one with a small stagger so the user sees them populating.
    //   3. Reuse image A (no API call)     → reveal the last slide.
    void (async () => {
      const lastIndex = total - 1

      // Step 1 — title-style image for slide 0.
      const imageA = await tryGenerate(true)
      if (seq !== themeAiSeqRef.current) return
      applySlide(0, imageA)

      // Step 2 — content-style image, applied to every middle slide.
      if (total > 2) {
        const imageB = await tryGenerate(false)
        if (seq !== themeAiSeqRef.current) return
        for (let i = 1; i < lastIndex; i++) {
          if (seq !== themeAiSeqRef.current) return
          applySlide(i, imageB)
          // Small stagger between middle slides so the reveal still feels
          // progressive even though we already have the image.
          await new Promise((r) => setTimeout(r, 140))
        }
      }

      // Step 3 — reuse image A on the last slide. No API call.
      if (total > 1 && seq === themeAiSeqRef.current) {
        applySlide(lastIndex, imageA)
      }
    })().finally(() => {
      if (seq !== themeAiSeqRef.current) return  // user switched again
      themeCacheRef.current[theme.id] = partial
      persistThemeCache()
      if (id && activeThemeRef.current.id === theme.id) {
        presentationsApi.update(id, { slides: partial })
      }
      setAiRestyling(false)
      setThemeSwitchProgress(null)
    })
  }, [id, activeTheme, persistThemeCache])

  // ── Slide management ────────────────────────────────────────────────────────
  const addSlideOfKind = (kind: SlideTemplateKind) => {
    const newSlide = makeSlideOfKind(kind, slides.length + 1, activeTheme, slides[activeSlide], slides)
    setSlides((prev) => [...prev, newSlide])
    setActiveSlide(slides.length)
    setSelectedBlockId(null)
    setEditingBlockId(null)
  }

  // Insert a new slide directly after the currently active slide.
  // Used by the toolbar's "+ Slide" button — feels more natural than appending
  // to the end when you're working in the middle of a deck.
  const insertSlideAfterCurrent = (kind: SlideTemplateKind) => {
    const insertAt = activeSlide + 1
    const newSlide = makeSlideOfKind(kind, insertAt + 1, activeTheme, slides[activeSlide], slides)
    setSlides((prev) => {
      const next = [...prev.slice(0, insertAt), newSlide, ...prev.slice(insertAt)]
      return next.map((s, i) => ({ ...s, order: i + 1 }))
    })
    setActiveSlide(insertAt)
    setSelectedBlockId(null)
    setEditingBlockId(null)
  }

  const applyLayoutToCurrentSlide = (kind: SlideTemplateKind) => {
    setSlides((prev) =>
      prev.map((s, i) => i !== activeSlide ? s : {
        ...makeSlideOfKind(kind, s.order, activeTheme, s, prev),
        order: s.order,
      })
    )
    setSelectedBlockId(null)
    setEditingBlockId(null)
  }

  // ── Presenter notes ─────────────────────────────────────────────────────────
  const handleNotesChange = (next: string) => {
    setSlides((prev) => prev.map((s, i) => i === activeSlide ? { ...s, notes: next } : s))
  }

  // ── AI: regenerate current slide ───────────────────────────────────────────
  const handleRegenerateSlide = useCallback(async () => {
    const slide = slides[activeSlide]
    if (!slide || regenerating) return
    setRegenerating(true)
    try {
      // Pull a meaningful title from the slide's blocks (heading or title).
      const headingBlock = slide.blocks.find(
        (b) => b.type === 'heading' || b.type === 'title' || b.type === 'cta',
      )
      const slideTitle = headingBlock?.content ?? presentation?.title ?? ''
      const deckTitles = slides.map((s) => {
        const h = s.blocks.find((b) => b.type === 'heading' || b.type === 'title')
        return h?.content ?? `Slide ${s.order}`
      })
      const instruction = window.prompt(
        'Optional: any specific change? (e.g. "make it shorter", "add more data")\nLeave blank to fully regenerate.',
        '',
      )
      if (instruction === null) {
        setRegenerating(false)
        return
      }
      const res = await generationApi.regenerateSlide({
        original_prompt: presentation?.description || presentation?.title || '',
        level: 'advanced',
        slide_type: slide.type,
        slide_title: slideTitle,
        deck_titles: deckTitles,
        instruction,
      })
      const updated = res.data.slide as { type: string; background: any; blocks: any[]; notes?: string }
      setSlides((prev) =>
        prev.map((s, i) =>
          i !== activeSlide
            ? s
            : {
                ...s,
                type: updated.type,
                background: updated.background,
                blocks: updated.blocks,
                notes: updated.notes ?? s.notes ?? '',
              },
        ),
      )
      setSelectedBlockId(null)
      setEditingBlockId(null)
    } catch (e: any) {
      const msg = e?.response?.data?.detail ?? e?.message ?? 'Regeneration failed'
      window.alert(msg)
    } finally {
      setRegenerating(false)
    }
  }, [slides, activeSlide, regenerating, presentation])

  // ── Deck layouts ────────────────────────────────────────────────────────────
  const handleSaveLayout = (name: string) => {
    const slide = slides[activeSlide]
    if (!slide) return
    setLayouts((prev) => [...prev, makeLayoutFromSlide(slide, name)])
  }
  const handleApplySavedLayout = (layout: DeckLayout) => {
    setSlides((prev) => prev.map((s, i) => i === activeSlide ? applyLayoutToSlide(s, layout) : s))
    setSelectedBlockId(null)
    setEditingBlockId(null)
  }
  const handleDeleteLayout = (layoutId: string) => {
    setLayouts((prev) => prev.filter((l) => l.id !== layoutId))
  }

  // ── Version restore ─────────────────────────────────────────────────────────
  const handleVersionRestored = (detail: PresentationDetail) => {
    setPresentation(detail)
    history.resetTo(detail.slides)
    setLayouts((detail as any).layouts ?? [])
    setActiveSlide(0)
    setSelectedBlockId(null)
  }

  // ── Slide rewrite ───────────────────────────────────────────────────────────
  const handleSlideRewrite = (newSlide: Slide, _note: string) => {
    // Pin the rewritten slide into the current index; preserves order.
    setSlides((prev) =>
      prev.map((s, i) => i === activeSlide ? { ...newSlide, order: s.order } : s)
    )
    // Keep panel open so users can iterate, but bounce out of any block edit.
    setSelectedBlockId(null)
    setEditingBlockId(null)
  }

  // ── AI image generation ─────────────────────────────────────────────────────
  const handleGenerateImage = async (prompt: string) => {
    const blockId = aiImageBlockId
    if (!blockId) return
    try {
      const { data } = await imagesApi.generate(prompt)
      const fullUrl = imagesApi.resolveUrl(data.url)
      setSlides((prev) => prev.map((s, i) =>
        i !== activeSlide ? s : {
          ...s,
          blocks: s.blocks.map((b) => b.id === blockId ? { ...b, content: fullUrl } : b),
        },
      ))
    } catch (err: any) {
      alert(err.response?.data?.detail ?? 'Image generation failed')
    } finally {
      setAiImageOpen(false)
      setAiImageBlockId(null)
    }
  }

  // ── Block insert / delete / move / resize ───────────────────────────────────
  const insertBlock = (block: Block) => {
    setSlides((prev) =>
      prev.map((s, i) => i !== activeSlide ? s : { ...s, blocks: [...s.blocks, block] })
    )
    setSelectedBlockId(block.id)
    setEditingBlockId(null)
  }

  const handleInsertText = () => {
    insertBlock(makeTextBlock(activeTheme))
  }

  const handleInsertImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-uploading the same file
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const src = reader.result as string
      insertBlock(makeImageBlock(src))
    }
    reader.readAsDataURL(file)
  }

  const handleInsertChart = () => {
    setEditingChartId(null)
    setChartModalOpen(true)
  }

  const handleEditChart = () => {
    if (!selectedBlockId) return
    setEditingChartId(selectedBlockId)
    setChartModalOpen(true)
  }

  const handleChartSubmit = (chartType: ChartType, data: ChartDataPoint[]) => {
    if (editingChartId) {
      setSlides((prev) =>
        prev.map((s, i) => i !== activeSlide ? s : {
          ...s,
          blocks: s.blocks.map((b) =>
            b.id === editingChartId ? { ...b, chart_type: chartType, chart_data: data } : b
          ),
        })
      )
    } else {
      insertBlock(makeChartBlock(chartType, data))
    }
    setChartModalOpen(false)
    setEditingChartId(null)
  }

  const deleteBlock = useCallback((blockId: string) => {
    setSlides((prev) =>
      prev.map((s, i) => i !== activeSlide ? s : {
        ...s, blocks: s.blocks.filter((b) => b.id !== blockId),
      })
    )
    setSelectedBlockId(null)
    setEditingBlockId(null)
  }, [activeSlide])

  // Delete-key handling for selected block (skip while editing text or in modals)
  useEffect(() => {
    if (presentMode || chartModalOpen || themeOpen) return
    if (!selectedBlockId || editingBlockId) return
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        deleteBlock(selectedBlockId)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedBlockId, editingBlockId, presentMode, chartModalOpen, themeOpen, deleteBlock])

  const handleDeleteSelected = () => {
    if (selectedBlockId) deleteBlock(selectedBlockId)
  }

  const handleBlockPositionChange = useCallback((blockId: string, next: Position) => {
    setSlides((prev) =>
      prev.map((s, i) => i !== activeSlide ? s : {
        ...s,
        blocks: s.blocks.map((b) => b.id === blockId ? { ...b, position: next } : b),
      }),
      { mergeKey: `position:${activeSlide}:${blockId}` },
    )
  }, [activeSlide, setSlides])

  const duplicateSlide = (index: number) => {
    const src = slides[index]
    const dup: Slide = {
      ...src,
      order: index + 2,
      blocks: src.blocks.map((b) => ({ ...b, id: crypto.randomUUID() })),
    }
    const next = [
      ...slides.slice(0, index + 1),
      dup,
      ...slides.slice(index + 1),
    ].map((s, i) => ({ ...s, order: i + 1 }))
    setSlides(next)
    setActiveSlide(index + 1)
    setCtxMenu(null)
  }

  const deleteSlide = (index: number) => {
    if (slides.length <= 1) { setCtxMenu(null); return }
    const next = slides.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 }))
    setSlides(next)
    setActiveSlide(Math.min(activeSlide, next.length - 1))
    setCtxMenu(null)
  }

  const moveSlide = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= slides.length) return
    setSlides((prev) => {
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next.map((s, i) => ({ ...s, order: i + 1 }))
    })
    if (activeSlide === index) setActiveSlide(target)
    else if (activeSlide === target) setActiveSlide(index)
    setCtxMenu(null)
  }

  // ── Drag-and-drop reorder ───────────────────────────────────────────────────
  const handleDragStart = (index: number) => {
    setDragIdx(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOver(index)
  }

  const handleDrop = (targetIndex: number) => {
    if (dragIdx === null || dragIdx === targetIndex) { setDragIdx(null); setDragOver(null); return }
    setSlides((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIdx, 1)
      next.splice(targetIndex, 0, moved)
      return next.map((s, i) => ({ ...s, order: i + 1 }))
    })
    if (activeSlide === dragIdx) setActiveSlide(targetIndex)
    else if (activeSlide > Math.min(dragIdx, targetIndex) && activeSlide <= Math.max(dragIdx, targetIndex)) {
      setActiveSlide(dragIdx < targetIndex ? activeSlide - 1 : activeSlide + 1)
    }
    setDragIdx(null)
    setDragOver(null)
  }

  const handleDragEnd = () => { setDragIdx(null); setDragOver(null) }

  // ── Slide update from chat ──────────────────────────────────────────────────
  const handleSlideUpdate = useCallback((updated: Slide) => {
    setSlides((prev) => prev.map((s, i) => i === activeSlide ? updated : s))
  }, [activeSlide])

  // ── Share link ──────────────────────────────────────────────────────────────
  const handleShare = async () => {
    if (!id) return
    const url = shareApi.url(id)
    setShareUrl(url)
    setShareCopied(false)
    try {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
    } catch {
      // clipboard may be blocked — user can still copy from the input
    }
  }

  // ── Export / Download ───────────────────────────────────────────────────────
  const handleDownload = async (format: 'pptx' | 'pdf' | 'html') => {
    if (!id) return
    setDownloadOpen(false)
    setExporting(true)
    setExportReady(null)
    setExportError(null)
    setExportProgress(0)
    try {
      const { data } = await exportApi.start(id, format)
      const poll = setInterval(async () => {
        const { data: s } = await exportApi.status(data.job_id)
        setExportProgress(s.progress ?? 0)
        if (s.status === 'completed') {
          clearInterval(poll)
          setExporting(false)
          setExportReady({ jobId: data.job_id, format })
        } else if (s.status === 'failed') {
          clearInterval(poll)
          setExporting(false)
          setExportError(s.error_message ?? 'Export failed')
        }
      }, 2000)
    } catch {
      setExporting(false)
      setExportError('Export failed. Please try again.')
    }
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  // Prefer the DB theme (matches the template the user picked). Fall back to
  // the preset only if the API fetch hasn't returned yet.
  const themeObj      = dbTheme ?? presetToTheme(activeTheme)
  const canvasBg      = getCanvasBg(themeObj.colors.background)
  const currentSlide  = slides[activeSlide]
  const selectedBlock = currentSlide?.blocks.find((b) => b.id === selectedBlockId) ?? null

  if (!presentation) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#13131f', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
        Loading…
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: canvasBg }}>

      {/* ── Toolbar ── */}
      <div style={{
        height: 56, flexShrink: 0, zIndex: 20,
        background: '#0A0907',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px',
      }}>
        <button
          onClick={() => navigate('/decks')}
          style={{
            background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.65)', borderRadius: 10, lineHeight: 1,
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 150ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)'
            ;(e.currentTarget as HTMLElement).style.color = '#fff'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'
            ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)'
          }}
        >←</button>

        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: '#fff', fontSize: 9, fontWeight: 800, letterSpacing: 0.2 }}>WAC</span>
        </div>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{
            color: '#fff', fontSize: 14, fontWeight: 500, overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: -0.2,
            fontFamily: 'Fraunces, serif',
          }}>
            {presentation.title}
          </span>
          {saveStatus !== 'idle' && (
            <span style={{
              fontSize: 10, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase',
              fontFamily: 'JetBrains Mono, monospace',
              color: saveStatus === 'saving' ? 'rgba(255,255,255,0.45)' : '#7DD3A8',
              marginTop: 1,
            }}>
              {saveStatus === 'saving' ? '— Saving…' : '— Saved'}
            </span>
          )}
          {aiRestyling && (
            <span style={{
              fontSize: 10, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase',
              fontFamily: 'JetBrains Mono, monospace',
              color: '#A78BFA',
              marginTop: 1,
            }}>
              — AI restyling…
            </span>
          )}
        </div>

        {/* Save — explicit manual save, complements the 500ms debounced auto-save */}
        <button
          onClick={saveNow}
          disabled={saveStatus === 'saving'}
          title="Save now (Ctrl+S)"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 999,
            color: '#fff',
            height: 36,
            padding: '0 16px',
            fontSize: 13,
            fontWeight: 600,
            cursor: saveStatus === 'saving' ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
            letterSpacing: -0.1,
            transition: 'all 200ms cubic-bezier(0.22, 1, 0.36, 1)',
            opacity: saveStatus === 'saving' ? 0.65 : 1,
          }}
          onMouseEnter={e => {
            if (saveStatus !== 'saving') {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.14)'
            }
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'
          }}
        >
          {saveStatus === 'saving' ? (
            <>
              <span
                style={{
                  display: 'inline-block',
                  width: 11,
                  height: 11,
                  border: '2px solid rgba(255,255,255,0.25)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              Saving…
            </>
          ) : (
            <>💾 Save</>
          )}
        </button>

        {/* Undo / Redo — pinned in the top bar so they never overlap the canvas toolbar */}
        <TopBarIconBtn
          label="↶"
          title="Undo (Ctrl+Z)"
          disabled={!history.canUndo}
          onClick={history.undo}
        />
        <TopBarIconBtn
          label="↷"
          title="Redo (Ctrl+Shift+Z)"
          disabled={!history.canRedo}
          onClick={history.redo}
        />

        <TBtn label="Theme" active={themeOpen} onClick={() => setThemeOpen((o) => !o)} />
        <TBtn label="AI" active={chatOpen} onClick={() => setChatOpen((o) => !o)} />
        <button
          onClick={enterPresent}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 999,
            color: '#fff', height: 36, padding: '0 16px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            whiteSpace: 'nowrap', letterSpacing: -0.1,
            transition: 'all 200ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.14)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)' }}
        >
          ▶ Present
        </button>

        {/* Share button */}
        <button
          onClick={handleShare}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 999,
            color: '#fff', height: 36, padding: '0 16px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            whiteSpace: 'nowrap', letterSpacing: -0.1,
            transition: 'all 200ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.14)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)' }}
          title="Public read-only link — anyone can open it without an account"
        >
          🔗 Share
        </button>

        {/* Download button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setDownloadOpen((o) => !o); setExportReady(null); setExportError(null) }}
            disabled={exporting}
            style={{
              background: '#fff',
              border: 'none',
              color: '#0A0907',
              borderRadius: 999, height: 36, padding: '0 16px',
              fontSize: 13, fontWeight: 600, cursor: exporting ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 200ms cubic-bezier(0.22, 1, 0.36, 1)',
              whiteSpace: 'nowrap', letterSpacing: -0.1,
              opacity: exporting ? 0.6 : 1,
            }}
            onMouseEnter={e => { if (!exporting) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.88)' }}
            onMouseLeave={e => { if (!exporting) (e.currentTarget as HTMLElement).style.background = '#fff' }}
          >
            {exporting ? (
              <>
                <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(10,9,7,0.25)', borderTopColor: '#0A0907', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Exporting {exportProgress}%
              </>
            ) : '↓ Download'}
          </button>

          {/* Format picker dropdown */}
          {downloadOpen && !exporting && (
            <div
              style={{
                position: 'absolute', top: 44, right: 0, zIndex: 100,
                background: '#1e1e35', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, overflow: 'hidden',
                boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                minWidth: 180,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: '10px 14px 6px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase' }}>
                Choose format
              </div>
              {(['pdf', 'pptx', 'html'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => handleDownload(fmt)}
                  style={{
                    width: '100%', textAlign: 'left', background: 'none',
                    border: 'none', padding: '10px 14px',
                    color: '#e2e8f0', fontSize: 13, fontWeight: 500,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                    borderTop: fmt !== 'pdf' ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                >
                  <span style={{ fontSize: 18 }}>{fmt === 'pdf' ? '📄' : fmt === 'pptx' ? '📊' : '🌐'}</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{fmt.toUpperCase()}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
                      {fmt === 'pdf'
                        ? 'PDF — exact match to web (recommended)'
                        : fmt === 'pptx'
                          ? 'PowerPoint file — editable, may overflow boxes'
                          : 'Web HTML file'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Share URL banner */}
      {shareUrl && (
        <div style={{
          background: '#0f1f2d', color: '#7dd3fc',
          padding: '10px 20px', fontSize: 12, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <span style={{ fontWeight: 600 }}>{shareCopied ? '✓ Link copied — share it with anyone:' : '🔗 Public link (anyone can view, no login):'}</span>
          <input
            readOnly
            value={shareUrl}
            onFocus={e => e.currentTarget.select()}
            style={{
              flex: '0 1 480px', minWidth: 0, background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
              color: '#e2e8f0', padding: '4px 8px', fontSize: 12, fontFamily: 'monospace',
            }}
          />
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(shareUrl)
                setShareCopied(true)
              } catch { /* noop */ }
            }}
            style={{ background: 'none', border: '1px solid rgba(125,211,252,0.4)', color: '#7dd3fc', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
          >
            Copy
          </button>
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#7dd3fc', fontSize: 11, fontWeight: 600 }}
          >
            Open ↗
          </a>
          <button onClick={() => { setShareUrl(null); setShareCopied(false) }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* Export ready / error banner */}
      {(exportReady || exportError) && (
        <div style={{
          background: exportReady ? '#0f2d1f' : '#2d0f0f',
          color: exportReady ? '#4ade80' : '#f87171',
          padding: '8px 20px', fontSize: 12, textAlign: 'center', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        }}>
          {exportReady ? (
            <>
              <span>✓ Your file is ready — you can download now</span>
              <button
                onClick={() => exportApi.download(exportReady.jobId, `presentation.${exportReady.format}`)}
                style={{ background: 'none', border: 'none', color: '#86efac', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
              >
                Download
              </button>
              <button onClick={() => setExportReady(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
            </>
          ) : (
            <>
              <span>{exportError}</span>
              <button onClick={() => setExportError(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
            </>
          )}
        </div>
      )}

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left slide strip */}
        <div style={{
          width: 168, flexShrink: 0,
          background: '#0f0f1a',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Add slide menu (Title / Agenda / Content / Blank) */}
          <AddSlideMenu onPick={addSlideOfKind} />

          {/* Slide thumbnails */}
          <div style={{ padding: '4px 8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {slides.map((s, i) => (
              <div
                key={i}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDrop={() => handleDrop(i)}
                onDragEnd={handleDragEnd}
                style={{
                  position: 'relative',
                  opacity: dragIdx === i ? 0.4 : 1,
                  transition: 'opacity 0.15s',
                  outline: dragOver === i && dragIdx !== i ? '2px solid #6366f1' : 'none',
                  borderRadius: 8,
                }}
              >
                <button
                  onMouseDown={() => { setActiveSlide(i); setSelectedBlockId(null); setEditingBlockId(null) }}
                  onClick={() => { setActiveSlide(i); setSelectedBlockId(null); setEditingBlockId(null) }}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setCtxMenu({ index: i, x: e.clientX, y: e.clientY })
                  }}
                  style={{ width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  <div style={{
                    border: `2px solid ${i === activeSlide ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 7, overflow: 'hidden', transition: 'border-color 0.15s',
                    lineHeight: 0,
                  }}>
                    <SlidePreview slide={s} theme={themeObj} scale={0.116} />
                  </div>
                  <div style={{ color: i === activeSlide ? '#a5b4fc' : 'rgba(255,255,255,0.25)', fontSize: 10, marginTop: 4, textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
                    {s.order}
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Center canvas */}
        <div
          ref={centerRef}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', position: 'relative', background: canvasBg,
            transition: 'background 0.4s ease',
          }}
          onClick={() => {
            setSelectedBlockId(null); setEditingBlockId(null)
            setDownloadOpen(false)
          }}
        >
          {/* Floating editor toolbar */}
          <div style={{
            position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
            zIndex: 30,
          }}>
            <EditorToolbar
              block={selectedBlock}
              saveStatus={saveStatus}
              onStylingChange={(u) => selectedBlock && updateStyling(selectedBlock.id, u)}
              onInsertText={handleInsertText}
              onInsertImage={handleInsertImageClick}
              onInsertChart={handleInsertChart}
              onAddSlide={insertSlideAfterCurrent}
              onApplyLayout={applyLayoutToCurrentSlide}
              onPreview={enterPresent}
              onDelete={handleDeleteSelected}
              onEditChart={selectedBlock?.type === 'chart' ? handleEditChart : undefined}
              onRegenerateSlide={handleRegenerateSlide}
              regenerating={regenerating}
            />
          </div>

          {/* P1: secondary toolbar — rewrite, notes / layouts / history / AI image
              (Undo/Redo live in the top app bar so they never overlap the canvas toolbar.) */}
          <div style={{
            position: 'absolute', top: 14, right: 24, zIndex: 30,
            display: 'flex', gap: 8, alignItems: 'center',
          }}>
            {currentSlide && (
              <SecondaryBtn
                label="Rewrite"
                active={rewriteOpen}
                onClick={() => setRewriteOpen((v) => !v)}
              />
            )}
            <SecondaryBtn
              label="Notes"
              active={notesOpen}
              onClick={() => setNotesOpen((v) => !v)}
            />
            <SecondaryBtn
              label="Layouts"
              active={layoutsOpen}
              onClick={() => { setLayoutsOpen((v) => !v); if (historyOpen) setHistoryOpen(false) }}
            />
            <SecondaryBtn
              label="History"
              active={historyOpen}
              onClick={() => { setHistoryOpen((v) => !v); if (layoutsOpen) setLayoutsOpen(false) }}
            />
            {selectedBlock?.type === 'image' && (
              <SecondaryBtn
                label="AI image"
                active={false}
                onClick={() => { setAiImageBlockId(selectedBlock.id); setAiImageOpen(true) }}
              />
            )}
          </div>

          {currentSlide && (
            // Keying by slide.id + activeTheme.id + first-block-id triggers a
            // remount whenever the slide swaps to the new theme during a
            // progressive reveal — the .wac-slide-enter animation then plays.
            <div
              key={`${(currentSlide as any).id ?? activeSlide}-${activeTheme.id}-${currentSlide.blocks[0]?.id ?? ''}`}
              className="wac-slide-enter"
            >
              <SlidePreview
                slide={currentSlide}
                theme={themeObj}
                scale={canvasScale}
                selectedBlockId={selectedBlockId}
                editingBlockId={editingBlockId}
                onBlockClick={handleBlockClick}
                onBlockDoubleClick={handleBlockDoubleClick}
                onBlockContentChange={handleBlockContentChange}
                editable
                onBlockPositionChange={handleBlockPositionChange}
                totalSlides={slides.length}
                deckTitle={presentation?.title}
              />
            </div>
          )}

          {/* Theme-switch progress badge — only visible while bg images are
              being generated. Sits in the top-left of the canvas so it
              doesn't overlap the right-side secondary toolbar. */}
          {themeSwitchProgress && (
            <div
              style={{
                position: 'absolute', top: 14, left: 24, zIndex: 40,
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', borderRadius: 999,
                background: 'rgba(0,0,0,0.78)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                pointerEvents: 'none',
              }}
            >
              <Loader2 size={13} className="animate-spin" color="#fff" />
              <span style={{
                color: '#fff', fontSize: 12, fontWeight: 500,
                fontFamily: 'Inter, sans-serif',
                fontVariantNumeric: 'tabular-nums',
              }}>
                Generating theme · {themeSwitchProgress.ready} / {themeSwitchProgress.total}
              </span>
            </div>
          )}

          {/* Gamma-style staggered block entrance. The wrapper key change
              remounts the slide; each direct child of the canvas (bg image,
              title, body, panels, etc.) then fades up in sequence, giving
              the deck a "composing itself" feel instead of a single flat
              fade-in. */}
          <style>{`
            @keyframes wac-block-enter {
              from { opacity: 0; transform: translateY(14px); filter: blur(2px); }
              to   { opacity: 1; transform: translateY(0);    filter: blur(0);   }
            }
            .wac-slide-enter > div > * {
              animation: wac-block-enter 560ms cubic-bezier(0.22, 1, 0.36, 1) both;
            }
            /* Stagger the first ~16 children. Anything beyond falls back to
               the default 0ms delay — uncommon for a single slide anyway. */
            .wac-slide-enter > div > *:nth-child(1)  { animation-delay: 0ms;    }
            .wac-slide-enter > div > *:nth-child(2)  { animation-delay: 90ms;   }
            .wac-slide-enter > div > *:nth-child(3)  { animation-delay: 180ms;  }
            .wac-slide-enter > div > *:nth-child(4)  { animation-delay: 270ms;  }
            .wac-slide-enter > div > *:nth-child(5)  { animation-delay: 360ms;  }
            .wac-slide-enter > div > *:nth-child(6)  { animation-delay: 450ms;  }
            .wac-slide-enter > div > *:nth-child(7)  { animation-delay: 540ms;  }
            .wac-slide-enter > div > *:nth-child(8)  { animation-delay: 630ms;  }
            .wac-slide-enter > div > *:nth-child(9)  { animation-delay: 720ms;  }
            .wac-slide-enter > div > *:nth-child(10) { animation-delay: 810ms;  }
            .wac-slide-enter > div > *:nth-child(11) { animation-delay: 900ms;  }
            .wac-slide-enter > div > *:nth-child(12) { animation-delay: 990ms;  }
            .wac-slide-enter > div > *:nth-child(13) { animation-delay: 1080ms; }
            .wac-slide-enter > div > *:nth-child(14) { animation-delay: 1170ms; }
            .wac-slide-enter > div > *:nth-child(15) { animation-delay: 1260ms; }
            .wac-slide-enter > div > *:nth-child(16) { animation-delay: 1350ms; }
          `}</style>

          <div style={{
            position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
            fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'Inter, sans-serif',
            pointerEvents: 'none', whiteSpace: 'nowrap',
          }}>
            {currentSlide?.order} / {slides.length}
            {'  ·  Click to select  ·  Drag to move  ·  Double-click to edit  ·  Del to remove'}
          </div>
        </div>

        {/* Right property panel */}
        {selectedBlock && (
          <div style={{
            width: 232, flexShrink: 0,
            background: '#13131f',
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            overflowY: 'auto', padding: 16,
          }}>
            <PropertyPanel
              block={selectedBlock}
              onStylingChange={(u) => updateStyling(selectedBlock.id, u)}
              onContentChange={(c) => updateContent(selectedBlock.id, c)}
              onImageUpload={(url) => updateContent(selectedBlock.id, url)}
              dark
            />
          </div>
        )}

        {/* Right AI chat panel */}
        {chatOpen && (
          <div style={{
            width: 300, flexShrink: 0,
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <SlideChat
              slide={currentSlide ?? null}
              presentationId={id ?? ''}
              onSlideUpdate={handleSlideUpdate}
            />
          </div>
        )}
      </div>

      {/* ── Context menu ── */}
      {ctxMenu && (
        <div
          style={{
            position: 'fixed', top: ctxMenu.y, left: ctxMenu.x, zIndex: 200,
            background: '#1e1e35', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
            minWidth: 160,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <CtxItem label="Duplicate" icon="⧉" onClick={() => duplicateSlide(ctxMenu.index)} />
          <CtxItem
            label="Move Up"
            icon="↑"
            disabled={ctxMenu.index === 0}
            onClick={() => moveSlide(ctxMenu.index, -1)}
          />
          <CtxItem
            label="Move Down"
            icon="↓"
            disabled={ctxMenu.index === slides.length - 1}
            onClick={() => moveSlide(ctxMenu.index, 1)}
          />
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
          <CtxItem
            label="Delete"
            icon="🗑"
            danger
            disabled={slides.length <= 1}
            onClick={() => deleteSlide(ctxMenu.index)}
          />
        </div>
      )}

      {/* ── Present mode overlay ── */}
      {presentMode && (
        <PresentOverlay
          slides={slides}
          theme={themeObj}
          current={presentSlide}
          onChangeCurrent={setPresentSlide}
          onExit={() => setPresentMode(false)}
        />
      )}

      {/* Theme panel overlay */}
      {themeOpen && (
        <ThemePanel
          currentThemeId={activeTheme.id}
          onClose={() => setThemeOpen(false)}
          onApply={handleApplyTheme}
        />
      )}

      {/* Notes drawer (renders inside main canvas area) */}
      {notesOpen && currentSlide && (
        <NotesPanel
          value={currentSlide.notes ?? ''}
          slideKey={activeSlide}
          onChange={handleNotesChange}
        />
      )}

      {/* Version history side panel */}
      {historyOpen && id && (
        <VersionHistoryPanel
          presentationId={id}
          onClose={() => setHistoryOpen(false)}
          onRestored={handleVersionRestored}
        />
      )}

      {/* Layouts side panel */}
      {layoutsOpen && (
        <LayoutsPanel
          layouts={layouts}
          currentSlide={currentSlide ?? null}
          onSaveCurrent={handleSaveLayout}
          onApply={handleApplySavedLayout}
          onDelete={handleDeleteLayout}
          onClose={() => setLayoutsOpen(false)}
        />
      )}

      {/* AI slide rewrite panel */}
      {rewriteOpen && currentSlide && (
        <SlideRewritePanel
          slide={currentSlide}
          onClose={() => setRewriteOpen(false)}
          onApply={handleSlideRewrite}
        />
      )}

      {/* AI image generation modal */}
      {aiImageOpen && (
        <AiImageModal
          onCancel={() => { setAiImageOpen(false); setAiImageBlockId(null) }}
          onSubmit={handleGenerateImage}
        />
      )}

      {/* Chart modal */}
      {chartModalOpen && (
        <ChartModal
          initialType={
            editingChartId
              ? (currentSlide?.blocks.find((b) => b.id === editingChartId)?.chart_type ?? 'bar')
              : 'bar'
          }
          initialData={
            editingChartId
              ? currentSlide?.blocks.find((b) => b.id === editingChartId)?.chart_data
              : undefined
          }
          onCancel={() => { setChartModalOpen(false); setEditingChartId(null) }}
          onSubmit={handleChartSubmit}
        />
      )}

      {/* Hidden file input for image insert */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFileSelected}
        style={{ display: 'none' }}
      />

      {/* Spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Toolbar button ─────────────────────────────────────────────────────────────

function TBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.05)',
        border: '1px solid ' + (active ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.08)'),
        color: active ? '#fff' : 'rgba(255,255,255,0.75)',
        borderRadius: 999, height: 36, padding: '0 16px',
        fontSize: 13, fontWeight: 600, cursor: 'pointer',
        transition: 'all 200ms cubic-bezier(0.22, 1, 0.36, 1)',
        whiteSpace: 'nowrap', letterSpacing: -0.1,
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)' }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
    >{label}</button>
  )
}

// ── Context menu item ─────────────────────────────────────────────────────────

function CtxItem({ label, icon, onClick, disabled, danger }: {
  label: string; icon: string; onClick: () => void; disabled?: boolean; danger?: boolean
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        width: '100%', textAlign: 'left', background: 'none', border: 'none',
        padding: '9px 14px', color: disabled ? 'rgba(255,255,255,0.2)' : danger ? '#f87171' : '#e2e8f0',
        fontSize: 13, fontWeight: 500, cursor: disabled ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', gap: 10,
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = danger ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.06)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
    >
      <span style={{ width: 16, textAlign: 'center', fontSize: 14 }}>{icon}</span>
      {label}
    </button>
  )
}

// ── Present mode overlay ──────────────────────────────────────────────────────

function PresentOverlay({ slides, theme, current, onChangeCurrent, onExit }: {
  slides: Slide[]
  theme: Theme
  current: number
  onChangeCurrent: (i: number) => void
  onExit: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [notesOpen, setNotesOpen] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  useEffect(() => {
    const compute = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current
        setScale(Math.min(clientWidth / SLIDE_W, clientHeight / SLIDE_H))
      }
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [notesOpen])

  // 'N' toggles speaker notes; 'S' toggles speech.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        setNotesOpen((v) => !v)
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault()
        toggleSpeak()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const slide = slides[current]
  const isFirst = current === 0
  const isLast  = current === slides.length - 1
  const notes = (slide?.notes ?? '').trim()

  // Pick a "good" voice once when the synth voice list is ready.
  const pickVoice = (): SpeechSynthesisVoice | null => {
    if (!ttsSupported) return null
    const voices = window.speechSynthesis.getVoices()
    if (!voices.length) return null
    // Prefer en-US Google/Microsoft voices, then any en-* voice, then default.
    const score = (v: SpeechSynthesisVoice) => {
      let s = 0
      if (v.lang?.startsWith('en')) s += 10
      if (v.lang === 'en-US') s += 5
      if (/Google|Microsoft|Natural|Neural/i.test(v.name)) s += 3
      if (v.default) s += 1
      return s
    }
    return [...voices].sort((a, b) => score(b) - score(a))[0] ?? null
  }

  const speakNow = (text: string) => {
    if (!ttsSupported || !text.trim()) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    const v = pickVoice()
    if (v) { u.voice = v; u.lang = v.lang }
    u.rate = 1.0
    u.pitch = 1.0
    u.onend = () => setSpeaking(false)
    u.onerror = () => setSpeaking(false)
    setSpeaking(true)
    window.speechSynthesis.speak(u)
  }

  const toggleSpeak = () => {
    if (!ttsSupported) return
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    speakNow(notes || 'No speaker notes for this slide.')
  }

  // Stop speech when navigating away from the slide or exiting present mode.
  useEffect(() => {
    if (!ttsSupported) return
    return () => {
      window.speechSynthesis.cancel()
      setSpeaking(false)
    }
  }, [current, ttsSupported])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: '#000',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Slide area */}
      <div
        ref={containerRef}
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
        onClick={() => onChangeCurrent(Math.min(current + 1, slides.length - 1))}
      >
        {slide && (
          <SlidePreview slide={slide} theme={theme} scale={scale} />
        )}
      </div>

      {/* Speaker notes panel (toggle with N) */}
      {notesOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            flexShrink: 0,
            maxHeight: '28vh',
            overflowY: 'auto',
            padding: '18px 28px',
            background: 'rgba(15, 15, 18, 0.95)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.85)',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 15,
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
          }}
        >
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.4)', marginBottom: 8,
          }}>
            Speaker notes
          </div>
          {notes || <span style={{ color: 'rgba(255,255,255,0.3)' }}>No notes for this slide.</span>}
        </div>
      )}

      {/* Controls bar */}
      <div style={{
        height: 52, flexShrink: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
      }}>
        {/* Slide counter */}
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'Inter, sans-serif', minWidth: 60 }}>
          {current + 1} / {slides.length}
        </span>

        {/* Nav arrows */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <NavBtn label="←" disabled={isFirst} onClick={() => onChangeCurrent(current - 1)} />

          {/* Dot indicators */}
          <div style={{ display: 'flex', gap: 5, alignItems: 'center', maxWidth: 320, overflow: 'hidden' }}>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); onChangeCurrent(i) }}
                style={{
                  width:  i === current ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  border: 'none',
                  background: i === current ? '#6366f1' : 'rgba(255,255,255,0.25)',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>

          <NavBtn label="→" disabled={isLast} onClick={() => onChangeCurrent(current + 1)} />
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {ttsSupported && (
            <button
              onClick={(e) => { e.stopPropagation(); toggleSpeak() }}
              title={speaking ? 'Stop narration (S)' : 'Read notes aloud (S)'}
              style={{
                background: speaking ? 'rgba(180,60,40,0.35)' : 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: speaking ? '#fca5a5' : 'rgba(255,255,255,0.6)',
                borderRadius: 7,
                padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {speaking ? '■ Stop' : '▶ Speak'}
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setNotesOpen((v) => !v) }}
            title="Toggle speaker notes (N)"
            style={{
              background: notesOpen ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: notesOpen ? '#a5b4fc' : 'rgba(255,255,255,0.6)',
              borderRadius: 7,
              padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Notes
          </button>
          <button
            onClick={onExit}
            style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.6)', borderRadius: 7,
              padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              minWidth: 60,
            }}
          >
            ✕ Exit
          </button>
        </div>
      </div>
    </div>
  )
}

function NavBtn({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      disabled={disabled}
      style={{
        width: 36, height: 36, borderRadius: 8,
        background: disabled ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: disabled ? 'rgba(255,255,255,0.2)' : '#fff',
        fontSize: 16, cursor: disabled ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >{label}</button>
  )
}

// ── Secondary toolbar button (P1 panels) ────────────────────────────────────

function TopBarIconBtn({
  label, title, onClick, disabled,
}: { label: string; title?: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: 36, height: 36, borderRadius: 999,
        background: disabled ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
        border: '1px solid ' + (disabled ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.10)'),
        color: disabled ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.85)',
        fontSize: 16, fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 200ms cubic-bezier(0.22, 1, 0.36, 1)',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        if (!disabled) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.14)'
      }}
      onMouseLeave={(e) => {
        if (!disabled) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'
      }}
    >{label}</button>
  )
}

function SecondaryBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 32, padding: '0 12px', borderRadius: 8,
        background: active ? 'rgba(99,102,241,0.22)' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${active ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'}`,
        color: active ? '#cbd5ff' : 'rgba(255,255,255,0.85)',
        fontSize: 12, fontWeight: 600, cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >{label}</button>
  )
}

// ── AI image modal ──────────────────────────────────────────────────────────

function AiImageModal({
  onCancel, onSubmit,
}: { onCancel: () => void; onSubmit: (prompt: string) => Promise<void> }) {
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)

  const handleGo = async () => {
    if (!prompt.trim() || busy) return
    setBusy(true)
    try {
      await onSubmit(prompt.trim())
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)', zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 480, background: '#1a1a2e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14, padding: 24,
        }}
      >
        <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 600, margin: '0 0 8px 0' }}>
          Generate image with AI
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12.5, margin: '0 0 16px 0', lineHeight: 1.5 }}>
          Describe what you want to see. The result will replace the selected image block.
        </p>
        <textarea
          autoFocus
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="A minimalist illustration of a rocket launching into a starfield, soft pastel palette."
          rows={4}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: 12, color: '#e2e8f0', fontSize: 13, outline: 'none',
            resize: 'vertical', fontFamily: 'Inter, sans-serif',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button
            onClick={onCancel}
            disabled={busy}
            style={{
              padding: '8px 14px', borderRadius: 8,
              background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.75)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
            }}
          >Cancel</button>
          <button
            onClick={handleGo}
            disabled={!prompt.trim() || busy}
            style={{
              padding: '8px 16px', borderRadius: 8,
              background: 'rgba(99,102,241,0.9)', border: 'none',
              color: '#fff', fontSize: 12.5, fontWeight: 600,
              cursor: (!prompt.trim() || busy) ? 'not-allowed' : 'pointer',
              opacity: (!prompt.trim() || busy) ? 0.5 : 1,
            }}
          >{busy ? 'Generating…' : 'Generate'}</button>
        </div>
      </div>
    </div>
  )
}
