import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Paperclip, Sparkles, X, Loader2, ArrowLeft, Mic, Square, Link2 } from 'lucide-react'
import { THEME_PRESETS, type ThemePreset } from '../../data/themes'

export type DeckLevel = 'simple' | 'advanced'

interface Props {
  onGenerate: (
    prompt: string,
    slideCount: number,
    file?: File,
    url?: string,
    images?: File[],
    level?: DeckLevel,
    reviewOutline?: boolean,
    themePresetId?: string,
  ) => void
  isGenerating: boolean
  /** Optional initial prompt — used when the user typed something on the
   *  dashboard quick-input and got navigated here. */
  defaultPrompt?: string
}

/** Gamma-style template cards — each carries category, prompt, palette
 *  preview, and the recommended generation settings (theme + level). */
type TemplateCard = {
  id: string
  category: string
  title: string
  description: string
  prompt: string
  recommendedTheme: string
  recommendedLevel: 'simple' | 'advanced'
  slides: number
  /** Two-tone palette used to render the mini-preview thumbnail. */
  preview: { bg: string; ink: string; accent: string }
}

const TEMPLATES: TemplateCard[] = [
  {
    id: 'sales-pitch',
    category: 'Sales',
    title: 'Investor pitch deck',
    description: 'Problem, solution, traction, ask. Series A to C ready.',
    prompt:
      'A 10-slide Series A pitch for a B2B SaaS startup. Include market opportunity, product, traction metrics, competitive landscape, roadmap, and the ask.',
    recommendedTheme: 'stratos',
    recommendedLevel: 'advanced',
    slides: 10,
    preview: { bg: '#0f172a', ink: '#e2e8f0', accent: '#38bdf8' },
  },
  {
    id: 'board-update',
    category: 'Executive',
    title: 'Board / investor update',
    description: 'Quarterly performance, KPIs, strategic priorities.',
    prompt:
      'Q3 2026 board update for an early-stage company. Cover revenue, customer growth, key wins, headcount, runway, and Q4 priorities.',
    recommendedTheme: 'editorial',
    recommendedLevel: 'advanced',
    slides: 8,
    preview: { bg: '#faf8f3', ink: '#1c1b17', accent: '#8b1a1a' },
  },
  {
    id: 'product-launch',
    category: 'Marketing',
    title: 'Product launch deck',
    description: 'Hero story, features, positioning, launch timeline.',
    prompt:
      'Product launch deck for a new mobile app. Include the problem we solve, key features, target users, pricing, launch timeline, and marketing plan.',
    recommendedTheme: 'brutalist',
    recommendedLevel: 'advanced',
    slides: 8,
    preview: { bg: '#fff9e6', ink: '#000000', accent: '#ffd60a' },
  },
  {
    id: 'qbr',
    category: 'Customer Success',
    title: 'Customer quarterly review',
    description: 'Account health, usage, outcomes, expansion path.',
    prompt:
      'Customer success quarterly business review. Cover account health, product adoption, key outcomes achieved, support escalations, and the renewal/expansion plan.',
    recommendedTheme: 'mercury',
    recommendedLevel: 'simple',
    slides: 7,
    preview: { bg: '#f9fafb', ink: '#111827', accent: '#6b7280' },
  },
  {
    id: 'team-allhands',
    category: 'Internal',
    title: 'Team all-hands',
    description: 'Wins, OKR progress, what changed, what is next.',
    prompt:
      'Monthly engineering team all-hands. Cover wins from this month, OKR progress, team headcount changes, upcoming releases, and what we are stopping doing.',
    recommendedTheme: 'forest',
    recommendedLevel: 'simple',
    slides: 6,
    preview: { bg: '#0f2419', ink: '#f5f1e8', accent: '#10b981' },
  },
  {
    id: 'workshop',
    category: 'Education',
    title: 'Workshop / training',
    description: 'Concept → example → exercise → recap.',
    prompt:
      'Workshop deck teaching the fundamentals of prompt engineering for product managers. Include intro, 4 core concepts with examples, hands-on exercises, and a recap.',
    recommendedTheme: 'nova',
    recommendedLevel: 'simple',
    slides: 10,
    preview: { bg: '#f8f4ff', ink: '#4c1d95', accent: '#7c3aed' },
  },
]

