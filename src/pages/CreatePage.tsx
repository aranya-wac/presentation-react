import { useMemo, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Play, Save } from 'lucide-react'
import { generationApi, presentationsApi, BASE_URL } from '../api/client'
import type { Slide, Theme, Block } from '../types'
import { PromptScreen } from '../components/Create/PromptScreen'
import { TopicScreen, type ResearchDepth } from '../components/Create/TopicScreen'
import { OutlinePanel } from '../components/Create/OutlinePanel'
import { OutlineReviewScreen, type OutlineSlide } from '../components/Create/OutlineReviewScreen'
import { BlockEditorPanel } from '../components/Create/BlockEditorPanel'
import { SlidePreview } from '../components/Presentation/SlidePreview'
import { getThemeById } from '../data/themes'
import { applyPresetToSlides, presetToTheme } from '../utils/themePreset'

type Phase = 'prompt' | 'outline-review' | 'generating' | 'editor'
type CreateMode = 'prompt' | 'topic'

interface StreamProgress {
  step: string
  done: number
  total: number
  preview: Slide[]
  /** Optional secondary line, e.g. counts or recent source titles. */
  detail?: string
}

// Fixed panel widths — canvas scale is stable regardless of block selection
const LEFT_W  = 192  // slide thumbnail strip
const RIGHT_W = 264  // property panel
const CANVAS_PAD = 56

