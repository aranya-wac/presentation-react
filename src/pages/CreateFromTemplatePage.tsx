import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Sparkles, Loader2, Paperclip, Link2, Mic, Square, X } from 'lucide-react'
import { templatesApi } from '../api/client'
import { SlidePreview } from '../components/Presentation/SlidePreview'
import type { PreviewResponse, Slide, TemplateListItem, Theme } from '../types'

const TXT_RE = /\.txt$/i

function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

const SLIDE_W = 1280
const SLIDE_H = 720
const MAX_CHARS = 50000

const SUGGESTIONS = [
  'A new product launch deck',
  'Q3 2026 strategy review',
  'B2B SaaS sales pitch',
  'Early-stage investor pitch',
]

export function CreateFromTemplatePage() {
  const { id: templateId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [template, setTemplate] = useState<TemplateListItem | null>(null)
  const [slides, setSlides] = useState<Slide[]>([])
  const [theme, setTheme] = useState<Theme | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const [markdown, setMarkdown] = useState(true)
  const [cardCount, setCardCount] = useState<number>(5)

  // ── Attached file ──────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── URL input ───────────────────────────────────────────────────
  const [urlOpen, setUrlOpen]         = useState(false)
  const [urlValue, setUrlValue]       = useState('')
  const [urlAttached, setUrlAttached] = useState<string | null>(null)
  const [urlError, setUrlError]       = useState('')

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
  const clearUrl = () => { setUrlAttached(null); setUrlValue(''); setUrlError('') }

  // ── Voice (Web Speech API) ──────────────────────────────────────
  const SR: any =
    typeof window !== 'undefined'
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null
  const speechSupported = !!SR
  const [listening, setListening]   = useState(false)
  const [voiceError, setVoiceError] = useState('')
  const recognitionRef = useRef<any>(null)
  const baseTextRef    = useRef('')

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
        setPrompt((baseTextRef.current + interim).slice(0, MAX_CHARS))
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
  const stopListening   = () => { recognitionRef.current?.stop(); setListening(false) }
  const toggleListening = () => (listening ? stopListening() : startListening())

  useEffect(() => {
    if (!templateId) return
    setLoading(true)
    Promise.all([
      templatesApi.list(),
      templatesApi.getPreview(templateId),
    ])
      .then(([listRes, prevRes]) => {
        const t = (listRes.data as TemplateListItem[]).find((x) => x.id === templateId) ?? null
        setTemplate(t)
        const data = prevRes.data as PreviewResponse
        setSlides(data.slides ?? [])
        setTheme(data.theme ?? null)
      })
      .catch((e: any) => setLoadError(e?.response?.data?.detail ?? 'Failed to load template'))
      .finally(() => setLoading(false))
  }, [templateId])

  const charCount = prompt.length
  const canGenerate =
    !generating &&
    !!templateId &&
    (prompt.trim().length > 0 || !!file || !!urlAttached)

  // Compose final prompt — backend takes JSON {prompt}, so file content + URL
  // are merged in here as additional context. .txt files are read inline;
  // non-text files contribute filename only.
  const buildFinalPrompt = async (): Promise<string> => {
    const parts: string[] = []
    if (prompt.trim()) parts.push(prompt.trim())

    if (file) {
      if (TXT_RE.test(file.name)) {
        try {
          const text = await readFileAsText(file)
          if (text.trim()) {
            parts.push(`\n\n--- Attached document: ${file.name} ---\n${text.trim()}`)
          }
        } catch {
          parts.push(`\n\n[Attached: ${file.name} — could not read]`)
        }
      } else {
        parts.push(
          `\n\n[Attached file: ${file.name} — note: only .txt is read inline here. For full PDF/DOCX extraction, upload via Projects.]`
        )
      }
    }

    if (urlAttached) parts.push(`\n\n[Source URL: ${urlAttached}]`)
    return parts.join('').slice(0, MAX_CHARS)
  }

  const handleGenerate = async () => {
    if (!canGenerate || !templateId) return
    if (listening) stopListening()
    setGenerating(true)
    setGenError('')
    try {
      const finalPrompt = await buildFinalPrompt()
      const { data } = await templatesApi.generateFromPrompt(templateId, finalPrompt, undefined, cardCount)
      navigate(`/presentations/${(data as { id: string }).id}`)
    } catch (e: any) {
      setGenError(e?.response?.data?.detail ?? 'Generation failed. Please try again.')
      setGenerating(false)
    }
  }

  const onPromptKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleGenerate()
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      {/* Top bar */}
      <div
        className="sticky top-0 z-20 backdrop-blur-md"
        style={{ background: 'rgba(244, 242, 238, 0.85)', borderBottom: '1px solid var(--line)' }}
      >
        <div className="max-w-[1400px] mx-auto px-10 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 h-9 rounded-full text-[13px] transition-colors"
            style={{ color: 'var(--ink)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(10,9,7,0.06)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <div className="text-center min-w-0">
            <p className="eyebrow mb-0.5">— New Presentation</p>
            <p
              className="font-serif text-[15px] truncate tracking-tighter"
              style={{ color: 'var(--ink-strong)' }}
            >
              {template?.name ?? '…'}
            </p>
          </div>
          <div className="w-[80px]" />
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-10 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* LEFT — Prompt */}
        <div className="flex flex-col">
          {/* Editorial heading */}
          <div className="mb-8">
            <p className="eyebrow mb-4">— Write your prompt</p>
            <h1
              className="font-serif leading-[1.0] tracking-tightest text-[34px] md:text-[44px]"
              style={{ color: 'var(--ink-strong)' }}
            >
              What's the
              <br />
              <span className="font-serif-italic" style={{ color: 'var(--accent)' }}>deck about?</span>
            </h1>
            <p
              className="text-[14.5px] mt-5 max-w-md leading-relaxed"
              style={{ color: 'var(--ink-soft)' }}
            >
              Describe your topic, paste raw notes, or pick a starter. AI fills the template using your prompt — layout, colors, and rhythm stay intact.
            </p>
          </div>

          {/* Prompt card */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              boxShadow: '0 1px 1px rgba(15,14,12,0.04), 0 4px 12px -4px rgba(15,14,12,0.08)',
            }}
          >
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, MAX_CHARS))}
              onKeyDown={onPromptKey}
              placeholder="A pitch deck for Acme Corp's new B2B analytics platform launching in Q3…"
              className="w-full min-h-[200px] p-6 text-[14.5px] focus:outline-none resize-none font-sans leading-relaxed"
              style={{ color: 'var(--ink-strong)', background: 'transparent' }}
            />

            {/* Suggestions */}
            <div className="px-5 pb-4 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setPrompt(s)}
                  className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-[12px] font-medium transition-all"
                  style={{ background: 'var(--surface-2)', color: 'var(--ink-soft)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(10,9,7,0.06)'
                    e.currentTarget.style.color = 'var(--ink-strong)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--surface-2)'
                    e.currentTarget.style.color = 'var(--ink-soft)'
                  }}
                >
                  <Sparkles size={11} style={{ color: 'var(--accent)' }} />
                  {s}
                </button>
              ))}
            </div>

            {/* Attached chips */}
            {(file || urlAttached) && (
              <div className="px-5 pb-3 flex flex-wrap items-center gap-2">
                {file && (
                  <div
                    className="inline-flex items-center gap-2 h-8 px-3 rounded-full"
                    style={{ background: 'var(--paper-2)', border: '1px solid var(--line)' }}
                  >
                    <Paperclip size={11} style={{ color: 'var(--ink-soft)' }} />
                    <span className="text-[12px] truncate max-w-[220px]" style={{ color: 'var(--ink-strong)' }}>
                      {file.name}
                    </span>
                    <button onClick={() => setFile(null)} className="ml-1" style={{ color: 'var(--ink-muted)' }}>
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
                    <span className="text-[12px] truncate max-w-[280px]" style={{ color: 'var(--ink-strong)' }}>
                      {urlAttached}
                    </span>
                    <button onClick={clearUrl} className="ml-1" style={{ color: 'var(--ink-muted)' }}>
                      <X size={11} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* URL input panel (collapsible) */}
            {urlOpen && (
              <div className="px-5 pb-3">
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
                      if (e.key === 'Enter')  { e.preventDefault(); attachUrl() }
                      if (e.key === 'Escape') { setUrlOpen(false); setUrlError('') }
                    }}
                    placeholder="https://example.com/article"
                    disabled={generating}
                    className="flex-1 bg-transparent outline-none text-[13px]"
                    style={{ color: 'var(--ink-strong)' }}
                  />
                  <button
                    onClick={attachUrl}
                    disabled={!urlValue.trim() || generating}
                    className="text-[12px] font-semibold px-3 h-7 rounded-md"
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
                  The URL is added as a reference to your prompt.
                </p>
              </div>
            )}

            {/* Footer row */}
            <div
              className="px-5 py-3 flex items-center justify-between gap-2 flex-wrap"
              style={{ borderTop: '1px solid var(--line)', background: 'var(--surface-2)' }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={generating}
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

                <span className="w-px h-4" style={{ background: 'var(--line)' }} />

                <button
                  onClick={() => { setUrlOpen((o) => !o); setUrlError('') }}
                  disabled={generating}
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
                      disabled={generating}
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
                                width: 6, height: 6, borderRadius: '50%',
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

                <button
                  onClick={() => setMarkdown((v) => !v)}
                  className="flex items-center gap-1.5 text-[11.5px] font-mono uppercase tracking-wider transition-colors"
                  style={{ color: markdown ? 'var(--ink)' : 'var(--ink-faint)' }}
                >
                  <span
                    className="text-[10px] font-bold border rounded px-1 py-0.5"
                    style={{ borderColor: markdown ? 'var(--ink)' : 'var(--line-strong)' }}
                  >M</span>
                  Markdown
                </button>
              </div>
              <span className="text-[11px] font-mono tabular-nums" style={{ color: 'var(--ink-muted)' }}>
                {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
              </span>
            </div>
          </div>

          {voiceError && (
            <p className="mt-3 text-[12px]" style={{ color: 'var(--accent, #B43C28)' }}>
              {voiceError}
            </p>
          )}

          <style>{`@keyframes wac-mic-pulse { 0%,100% { opacity: 0.35; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.15); } }`}</style>

          {/* Error */}
          {genError && (
            <div
              className="mt-4 rounded-xl px-4 py-3"
              style={{ background: 'var(--accent-soft)', border: "1px solid var(--line)" }}
            >
              <p className="text-[13px]" style={{ color: 'var(--accent)' }}>{genError}</p>
            </div>
          )}

          {/* Generate row */}
          <div className="mt-8 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <p className="eyebrow" style={{ margin: 0 }}>— Cards</p>
              <div
                className="inline-flex items-center p-1 rounded-full"
                style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}
              >
                {[5, 10, 15].map((n) => {
                  const active = cardCount === n
                  return (
                    <button
                      key={n}
                      onClick={() => setCardCount(n)}
                      className="h-8 min-w-[40px] px-3 rounded-full text-[12.5px] font-semibold transition-all tabular-nums"
                      style={{
                        background: active ? 'var(--ink-strong)' : 'transparent',
                        color: active ? '#fff' : 'var(--ink-soft)',
                      }}
                      onMouseEnter={(e) => {
                        if (!active) e.currentTarget.style.color = 'var(--ink-strong)'
                      }}
                      onMouseLeave={(e) => {
                        if (!active) e.currentTarget.style.color = 'var(--ink-soft)'
                      }}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="inline-flex items-center gap-2 h-12 px-7 rounded-full text-[14px] font-semibold transition-all"
              style={{
                background: canGenerate ? 'var(--ink-strong)' : 'rgba(10,9,7,0.15)',
                color: '#fff',
                cursor: canGenerate ? 'pointer' : 'not-allowed',
              }}
              onMouseEnter={(e) => {
                if (canGenerate) e.currentTarget.style.background = '#2A2620'
              }}
              onMouseLeave={(e) => {
                if (canGenerate) e.currentTarget.style.background = 'var(--ink-strong)'
              }}
            >
              {generating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  Generate
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT — preview */}
        <div className="flex flex-col">
          <div className="mb-6">
            <p className="eyebrow mb-3">— The template</p>
            <h2
              className="font-serif text-[32px] leading-tight tracking-tightest"
              style={{ color: 'var(--ink-strong)' }}
            >
              {template?.name ?? 'Template'}
            </h2>
            {template?.description && (
              <p
                className="text-[13px] mt-2 line-clamp-2 max-w-md"
                style={{ color: 'var(--ink-soft)' }}
              >
                {template.description}
              </p>
            )}
          </div>

          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              boxShadow: '0 1px 1px rgba(15,14,12,0.04), 0 4px 12px -4px rgba(15,14,12,0.08)',
            }}
          >
            <div className="max-h-[calc(100vh-260px)] overflow-y-auto p-5 space-y-5">
              {loading && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 size={22} className="animate-spin" style={{ color: 'var(--ink-muted)' }} />
                  <p className="text-[12.5px]" style={{ color: 'var(--ink-soft)' }}>Loading template…</p>
                </div>
              )}
              {loadError && !loading && (
                <div
                  className="rounded-xl px-4 py-3"
                  style={{ background: 'var(--accent-soft)', border: "1px solid var(--line)" }}
                >
                  <p className="text-[13px]" style={{ color: 'var(--accent)' }}>{loadError}</p>
                </div>
              )}
              {!loading && !loadError && slides.map((slide, idx) => (
                <SlideThumb
                  key={slide.order ?? idx}
                  slide={slide}
                  theme={theme}
                  index={idx}
                  total={slides.length}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SlideThumb({
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
  const [scale, setScale] = useState(0.5)

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
    <div className="flex flex-col gap-2">
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
          boxShadow: '0 1px 1px rgba(15,14,12,0.05), 0 12px 28px -8px rgba(15,14,12,0.16)',
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