const SLIDE_OPTIONS = [5, 7, 10, 12, 15, 20]

const SLIDE_MIN = 1
const SLIDE_MAX = 30

// Words → numbers for "ten slides", "twenty slides", etc.
const WORD_TO_NUM: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  'twenty-five': 25, thirty: 30,
}

const NUM = `(\\d+|${Object.keys(WORD_TO_NUM).join('|')})`
const toNum = (s: string): number =>
  /^\d+$/.test(s) ? parseInt(s, 10) : WORD_TO_NUM[s.toLowerCase()] ?? NaN
const clamp = (n: number) => Math.max(SLIDE_MIN, Math.min(SLIDE_MAX, Math.round(n)))

/**
 * Extract a slide count intent from free-text. Returns null when the user
 * didn't specify a number — caller should fall back to the dropdown value.
 *
 * Priority (first match wins):
 *   exactly N slides     → N
 *   range N–M / between  → M (upper bound)
 *   at least / minimum N → N
 *   at most / up to / maximum N → N
 *   N slides / N-slide   → N
 *   "I need/want N"      → N (only if "slide"/"page" mentioned nearby)
 */
function parseSlideCountFromPrompt(text: string): number | null {
  if (!text) return null
  const t = text.toLowerCase()

  // exactly N
  const exact = t.match(new RegExp(`\\bexactly\\s+${NUM}\\b`))
  if (exact) return clamp(toNum(exact[1]))

  // between N and M  |  N-M slides  |  N to M slides
  const range =
    t.match(new RegExp(`\\bbetween\\s+${NUM}\\s+(?:and|to|-)\\s+${NUM}\\b`)) ||
    t.match(new RegExp(`\\b${NUM}\\s*(?:-|–|to)\\s*${NUM}\\s+(?:slides?|pages?)\\b`))
  if (range) {
    const a = toNum(range[1])
    const b = toNum(range[2])
    if (!isNaN(a) && !isNaN(b)) return clamp(Math.max(a, b))
  }

  // at least / minimum / no less than
  const min = t.match(new RegExp(`\\b(?:at\\s+least|minimum(?:\\s+of)?|no\\s+less\\s+than|>=)\\s+${NUM}\\b`))
  if (min) return clamp(toNum(min[1]))

  // at most / up to / maximum / no more than
  const max = t.match(new RegExp(`\\b(?:at\\s+most|up\\s+to|maximum(?:\\s+of)?|no\\s+more\\s+than|<=)\\s+${NUM}\\b`))
  if (max) return clamp(toNum(max[1]))

  // "N slides" / "N-slide" / "N pages"
  const fixed = t.match(new RegExp(`\\b${NUM}[-\\s]+(?:slides?|pages?)\\b`))
  if (fixed) return clamp(toNum(fixed[1]))

  // "make/create/generate/give me/i need/i want N ..." (only if slides/pages mentioned anywhere)
  if (/\b(?:slides?|pages?)\b/.test(t)) {
    const intent = t.match(
      new RegExp(`\\b(?:i\\s+(?:need|want|would\\s+like)|need|want|make|create|generate|give\\s+me|build)\\s+${NUM}\\b`),
    )
    if (intent) {
      const n = toNum(intent[1])
      if (!isNaN(n)) return clamp(n)
    }
  }

  return null
}