export function CreatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  // Allow the dashboard quick-input to pre-fill the prompt via ?prompt=…
  const defaultPrompt = useMemo(() => searchParams.get('prompt') ?? '', [searchParams])

  const [phase, setPhase]                   = useState<Phase>('prompt')
  const [slides, setSlides]                 = useState<Slide[]>([])
  const [theme, setTheme]                   = useState<Theme | null>(null)
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0)
  const [selectedBlockId, setSelectedBlockId]       = useState<string | null>(null)
  const [editingBlockId, setEditingBlockId]         = useState<string | null>(null)
  const [saving, setSaving]                 = useState(false)
  const [error, setError]                   = useState<string | null>(null)
  const [streamProgress, setStreamProgress] = useState<StreamProgress | null>(null)
  const [mode, setMode]                     = useState<CreateMode>('prompt')
  const [generatedTokenCount, setGeneratedTokenCount] = useState<number | null>(null)

  // Outline-review flow state — preserved between phases so user can go back.
  const [pendingPrompt, setPendingPrompt] = useState<{
    prompt: string
    slideCount: number
    file?: File
    url?: string
    images?: File[]
    level: 'simple' | 'advanced'
  } | null>(null)
  const [outlineSlides, setOutlineSlides] = useState<OutlineSlide[]>([])
  const [outlineDeckTitle, setOutlineDeckTitle] = useState('')
  const [chosenPresetId, setChosenPresetId] = useState<string>('vortex')

  const handleGenerate = async (
    prompt: string,
    slideCount: number,
    file?: File,
    url?: string,
    images?: File[],
    level?: 'simple' | 'advanced',
    reviewOutline?: boolean,
    themePresetId?: string,
  ) => {
    const normalizedLevel = level ?? 'simple'
    if (themePresetId) setChosenPresetId(themePresetId)

    // Outline-first flow: fetch the outline, show review screen, then continue.
    if (reviewOutline) {
      setError(null)
      setPhase('generating')
      setStreamProgress({ step: 'Building outline…', done: 0, total: slideCount, preview: [] })
      try {
        const res = await generationApi.generateOutline(
          prompt, slideCount, file, url, images, normalizedLevel,
        )
        setPendingPrompt({ prompt, slideCount: res.data.slides.length, file, url, images, level: normalizedLevel })
        setOutlineSlides(res.data.slides as OutlineSlide[])
        setOutlineDeckTitle(res.data.deck_title)
        setStreamProgress(null)
        setPhase('outline-review')
      } catch (e: any) {
        setError(e?.response?.data?.detail ?? e?.message ?? 'Outline generation failed.')
        setStreamProgress(null)
        setPhase('prompt')
      }
      return
    }

    await runStreamGeneration(prompt, slideCount, file, url, images, normalizedLevel, undefined, themePresetId)
  }

  // Consume an SSE generation stream and update UI state as events arrive.
  // Shared by the auto-outline flow and the user-confirmed-outline flow.
  const runStreamGeneration = async (
    prompt: string,
    slideCount: number,
    file?: File,
    url?: string,
    images?: File[],
    level: 'simple' | 'advanced' = 'simple',
    outline?: OutlineSlide[],
    presetIdOverride?: string,
  ) => {
    setPhase('generating')
    setError(null)
    setGeneratedTokenCount(null)
    setStreamProgress({ step: 'Starting…', done: 0, total: slideCount, preview: [] })

    try {
      const response = await generationApi.generateStream(prompt, slideCount, file, url, images, level, outline)
      if (!response.ok || !response.body) {
        const text = await response.text().catch(() => '')
        throw new Error(text || `Stream failed (${response.status})`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      const collected: Slide[] = []
      let collectedTheme: Theme | null = null
      let tokenCount: number | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        // Parse complete SSE events from buffer (\n\n delimited)
        const events = buffer.split('\n\n')
        buffer = events.pop() ?? ''

        for (const raw of events) {
          if (!raw.trim()) continue
          const lines = raw.split('\n')
          const eventLine = lines.find((l) => l.startsWith('event:'))
          const dataLine = lines.find((l) => l.startsWith('data:'))
          if (!eventLine || !dataLine) continue
          const evt = eventLine.slice(6).trim()
          const data = JSON.parse(dataLine.slice(5).trim())

          if (evt === 'status') {
            setStreamProgress((prev) => prev ? { ...prev, step: data.message } : prev)
          } else if (evt === 'theme') {
            collectedTheme = data
            setTheme(data)
          } else if (evt === 'outline') {
            setStreamProgress((prev) => prev ? { ...prev, total: data.slide_count, step: 'Drafting slides…' } : prev)
          } else if (evt === 'slide') {
            collected.push(data.slide)
            setSlides([...collected])
            setStreamProgress((prev) => prev ? {
              ...prev,
              done: data.index + 1,
              total: data.total,
              step: `Slide ${data.index + 1} of ${data.total}`,
              preview: [...collected],
            } : prev)
          } else if (evt === 'slide_image') {
            const slideIdx = data.index
            const imgBlock = data.block
            if (collected[slideIdx] && imgBlock) {
              collected[slideIdx] = {
                ...collected[slideIdx],
                blocks: [...collected[slideIdx].blocks, imgBlock],
              }
              setSlides([...collected])
            }
          } else if (evt === 'error') {
            throw new Error(data.message || 'Generation failed')
          } else if (evt === 'complete') {
            tokenCount = typeof data.token_count === 'number' ? data.token_count : null
          }
        }
      }

      if (collected.length === 0) {
        throw new Error('Stream ended without producing any slides. Try again, or simplify the prompt.')
      }
      if (!collectedTheme) {
        // We got slides but no theme — fall back to the default Vortex preset.
        const fallbackTheme = presetToTheme(getThemeById('vortex'))
        collectedTheme = fallbackTheme
        setTheme(fallbackTheme)
      }
      // If the user picked a non-default theme on the create screen, re-color
      // all slides to match that preset before entering the editor. Always
      // prefer the value passed directly into this call (presetIdOverride)
      // over the state, since state updates from handleGenerate are async
      // and the closure here would see the stale default otherwise.
      const effectivePresetId = presetIdOverride ?? chosenPresetId
      const preset = getThemeById(effectivePresetId)
      if (preset && preset.id !== 'vortex') {
        const restyled = applyPresetToSlides(collected, preset)
        setSlides(restyled)
        setTheme(presetToTheme(preset))
        setChosenPresetId(effectivePresetId)  // keep state in sync for handleSave's localStorage write
      }
      setSelectedSlideIndex(0)
      setSelectedBlockId(null)
      setEditingBlockId(null)
      setGeneratedTokenCount(tokenCount)
      setStreamProgress(null)
      setPhase('editor')
    } catch (e: any) {
      setError(e?.message ?? e?.response?.data?.detail ?? 'Generation failed. Please try again.')
      setStreamProgress(null)
      setPhase('prompt')
    }
  }

  const handleConfirmOutline = async (edited: OutlineSlide[]) => {
    if (!pendingPrompt) return
    await runStreamGeneration(
      pendingPrompt.prompt,
      edited.length,
      pendingPrompt.file,
      pendingPrompt.url,
      pendingPrompt.images,
      pendingPrompt.level,
      edited,
      chosenPresetId,  // by this point setChosenPresetId has committed from handleGenerate
    )
  }

  const handleGenerateTopic = async (
    topic: string,
    audience: string,
    style: string,
    slideCount: number,
    depth: ResearchDepth,
    level: 'simple' | 'advanced' = 'simple',
  ) => {
    setPhase('generating')
    setError(null)
    setGeneratedTokenCount(null)
    setStreamProgress({ step: 'Searching news…', done: 0, total: slideCount, preview: [] })

    try {
      const form = new FormData()
      form.append('topic', topic)
      form.append('audience', audience)
      form.append('style', style)
      form.append('slide_count', String(slideCount))
      form.append('depth', depth)
      form.append('level', level)

      const token = localStorage.getItem('access_token')
      const response = await fetch(`${BASE_URL}/api/v1/generate/topic`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
      if (!response.ok || !response.body) {
        const text = await response.text().catch(() => '')
        throw new Error(text || `Stream failed (${response.status})`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      const collected: Slide[] = []
      let collectedTheme: Theme | null = null
      let tokenCount: number | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() ?? ''

        for (const raw of events) {
          if (!raw.trim()) continue
          const lines = raw.split('\n')
          const eventLine = lines.find((l) => l.startsWith('event:'))
          const dataLine = lines.find((l) => l.startsWith('data:'))
          if (!eventLine || !dataLine) continue
          const evt = eventLine.slice(6).trim()
          const data = JSON.parse(dataLine.slice(5).trim())

          if (evt === 'status') {
            setStreamProgress((prev) => prev ? { ...prev, step: data.message } : prev)
          } else if (evt === 'search_results') {
            const titles = (data.sources ?? []).slice(0, 3).map((s: any) => s.source).join(' · ')
            setStreamProgress((prev) => prev ? {
              ...prev,
              detail: `Found ${data.count} articles${titles ? ' · ' + titles : ''}`,
            } : prev)
          } else if (evt === 'extracted') {
            setStreamProgress((prev) => prev ? {
              ...prev,
              detail: `Read ${data.succeeded} of ${data.requested} articles`,
            } : prev)
          } else if (evt === 'warning') {
            // Surface but don't abort
            console.warn('[topic-gen]', data.message)
          } else if (evt === 'research') {
            setStreamProgress((prev) => prev ? { ...prev, detail: 'Research synthesized' } : prev)
          } else if (evt === 'theme') {
            collectedTheme = data
            setTheme(data)
          } else if (evt === 'outline') {
            setStreamProgress((prev) => prev ? { ...prev, total: data.slide_count, step: 'Drafting slides…' } : prev)
          } else if (evt === 'slide') {
            collected.push(data.slide)
            setSlides([...collected])
            setStreamProgress((prev) => prev ? {
              ...prev,
              done: data.index + 1,
              total: data.total,
              step: `Slide ${data.index + 1} of ${data.total}`,
              preview: [...collected],
            } : prev)
          } else if (evt === 'slide_image') {
            const slideIdx = data.index
            const imgBlock = data.block
            if (collected[slideIdx] && imgBlock) {
              collected[slideIdx] = {
                ...collected[slideIdx],
                blocks: [...collected[slideIdx].blocks, imgBlock],
              }
              setSlides([...collected])
            }
          } else if (evt === 'error') {
            throw new Error(data.message || 'Generation failed')
          } else if (evt === 'complete') {
            tokenCount = typeof data.token_count === 'number' ? data.token_count : null
          }
        }
      }

      if (collected.length === 0) {
        throw new Error('Stream ended without producing any slides. Try again, or simplify the prompt.')
      }
      if (!collectedTheme) {
        // We got slides but no theme — fall back to the default Vortex preset.
        const fallbackTheme = presetToTheme(getThemeById('vortex'))
        collectedTheme = fallbackTheme
        setTheme(fallbackTheme)
      }
      // If the user picked a non-default theme on the create screen, re-color
      // all slides to match that preset before entering the editor. Always
      // prefer the value passed directly into this call (presetIdOverride)
      // over the state, since state updates from handleGenerate are async
      // and the closure here would see the stale default otherwise.
      const effectivePresetId = chosenPresetId
      const preset = getThemeById(effectivePresetId)
      if (preset && preset.id !== 'vortex') {
        const restyled = applyPresetToSlides(collected, preset)
        setSlides(restyled)
        setTheme(presetToTheme(preset))
        setChosenPresetId(effectivePresetId)  // keep state in sync for handleSave's localStorage write
      }
      setSelectedSlideIndex(0)
      setSelectedBlockId(null)
      setEditingBlockId(null)
      setGeneratedTokenCount(tokenCount)
      setStreamProgress(null)
      setPhase('editor')
    } catch (e: any) {
      setError(e?.message ?? e?.response?.data?.detail ?? 'Generation failed. Please try again.')
      setStreamProgress(null)
      setPhase('prompt')
    }
  }

  const handleBlockClick = useCallback((blockId: string) => {
    if (!blockId) {
      setSelectedBlockId(null)
      setEditingBlockId(null)
      return
    }
    setSelectedBlockId(blockId)
    setEditingBlockId(null)
  }, [])

  const handleBlockDoubleClick = useCallback((blockId: string) => {
    setSelectedBlockId(blockId)
    setEditingBlockId(blockId)
  }, [])

  const handleBlockContentChange = useCallback(
    (blockId: string, newContent: string) => {
      setSlides((prev) =>
        prev.map((slide, idx) => {
          if (idx !== selectedSlideIndex) return slide
          return {
            ...slide,
            blocks: slide.blocks.map((b) =>
              b.id === blockId ? { ...b, content: newContent } : b,
            ),
          }
        }),
      )
    },
    [selectedSlideIndex],
  )

  const handleBlockPanelChange = useCallback(
    (patch: Partial<Block>) => {
      if (!selectedBlockId) return
      setSlides((prev) =>
        prev.map((slide, idx) => {
          if (idx !== selectedSlideIndex) return slide
          return {
            ...slide,
            blocks: slide.blocks.map((b) => {
              if (b.id !== selectedBlockId) return b
              return {
                ...b,
                ...(patch.content  !== undefined ? { content: patch.content }                               : {}),
                ...(patch.styling  !== undefined ? { styling: { ...b.styling, ...patch.styling } }          : {}),
              }
            }),
          }
        }),
      )
    },
    [selectedBlockId, selectedSlideIndex],
  )

  const handleSave = async () => {
    if (!theme || slides.length === 0) return
    setSaving(true)
    try {
      const titleBlock = slides[0]?.blocks.find((b) => b.type === 'title' || b.type === 'heading')
      const title = titleBlock?.content?.split('\n')[0] || 'My Presentation'
      const res = await presentationsApi.create({
        title,
        slides: slides as object[],
        theme_id: theme.id,
        token_count: generatedTokenCount ?? undefined,
      })
      // Persist the chosen theme preset so the editor page picks it up.
      // PresentationPage reads localStorage `theme_preset_{id}` on load.
      try {
        localStorage.setItem(`theme_preset_${res.data.id}`, chosenPresetId)
      } catch {
        // localStorage failures are non-fatal; the deck still loads, just with default theme.
      }
      navigate(`/presentations/${res.data.id}`)
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (phase === 'outline-review') {
    return (
      <>
        {error && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-5 py-3 rounded-xl text-sm shadow-lg">
            {error}
          </div>
        )}
        <OutlineReviewScreen
          deckTitle={outlineDeckTitle}
          initialSlides={outlineSlides}
          onBack={() => { setPhase('prompt'); setError(null) }}
          onConfirm={handleConfirmOutline}
        />
      </>
    )
  }

  if (phase === 'prompt' || phase === 'generating') {
    return (
      <>
        {error && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-5 py-3 rounded-xl text-sm shadow-lg">
            {error}
          </div>
        )}
        {phase === 'generating' && streamProgress && (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 40,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(15,15,20,0.92)', backdropFilter: 'blur(12px)',
            }}
          >
            <div style={{ width: 420, textAlign: 'center' }}>
              <p style={{ fontSize: 11, letterSpacing: 0.6, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
                Generating
              </p>
              <h2 style={{ fontSize: 22, color: '#fff', fontWeight: 600, margin: '0 0 18px 0' }}>
                {streamProgress.step}
              </h2>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
                <div
                  style={{
                    height: '100%',
                    width: `${streamProgress.total > 0 ? (streamProgress.done / streamProgress.total) * 100 : 5}%`,
                    background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                    transition: 'width 200ms ease',
                  }}
                />
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                {streamProgress.done} of {streamProgress.total} slides ready
              </p>
              {streamProgress.detail && (
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '6px 0 0 0' }}>
                  {streamProgress.detail}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Mode toggle — hidden during generation */}
        {phase === 'prompt' && (
          <div
            style={{
              position: 'fixed', top: 14, left: '50%', transform: 'translateX(-50%)',
              zIndex: 25, display: 'flex', gap: 4,
              background: 'var(--surface)', border: '1px solid var(--line)',
              borderRadius: 999, padding: 3,
            }}
          >
            {(['prompt', 'topic'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                  background: mode === m ? 'var(--ink-strong)' : 'transparent',
                  color: mode === m ? '#fff' : 'var(--ink-soft)',
                  border: 'none', cursor: 'pointer',
                }}
              >
                {m === 'prompt' ? 'Prompt' : 'Current topic'}
              </button>
            ))}
          </div>
        )}

        {mode === 'prompt' ? (
          <PromptScreen onGenerate={handleGenerate} isGenerating={phase === 'generating'} defaultPrompt={defaultPrompt} />
        ) : (
          <TopicScreen onGenerate={handleGenerateTopic} isGenerating={phase === 'generating'} />
        )}
      </>
    )
  }

  const currentSlide = slides[selectedSlideIndex]
  const selectedBlock = currentSlide?.blocks.find((b) => b.id === selectedBlockId) ?? null

  if (!currentSlide || !theme) return null

  const presentationTitle =
    slides[0]?.blocks.find((b) => b.type === 'title' || b.type === 'heading')?.content?.split('\n')[0] || 'Untitled'

  // Fixed scale — doesn't jump when panel opens/closes
  const availableW = window.innerWidth - LEFT_W - RIGHT_W - CANVAS_PAD
  const previewScale = Math.min(Math.max(availableW / 1280, 0.35), 0.88)

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#0b1120' }}>

      {/* ── TOP BAR ─────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-5 flex-shrink-0"
        style={{ height: 52, borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#0d1526' }}
      >
        {/* Left: title */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          </div>
          <span className="text-white text-sm font-medium truncate max-w-xs">{presentationTitle}</span>
          <span
            className="text-[11px] px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}
          >
            {slides.length} slides
          </span>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}
          >
            <Play size={13} />
            Present
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: saving ? '#4338ca' : 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
          >
            <Save size={13} />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* ── MAIN 3-COLUMN AREA ──────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT — Slide strip */}
        <div
          className="flex-shrink-0 flex flex-col overflow-hidden"
          style={{ width: LEFT_W, borderRight: '1px solid rgba(255,255,255,0.07)', background: '#0d1526' }}
        >
          <OutlinePanel
            slides={slides}
            theme={theme}
            selectedIndex={selectedSlideIndex}
            onSelect={(idx) => {
              setSelectedSlideIndex(idx)
              setSelectedBlockId(null)
              setEditingBlockId(null)
            }}
          />
        </div>

        {/* CENTER — Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Canvas area */}
          <div
            className="flex-1 flex items-center justify-center relative"
            style={{ background: '#070d1a' }}
            onClick={() => { setSelectedBlockId(null); setEditingBlockId(null) }}
          >
            {/* Slide label */}
            <div
              className="absolute top-4 left-1/2 -translate-x-1/2 text-[11px] font-medium px-3 py-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#475569' }}
            >
              Slide {selectedSlideIndex + 1} of {slides.length}
            </div>

            <SlidePreview
              slide={currentSlide}
              theme={theme}
              scale={previewScale}
              selectedBlockId={selectedBlockId}
              editingBlockId={editingBlockId}
              onBlockClick={handleBlockClick}
              onBlockDoubleClick={handleBlockDoubleClick}
              onBlockContentChange={handleBlockContentChange}
            />
          </div>

          {/* Bottom navigation */}
          <div
            className="flex items-center justify-center gap-4 flex-shrink-0"
            style={{ height: 52, borderTop: '1px solid rgba(255,255,255,0.07)', background: '#0d1526' }}
          >
            <button
              onClick={() => { setSelectedSlideIndex((i) => Math.max(0, i - 1)); setSelectedBlockId(null) }}
              disabled={selectedSlideIndex === 0}
              className="p-1.5 rounded-lg transition-all disabled:opacity-25"
              style={{ color: '#64748b' }}
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex gap-1">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => { setSelectedSlideIndex(idx); setSelectedBlockId(null) }}
                  className="rounded-full transition-all"
                  style={{
                    width: idx === selectedSlideIndex ? 20 : 6,
                    height: 6,
                    background: idx === selectedSlideIndex ? '#6366f1' : 'rgba(255,255,255,0.15)',
                  }}
                />
              ))}
            </div>
            <button
              onClick={() => { setSelectedSlideIndex((i) => Math.min(slides.length - 1, i + 1)); setSelectedBlockId(null) }}
              disabled={selectedSlideIndex === slides.length - 1}
              className="p-1.5 rounded-lg transition-all disabled:opacity-25"
              style={{ color: '#64748b' }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* RIGHT — Property panel */}
        <div className="flex-shrink-0 flex flex-col overflow-hidden">
          <BlockEditorPanel
            block={selectedBlock}
            theme={theme}
            onClose={() => { setSelectedBlockId(null); setEditingBlockId(null) }}
            onChange={handleBlockPanelChange}
          />
        </div>

      </div>

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-5 py-3 rounded-xl text-sm shadow-lg">
          {error}
        </div>
      )}
    </div>
  )
}
