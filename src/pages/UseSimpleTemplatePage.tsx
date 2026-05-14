import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Sparkles, Loader2,
  Type, List, Image as ImageIcon, Columns,
  Paperclip, Link2, Mic, Square, X,
} from 'lucide-react'
import { AppLayout } from '../components/Layout/AppLayout'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import { templatesApi } from '../api/client'
import type { TemplateLayoutType } from '../api/client'

interface TemplateSlideRow {
  id: string
  order: number
  title: string
  layout_type: TemplateLayoutType
  prompt_hint: string
}

interface TemplateDetailRow {
  id: string
  name: string
  description: string
  category: string
  slide_source: 'rich' | 'simple'
  is_system: boolean
  is_published: boolean
  role: string | null
  template_slides: TemplateSlideRow[]
}

const LAYOUT_ICON: Record<TemplateLayoutType, any> = {
  title: Type,
  bullets: List,
  image: ImageIcon,
  columns: Columns,
}

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

export function UseSimpleTemplatePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const [template, setTemplate] = useState<TemplateDetailRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [prompt, setPrompt] = useState('')
  const [title, setTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)

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

  const stopListening = () => { recognitionRef.current?.stop(); setListening(false) }
  const toggleListening = () => (listening ? stopListening() : startListening())

  // ── Load template ───────────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    templatesApi
      .get(id)
      .then((r) => {
        const t = r.data as TemplateDetailRow
        if (t.slide_source !== 'simple') {
          toast.error('Wrong template type', 'This page is only for wizard-built templates.')
          navigate(`/templates/${id}/create`)
          return
        }
        setTemplate(t)
      })
      .catch((e: any) => {
        toast.error('Could not load template', e?.response?.data?.detail ?? e?.message ?? '')
        navigate('/templates')
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // ── Submit ──────────────────────────────────────────────────────
  const canSubmit = (prompt.trim().length > 0 || !!file || !!urlAttached) && !submitting

  // Compose the final prompt that gets sent to /templates/:id/generate-simple.
  // The backend currently accepts JSON {prompt, title}, so file content + URL
  // are merged into the prompt as additional context. .txt files are read
  // client-side; non-text files contribute only their name (a hint to the AI).
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

    if (urlAttached) {
      parts.push(`\n\n[Source URL: ${urlAttached}]`)
    }

    return parts.join('').trim()
  }

  const submit = async () => {
    if (!id) return
    if (!canSubmit) {
      toast.error('Add a prompt, attach a file, or paste a URL to generate')
      return
    }
    setSubmitting(true)
    if (listening) stopListening()

    const tid = toast.loading(
      'Generating presentation',
      'AI is filling in your template…',
    )
    try {
      const finalPrompt = await buildFinalPrompt()
      const fallbackTitle =
        title.trim() ||
        (file ? file.name.replace(/\.[^.]+$/, '') : '') ||
        undefined

      const { data } = await templatesApi.generateSimple(id, finalPrompt, fallbackTitle)
      toast.update(tid, {
        variant: 'success',
        title: 'Deck generated',
        description: `${data.total_slides ?? data.slide_count ?? '—'} slides ready.`,
      })
      navigate(`/presentations/${data.id}`)
    } catch (e: any) {
      toast.update(tid, {
        variant: 'error',
        title: 'Generation failed',
        description: e?.response?.data?.detail ?? e?.message ?? '',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="px-12 pt-12 max-w-[900px] mx-auto">
          <div className="h-8 w-1/3 mb-3 rounded shimmer" />
          <div className="h-4 w-2/3 rounded shimmer" />
        </div>
      </AppLayout>
    )
  }

  if (!template) return null

  return (
    <AppLayout>
      <style>{`@keyframes wac-mic-pulse { 0%,100% { opacity: 0.35; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.15); } }`}</style>

      <div className="px-12 pt-10 pb-20 max-w-[900px] mx-auto">
        <button
          onClick={() => navigate('/templates')}
          className="inline-flex items-center gap-1.5 text-[12.5px] mb-6 transition-colors"
          style={{ color: 'var(--ink-muted)' }}
        >
          <ArrowLeft size={13} />
          All templates
        </button>

        <p className="eyebrow mb-3">— Use template</p>
        <h1
          className="font-serif leading-[1.05] tracking-tighter text-[34px] md:text-[42px] mb-3"
          style={{ color: 'var(--ink-strong)' }}
        >
          {template.name}
        </h1>
        {template.description && (
          <p className="text-[14px] leading-relaxed mb-6" style={{ color: 'var(--ink-soft)' }}>
            {template.description}
          </p>
        )}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide"
            style={{ background: 'var(--surface)', color: 'var(--ink-soft)', border: '1px solid var(--line)' }}
          >
            {template.template_slides.length} slides
          </span>
          {template.role && (
            <span
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide"
              style={{ background: 'var(--ink-strong)', color: '#fff' }}
            >
              {template.role}
            </span>
          )}
          {template.category && (
            <span className="eyebrow">{template.category}</span>
          )}
        </div>

        {/* Slide preview rows */}
        <div className="rounded-2xl overflow-hidden mb-8" style={{ border: '1px solid var(--line)' }}>
          {template.template_slides.map((s, i) => {
            const Icon = LAYOUT_ICON[s.layout_type] ?? List
            return (
              <div
                key={s.id}
                className="flex items-start gap-3 px-5 py-3.5"
                style={{
                  background: 'var(--paper)',
                  borderBottom: i === template.template_slides.length - 1 ? 'none' : '1px solid var(--line)',
                }}
              >
                <span className="eyebrow w-6 mt-1">{s.order}</span>
                <Icon size={14} className="mt-1" style={{ color: 'var(--ink-muted)' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-medium" style={{ color: 'var(--ink-strong)' }}>
                    {s.title}
                  </p>
                  {s.prompt_hint && (
                    <p className="text-[12px] mt-0.5 leading-snug" style={{ color: 'var(--ink-muted)' }}>
                      {s.prompt_hint}
                    </p>
                  )}
                </div>
                <span
                  className="text-[10px] uppercase tracking-wide font-semibold mt-1"
                  style={{ color: 'var(--ink-muted)' }}
                >
                  {s.layout_type}
                </span>
              </div>
            )
          })}
        </div>

        {/* Prompt + inputs + submit */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'var(--paper-2)',
            border: '1px solid var(--line)',
            boxShadow: '0 1px 1px rgba(15,14,12,0.04), 0 12px 32px -8px rgba(15,14,12,0.10)',
          }}
        >
          <div className="px-6 pt-5">
            <label className="eyebrow mb-2 block">What's this deck about?</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Q3 2026 status update for the API team — focus on rollout progress, blockers, next quarter targets."
              rows={4}
              disabled={submitting}
              className="w-full px-3 py-2.5 rounded-xl text-[14px] outline-none resize-none leading-relaxed"
              style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink-strong)' }}
            />
          </div>

          {/* Attached chips */}
          {(file || urlAttached) && (
            <div className="px-6 mt-3 flex flex-wrap items-center gap-2">
              {file && (
                <div
                  className="inline-flex items-center gap-2 h-8 px-3 rounded-full"
                  style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}
                >
                  <Paperclip size={11} style={{ color: 'var(--ink-soft)' }} />
                  <span className="text-[12px] truncate max-w-[220px]" style={{ color: 'var(--ink-strong)' }}>
                    {file.name}
                  </span>
                  <button
                    onClick={() => setFile(null)}
                    className="ml-1"
                    style={{ color: 'var(--ink-muted)' }}
                  >
                    <X size={11} />
                  </button>
                </div>
              )}
              {urlAttached && (
                <div
                  className="inline-flex items-center gap-2 h-8 px-3 rounded-full"
                  style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}
                >
                  <Link2 size={11} style={{ color: 'var(--ink-soft)' }} />
                  <span className="text-[12px] truncate max-w-[280px]" style={{ color: 'var(--ink-strong)' }}>
                    {urlAttached}
                  </span>
                  <button
                    onClick={clearUrl}
                    className="ml-1"
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
            <div className="px-6 mt-3">
              <div
                className="flex items-center gap-2 h-10 px-3 rounded-xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}
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
                  disabled={submitting}
                  className="flex-1 bg-transparent outline-none text-[13px]"
                  style={{ color: 'var(--ink-strong)' }}
                />
                <button
                  onClick={attachUrl}
                  disabled={!urlValue.trim() || submitting}
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

          {/* Title */}
          <div className="px-6 mt-4">
            <label className="eyebrow mb-2 block">
              Title <span style={{ color: 'var(--ink-faint)' }}>(optional)</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`${template.name} — ${new Date().toLocaleDateString()}`}
              disabled={submitting}
              className="w-full px-3 h-11 rounded-xl text-[14px] outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink-strong)' }}
            />
          </div>

          {/* Toolbar */}
          <div
            className="flex items-center justify-between px-5 py-3 mt-5"
            style={{ borderTop: '1px solid var(--line)', background: 'var(--surface-2, var(--surface))' }}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={submitting}
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
                disabled={submitting}
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
                    disabled={submitting}
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
            </div>

            <Button
              variant="primary"
              onClick={submit}
              disabled={!canSubmit}
              leadingIcon={submitting ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            >
              {submitting ? 'Generating…' : 'Generate'}
            </Button>
          </div>
        </div>

        {voiceError && (
          <p className="mt-3 text-[12px]" style={{ color: 'var(--accent, #B43C28)' }}>
            {voiceError}
          </p>
        )}
      </div>
    </AppLayout>
  )
}