export function PromptScreen({ onGenerate, isGenerating, defaultPrompt }: Props) {
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState(defaultPrompt ?? '')
  const [slideCount, setSlideCount] = useState(5)
  const [file, setFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<File[]>([])
  const imagesRef = useRef<HTMLInputElement>(null)
  const [level, setLevel] = useState<DeckLevel>('simple')
  const [themePresetId, setThemePresetId] = useState<string>('vortex')

  const [urlOpen, setUrlOpen] = useState(false)
  const [urlValue, setUrlValue] = useState('')
  const [urlAttached, setUrlAttached] = useState<string | null>(null)
  const [urlError, setUrlError] = useState('')

  const isValidHttpUrl = (s: string) => {
    try {
      const u = new URL(s)
      return u.protocol === 'http:' || u.protocol === 'https:'
    } catch {
      return false
    }
  }

  const attachUrl = () => {
    const trimmed = urlValue.trim()
    if (!isValidHttpUrl(trimmed)) {
      setUrlError('Enter a valid http(s) URL.')
      return
    }
    setUrlError('')
    setUrlAttached(trimmed)
    setUrlOpen(false)
  }

  const clearUrl = () => {
    setUrlAttached(null)
    setUrlValue('')
    setUrlError('')
  }

  // ── Voice transcription (Web Speech API) ────────────────────────
  const SR: any =
    typeof window !== 'undefined'
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null
  const speechSupported = !!SR
  const [listening, setListening] = useState(false)
  const [voiceError, setVoiceError] = useState('')
  const recognitionRef = useRef<any>(null)
  const baseTextRef = useRef('')

  useEffect(() => () => recognitionRef.current?.stop(), [])

  const startListening = () => {
    if (!SR) return
    try {
      const rec = new SR()
      rec.lang = navigator.language || 'en-US'
      rec.continuous = true
      rec.interimResults = true

      baseTextRef.current = prompt ? prompt.trimEnd() + (prompt.trimEnd() ? ' ' : '') : ''

      rec.onresult = (e: any) => {
        let final = ''
        let interim = ''
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i]
          if (r.isFinal) final += r[0].transcript
          else interim += r[0].transcript
        }
        if (final) baseTextRef.current += final
        setPrompt(baseTextRef.current + interim)
      }
      rec.onerror = (e: any) => {
        setListening(false)
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          setVoiceError('Microphone permission denied.')
        } else if (e.error !== 'aborted' && e.error !== 'no-speech') {
          setVoiceError('Could not transcribe — try again.')
        }
      }
      rec.onend = () => setListening(false)

      recognitionRef.current = rec
      setVoiceError('')
      setListening(true)
      rec.start()
    } catch {
      setListening(false)
      setVoiceError('Voice input is not available.')
    }
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  const toggleListening = () => (listening ? stopListening() : startListening())

  const canSubmit =
    (prompt.trim().length > 0 || file !== null || !!urlAttached || images.length > 0) && !isGenerating

  const promptSlideCount = parseSlideCountFromPrompt(prompt)
  const promptOverridesDropdown =
    promptSlideCount !== null && promptSlideCount !== slideCount

  const handleSubmit = () => {
    if (!canSubmit) return
    if (listening) stopListening()
    const fallbackPrompt =
      prompt.trim() ||
      (file ? `Create a presentation about ${file.name}` : '') ||
      (urlAttached ? `Create a presentation summarizing ${urlAttached}` : '') ||
      (images.length > 0 ? `Create a presentation from the attached image${images.length > 1 ? 's' : ''}` : '')
    // Prompt-derived count takes priority over dropdown when the user specified one.
    const parsedCount = parseSlideCountFromPrompt(fallbackPrompt)
    const effectiveSlideCount = parsedCount ?? slideCount
    onGenerate(
      fallbackPrompt,
      effectiveSlideCount,
      file ?? undefined,
      urlAttached ?? undefined,
      images.length > 0 ? images : undefined,
      level,
      false,             // outline review removed for perf
      themePresetId,
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
  }

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{
        background: 'radial-gradient(1200px 600px at 50% -10%, rgba(180,60,40,0.08), transparent 60%), radial-gradient(900px 500px at 90% 100%, rgba(180,60,40,0.05), transparent 65%), var(--paper)',
      }}
    >
      <style>{`@keyframes wac-mic-pulse { 0%,100% { opacity: 0.35; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.15); } } @keyframes wac-fade-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } } .wac-fade-up { animation: wac-fade-up 0.5s ease-out both; }`}</style>

      {/* Decorative grain / dot pattern */}
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(10,9,7,0.04) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 75%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top bar */}
      <div
        className="flex items-center justify-between px-10 h-14 relative z-10"
        style={{ borderBottom: '1px solid var(--line)', backdropFilter: 'blur(8px)', background: 'rgba(245,242,235,0.6)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 h-9 rounded-full text-[13px] transition-colors"
          style={{ color: 'var(--ink)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(10,9,7,0.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <p className="eyebrow">— New Presentation</p>
        <div className="w-[80px]" />
      </div>

      {/* Center column */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-[720px] wac-fade-up">
          {/* Editorial heading */}
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 mb-5 px-3 h-7 rounded-full" style={{ background: 'rgba(180,60,40,0.08)', border: '1px solid rgba(180,60,40,0.18)' }}>
              <Sparkles size={11} style={{ color: 'var(--accent)' }} />
              <span className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: 'var(--accent)' }}>
                AI Deck Studio
              </span>
            </div>
            <h1
              className="font-serif leading-[1.0] tracking-tightest text-[44px] md:text-[64px]"
              style={{ color: 'var(--ink-strong)' }}
            >
              What's the
              <br />
              <span className="font-serif-italic" style={{ color: 'var(--accent)' }}>deck about?</span>
            </h1>
            <p
              className="text-[15px] mt-6 max-w-md mx-auto leading-relaxed"
              style={{ color: 'var(--ink-soft)' }}
            >
              Describe what you want to present, or attach a document. AI handles the rest.
            </p>
          </div>

          {/* Prompt card */}
          <div
            className="rounded-3xl overflow-hidden relative"
            style={{
              background: 'linear-gradient(180deg, var(--surface) 0%, var(--paper-2) 100%)',
              border: '1px solid var(--line)',
              boxShadow:
                '0 1px 1px rgba(15,14,12,0.04), 0 4px 12px -4px rgba(15,14,12,0.06), 0 24px 60px -16px rgba(15,14,12,0.18), inset 0 1px 0 rgba(255,255,255,0.6)',
            }}
          >
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="A pitch deck for Acme Corp's new B2B analytics platform launching in Q3…"
              disabled={isGenerating}
              rows={5}
              className="w-full p-7 text-[15px] resize-none outline-none leading-relaxed font-sans"
              style={{ color: 'var(--ink-strong)', background: 'transparent' }}
            />

            {/* Attached chips */}
            {(file || urlAttached || images.length > 0) && (
              <div className="mx-7 mb-4 flex flex-wrap items-center gap-2">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-2 h-8 px-3 rounded-full"
                    style={{ background: 'var(--paper-2)', border: '1px solid var(--line)' }}
                  >
                    <Paperclip size={11} style={{ color: 'var(--ink-soft)' }} />
                    <span className="text-[12px] truncate max-w-[160px]" style={{ color: 'var(--ink-strong)' }}>
                      {img.name}
                    </span>
                    <button
                      onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                      className="ml-1 transition-colors"
                      style={{ color: 'var(--ink-muted)' }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
                {file && (
                  <div
                    className="inline-flex items-center gap-2 h-8 px-3 rounded-full"
                    style={{ background: 'var(--paper-2)', border: '1px solid var(--line)' }}
                  >
                    <Paperclip size={11} style={{ color: 'var(--ink-soft)' }} />
                    <span className="text-[12px] truncate max-w-[200px]" style={{ color: 'var(--ink-strong)' }}>
                      {file.name}
                    </span>
                    <button
                      onClick={() => setFile(null)}
                      className="ml-1 transition-colors"
                      style={{ color: 'var(--ink-muted)' }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                )}
                {urlAttached && (
                  <div
                    className="inline-flex items-center gap-2 h-8 px-3 rounded-full"
                    style={{ background: 'var(--paper-2)', border: '1px solid var(--line)' }}
                  >
                    <Link2 size={11} style={{ color: 'var(--ink-soft)' }} />
                    <span className="text-[12px] truncate max-w-[260px]" style={{ color: 'var(--ink-strong)' }}>
                      {urlAttached}
                    </span>
                    <button
                      onClick={clearUrl}
                      className="ml-1 transition-colors"
                      style={{ color: 'var(--ink-muted)' }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* URL input panel (collapsible) */}
            {urlOpen && (
              <div className="mx-7 mb-4">
                <div
                  className="flex items-center gap-2 h-10 px-3 rounded-xl"
                  style={{ background: 'var(--paper-2)', border: '1px solid var(--line)' }}
                >
                  <Link2 size={13} style={{ color: 'var(--ink-muted)' }} />
                  <input
                    autoFocus
                    type="url"
                    value={urlValue}
                    onChange={(e) => { setUrlValue(e.target.value); if (urlError) setUrlError('') }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); attachUrl() }
                      if (e.key === 'Escape') { setUrlOpen(false); setUrlError('') }
                    }}
                    placeholder="https://example.com/article"
                    disabled={isGenerating}
                    className="flex-1 bg-transparent outline-none text-[13px]"
                    style={{ color: 'var(--ink-strong)' }}
                  />
                  <button
                    onClick={attachUrl}
                    disabled={!urlValue.trim() || isGenerating}
                    className="text-[12px] font-semibold px-3 h-7 rounded-md transition-colors"
                    style={{
                      background: urlValue.trim() ? 'var(--ink-strong)' : 'rgba(10,9,7,0.15)',
                      color: '#fff',
                      cursor: urlValue.trim() ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Attach
                  </button>
                  <button
                    onClick={() => { setUrlOpen(false); setUrlError('') }}
                    className="w-7 h-7 rounded-md flex items-center justify-center"
                    style={{ color: 'var(--ink-muted)' }}
                  >
                    <X size={12} />
                  </button>
                </div>
                {urlError && (
                  <p className="mt-1.5 text-[11.5px]" style={{ color: 'var(--accent, #B43C28)' }}>
                    {urlError}
                  </p>
                )}
                <p className="mt-1.5 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                  We'll fetch the page and use its readable text content as source material.
                </p>
              </div>
            )}

            {/* Theme chip selector — quick visual identity picker */}
            <div
              className="flex items-center gap-2 px-5 py-2.5 overflow-x-auto"
              style={{ borderTop: '1px solid var(--line)', background: 'var(--surface)' }}
            >
              <span className="eyebrow flex-shrink-0">Theme</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {THEME_PRESETS.map((t: ThemePreset) => {
                  const active = themePresetId === t.id
                  return (
                    <button
                      key={t.id}
                      onClick={() => setThemePresetId(t.id)}
                      disabled={isGenerating}
                      title={t.name}
                      className="flex items-center gap-1.5 h-7 px-2 rounded-full transition-all"
                      style={{
                        background: active ? 'var(--ink-strong)' : 'transparent',
                        color: active ? '#fff' : 'var(--ink-soft)',
                        border: `1px solid ${active ? 'var(--ink-strong)' : 'var(--line)'}`,
                      }}
                    >
                      {/* mini palette swatch */}
                      <span
                        style={{
                          width: 12, height: 12, borderRadius: 3,
                          background: t.colors.background,
                          border: `1px solid ${t.colors.heading}33`,
                          display: 'inline-block',
                          position: 'relative',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        <span style={{
                          position: 'absolute', right: 0, top: 0, bottom: 0, width: 5,
                          background: t.colors.accent,
                        }} />
                      </span>
                      <span className="text-[11px] font-semibold whitespace-nowrap">{t.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Toolbar */}
            <div
              className="flex items-center justify-between px-5 py-3 gap-3 flex-wrap"
              style={{ borderTop: '1px solid var(--line)', background: 'var(--surface-2)' }}
            >
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 text-[12.5px] font-medium transition-colors h-8 px-2.5 rounded-lg"
                  style={{ color: 'var(--ink-soft)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(10,9,7,0.06)'
                    e.currentTarget.style.color = 'var(--ink-strong)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--ink-soft)'
                  }}
                >
                  <Paperclip size={13} />
                  Attach
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".txt,.docx,.pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />

                <button
                  onClick={() => imagesRef.current?.click()}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 text-[12.5px] font-medium transition-colors h-8 px-2.5 rounded-lg"
                  style={{ color: 'var(--ink-soft)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(10,9,7,0.06)'
                    e.currentTarget.style.color = 'var(--ink-strong)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--ink-soft)'
                  }}
                >
                  <Paperclip size={13} />
                  Images
                  {images.length > 0 && (
                    <span style={{ fontSize: 10, marginLeft: 2, color: 'var(--ink-muted)' }}>
                      ({images.length})
                    </span>
                  )}
                </button>
                <input
                  ref={imagesRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const next = Array.from(e.target.files ?? []).slice(0, 4)
                    setImages(next)
                  }}
                />

                <span className="w-px h-4" style={{ background: 'var(--line)' }} />
                <button
                  onClick={() => { setUrlOpen((o) => !o); setUrlError('') }}
                  disabled={isGenerating}
                  aria-pressed={urlOpen}
                  className="flex items-center gap-1.5 text-[12.5px] font-medium transition-colors h-8 px-2.5 rounded-lg"
                  style={{
                    color: urlOpen || urlAttached ? 'var(--ink-strong)' : 'var(--ink-soft)',
                    background: urlOpen ? 'rgba(10,9,7,0.06)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!urlOpen) {
                      e.currentTarget.style.background = 'rgba(10,9,7,0.06)'
                      e.currentTarget.style.color = 'var(--ink-strong)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!urlOpen) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = urlAttached ? 'var(--ink-strong)' : 'var(--ink-soft)'
                    }
                  }}
                >
                  <Link2 size={13} />
                  From URL
                </button>

                {speechSupported && (
                  <>
                    <span className="w-px h-4" style={{ background: 'var(--line)' }} />
                    <button
                      onClick={toggleListening}
                      disabled={isGenerating}
                      title={listening ? 'Stop voice input' : 'Voice input (Web Speech API)'}
                      aria-pressed={listening}
                      className="flex items-center gap-1.5 text-[12.5px] font-medium transition-colors h-8 px-2.5 rounded-lg"
                      style={{
                        color: listening ? '#fff' : 'var(--ink-soft)',
                        background: listening ? 'var(--accent, #B43C28)' : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (!listening) {
                          e.currentTarget.style.background = 'rgba(10,9,7,0.06)'
                          e.currentTarget.style.color = 'var(--ink-strong)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!listening) {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = 'var(--ink-soft)'
                        }
                      }}
                    >
                      {listening ? (
                        <>
                          <Square size={11} fill="currentColor" />
                          <span className="flex items-center gap-1">
                            Listening
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: '#fff',
                                animation: 'wac-mic-pulse 1.1s ease-in-out infinite',
                              }}
                            />
                          </span>
                        </>
                      ) : (
                        <>
                          <Mic size={13} />
                          Voice
                        </>
                      )}
                    </button>
                  </>
                )}

                <span className="w-px h-4" style={{ background: 'var(--line)' }} />

                <div
                  className="inline-flex items-center rounded-lg p-0.5"
                  style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}
                  title="Simple = text-driven slides. Advanced = adds charts, stats, timelines, process diagrams, and image placeholders."
                >
                  {(['simple', 'advanced'] as const).map((lv) => (
                    <button
                      key={lv}
                      onClick={() => setLevel(lv)}
                      disabled={isGenerating}
                      className="text-[11.5px] font-semibold px-2.5 h-6 rounded-[5px] transition-colors capitalize"
                      style={{
                        background: level === lv ? 'var(--ink-strong)' : 'transparent',
                        color: level === lv ? '#fff' : 'var(--ink-soft)',
                      }}
                    >
                      {lv}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="eyebrow">Slides</span>
                  <select
                    value={slideCount}
                    onChange={(e) => setSlideCount(Number(e.target.value))}
                    disabled={isGenerating || promptSlideCount !== null}
                    title={
                      promptSlideCount !== null
                        ? `Using ${promptSlideCount} from your prompt`
                        : undefined
                    }
                    className="text-[12.5px] font-semibold rounded-lg px-2 py-1 outline-none cursor-pointer"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--line)',
                      color: 'var(--ink-strong)',
                      opacity: promptSlideCount !== null ? 0.5 : 1,
                    }}
                  >
                    {SLIDE_OPTIONS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  {promptOverridesDropdown && (
                    <span
                      className="text-[11px] font-medium"
                      style={{ color: 'var(--accent)' }}
                      title="Detected from your prompt — overrides the dropdown"
                    >
                      → {promptSlideCount}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex items-center gap-2 h-11 px-6 rounded-full text-[13px] font-semibold transition-all"
                style={{
                  background: canSubmit
                    ? 'linear-gradient(135deg, var(--ink-strong) 0%, #2A2620 100%)'
                    : 'rgba(10,9,7,0.15)',
                  color: '#fff',
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  boxShadow: canSubmit
                    ? '0 1px 0 rgba(255,255,255,0.1) inset, 0 6px 16px -4px rgba(15,14,12,0.35), 0 2px 4px rgba(15,14,12,0.18)'
                    : 'none',
                  letterSpacing: 0.2,
                }}
                onMouseEnter={(e) => {
                  if (canSubmit) {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,0.1) inset, 0 10px 20px -4px rgba(15,14,12,0.45), 0 3px 6px rgba(15,14,12,0.22)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (canSubmit) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,0.1) inset, 0 6px 16px -4px rgba(15,14,12,0.35), 0 2px 4px rgba(15,14,12,0.18)'
                  }
                }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Generate Presentation
                    <span style={{ opacity: 0.55, marginLeft: 4, fontSize: 11, fontWeight: 600 }}>⌘↵</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {voiceError && (
            <p className="mt-3 text-[12px] text-center" style={{ color: 'var(--accent, #B43C28)' }}>
              {voiceError}
            </p>
          )}

          {/* Templates */}
          <div className="mt-14">
            <div className="flex items-end justify-between mb-5">
              <div>
                <p className="eyebrow mb-1.5">— Templates</p>
                <h2
                  className="font-serif tracking-tight text-[22px] md:text-[26px]"
                  style={{ color: 'var(--ink-strong)' }}
                >
                  Start from a polished base
                </h2>
              </div>
              <span className="text-[12px]" style={{ color: 'var(--ink-muted)' }}>
                Curated for the most common deck shapes
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setPrompt(t.prompt)
                    setThemePresetId(t.recommendedTheme)
                    setLevel(t.recommendedLevel)
                    setSlideCount(t.slides)
                  }}
                  disabled={isGenerating}
                  className="text-left flex flex-col rounded-2xl overflow-hidden transition-all group"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--line)',
                    boxShadow: '0 1px 2px rgba(15,14,12,0.04), 0 4px 12px -6px rgba(15,14,12,0.08)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.borderColor = 'rgba(180,60,40,0.35)'
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(15,14,12,0.04), 0 14px 28px -8px rgba(15,14,12,0.18)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.borderColor = 'var(--line)'
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(15,14,12,0.04), 0 4px 12px -6px rgba(15,14,12,0.08)'
                  }}
                >
                  {/* Mini-slide preview thumbnail */}
                  <div
                    aria-hidden
                    style={{
                      position: 'relative',
                      height: 96,
                      background: t.preview.bg,
                      borderBottom: '1px solid var(--line)',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Side accent strip matching the slide renderer */}
                    <span
                      style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                        background: t.preview.accent,
                      }}
                    />
                    {/* Faux badge */}
                    <span
                      style={{
                        position: 'absolute', left: 14, top: 12,
                        fontSize: 7, fontWeight: 800, letterSpacing: 1.2,
                        color: t.preview.accent,
                        padding: '2px 6px',
                        border: `1px solid ${t.preview.accent}55`,
                        borderRadius: 100,
                        background: `${t.preview.accent}11`,
                      }}
                    >
                      {t.category.toUpperCase()}
                    </span>
                    {/* Faux title */}
                    <div
                      style={{
                        position: 'absolute', left: 14, top: 32, right: 14,
                        height: 8, borderRadius: 2,
                        background: t.preview.ink,
                        opacity: 0.9,
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute', left: 14, top: 44, width: '52%',
                        height: 6, borderRadius: 2,
                        background: t.preview.ink,
                        opacity: 0.55,
                      }}
                    />
                    {/* Faux content blocks — different shapes per template for variety */}
                    {t.id === 'sales-pitch' || t.id === 'product-launch' ? (
                      <>
                        <div style={{ position: 'absolute', left: 14, top: 60, width: 36, height: 22, borderRadius: 4, background: `${t.preview.accent}33`, border: `1px solid ${t.preview.accent}66` }} />
                        <div style={{ position: 'absolute', left: 54, top: 60, width: 36, height: 22, borderRadius: 4, background: `${t.preview.ink}22` }} />
                        <div style={{ position: 'absolute', left: 94, top: 60, width: 36, height: 22, borderRadius: 4, background: `${t.preview.ink}22` }} />
                      </>
                    ) : t.id === 'qbr' || t.id === 'team-allhands' ? (
                      <>
                        <div style={{ position: 'absolute', left: 14, top: 62, right: 14, height: 5, borderRadius: 2, background: `${t.preview.ink}33` }} />
                        <div style={{ position: 'absolute', left: 14, top: 71, right: 90, height: 5, borderRadius: 2, background: `${t.preview.ink}33` }} />
                        <div style={{ position: 'absolute', left: 14, top: 80, right: 60, height: 5, borderRadius: 2, background: `${t.preview.ink}33` }} />
                      </>
                    ) : t.id === 'workshop' ? (
                      <>
                        <div style={{ position: 'absolute', left: 14, top: 62, width: 60, height: 22, borderRadius: 4, background: `${t.preview.accent}33` }} />
                        <div style={{ position: 'absolute', left: 78, top: 62, width: 60, height: 22, borderRadius: 4, background: `${t.preview.ink}22` }} />
                      </>
                    ) : (
                      <>
                        <div style={{ position: 'absolute', left: 14, top: 62, width: 70, height: 22, borderRadius: 4, background: `${t.preview.ink}22` }} />
                        <div style={{ position: 'absolute', left: 88, top: 62, width: 32, height: 22, borderRadius: 4, background: `${t.preview.accent}33`, border: `1px solid ${t.preview.accent}55` }} />
                      </>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[10px] font-bold tracking-wider uppercase"
                        style={{ color: 'var(--ink-muted)' }}
                      >
                        {t.category}
                      </span>
                      <span style={{ width: 3, height: 3, borderRadius: 999, background: 'var(--ink-muted)', opacity: 0.5 }} />
                      <span className="text-[10px] font-semibold" style={{ color: 'var(--ink-muted)' }}>
                        {t.slides} slides · {t.recommendedLevel}
                      </span>
                    </div>
                    <h3
                      className="font-semibold text-[14px] leading-tight mb-1"
                      style={{ color: 'var(--ink-strong)' }}
                    >
                      {t.title}
                    </h3>
                    <p className="text-[12px] leading-snug" style={{ color: 'var(--ink-soft)' }}>
                      {t.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
