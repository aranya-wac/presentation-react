import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Newspaper, Sparkles } from 'lucide-react'

export type ResearchDepth = 'shallow' | 'standard' | 'deep'
export type DeckLevel = 'simple' | 'advanced'

interface Props {
  onGenerate: (
    topic: string,
    audience: string,
    style: string,
    slideCount: number,
    depth: ResearchDepth,
    level: DeckLevel,
  ) => void
  isGenerating: boolean
}

const SUGGESTIONS = [
  'US Election 2026',
  'Kerala Flood',
  'AI in Healthcare',
  'EV adoption in India',
]

const SLIDE_OPTIONS = [5, 7, 10, 12, 15]
const DEPTHS: { value: ResearchDepth; label: string; help: string }[] = [
  { value: 'shallow', label: 'Quick scan', help: 'Up to 5 articles' },
  { value: 'standard', label: 'Standard', help: 'Up to 10 articles' },
  { value: 'deep', label: 'Deep dive', help: 'Up to 15 articles' },
]
const STYLES = ['Professional', 'Editorial', 'Briefing', 'Storytelling']

export function TopicScreen({ onGenerate, isGenerating }: Props) {
  const navigate = useNavigate()
  const [topic, setTopic] = useState('')
  const [audience, setAudience] = useState('')
  const [style, setStyle] = useState('Professional')
  const [slideCount, setSlideCount] = useState(10)
  const [depth, setDepth] = useState<ResearchDepth>('standard')
  const [level, setLevel] = useState<DeckLevel>('simple')

  const canSubmit = topic.trim().length > 1 && !isGenerating

  const handleSubmit = () => {
    if (!canSubmit) return
    onGenerate(topic.trim(), audience.trim(), style.toLowerCase(), slideCount, depth, level)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--paper)' }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-10 h-14"
        style={{ borderBottom: '1px solid var(--line)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 h-9 rounded-full text-[13px] transition-colors"
          style={{ color: 'var(--ink-soft)' }}
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <p className="eyebrow">— Current topic</p>
        <div className="w-[80px]" />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[680px]">
          {/* Header */}
          <div className="mb-10 text-center">
            <p className="eyebrow mb-4">— Research from live news</p>
            <h1
              className="font-serif leading-[1.0] tracking-tightest text-[40px] md:text-[52px]"
              style={{ color: 'var(--ink-strong)' }}
            >
              Build a deck on <span className="font-serif-italic" style={{ color: 'var(--accent)' }}>any topic.</span>
            </h1>
            <p className="text-[15px] mt-6 max-w-md mx-auto leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
              We'll find recent articles, synthesize them, and draft slides citing each source.
            </p>
          </div>

          {/* Topic card */}
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              boxShadow: '0 1px 1px rgba(15,14,12,0.04), 0 12px 32px -8px rgba(15,14,12,0.10)',
            }}
          >
            <div className="px-7 pt-7">
              <label className="block eyebrow mb-2" style={{ color: 'var(--ink-strong)' }}>Topic</label>
              <div
                className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors"
                style={{
                  background: 'var(--paper-2)',
                  border: '1px solid var(--line)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--ink-muted)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--line)')}
              >
                <Newspaper size={18} style={{ color: 'var(--ink-muted)' }} />
                <input
                  autoFocus
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Type any topic — e.g. Kerala Flood, US Election 2026, AI in Healthcare"
                  disabled={isGenerating}
                  className="flex-1 outline-none text-[18px] font-serif"
                  style={{ background: 'transparent', color: 'var(--ink-strong)' }}
                  onFocus={(e) => (e.currentTarget.parentElement!.style.borderColor = 'var(--ink-strong)')}
                  onBlur={(e) => (e.currentTarget.parentElement!.style.borderColor = 'var(--line)')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit()
                    }
                  }}
                />
                {topic && !isGenerating && (
                  <button
                    onClick={() => setTopic('')}
                    aria-label="Clear topic"
                    className="text-[12px] px-2 py-0.5 rounded-md transition-colors"
                    style={{ color: 'var(--ink-muted)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink-strong)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink-muted)')}
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>Try:</span>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setTopic(s)}
                    disabled={isGenerating}
                    className="text-[12px] px-3 py-1 rounded-full transition-colors"
                    style={{
                      background: 'var(--paper-2)',
                      border: '1px solid var(--line)',
                      color: 'var(--ink-soft)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--ink-soft)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--line)')}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div
              className="grid grid-cols-2 gap-4 px-7 py-5 mt-4"
              style={{ borderTop: '1px solid var(--line)' }}
            >
              <div>
                <label className="block eyebrow mb-2">Audience (optional)</label>
                <input
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="Investors, students, …"
                  disabled={isGenerating}
                  className="w-full px-3 py-2 rounded-lg outline-none text-[13px]"
                  style={{ background: 'var(--paper-2)', border: '1px solid var(--line)', color: 'var(--ink-strong)' }}
                />
              </div>
              <div>
                <label className="block eyebrow mb-2">Style</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  disabled={isGenerating}
                  className="w-full px-3 py-2 rounded-lg outline-none text-[13px]"
                  style={{ background: 'var(--paper-2)', border: '1px solid var(--line)', color: 'var(--ink-strong)' }}
                >
                  {STYLES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Toolbar */}
            <div
              className="flex items-center justify-between px-5 py-3 flex-wrap gap-3"
              style={{ borderTop: '1px solid var(--line)', background: 'var(--surface-2)' }}
            >
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1">
                  {DEPTHS.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setDepth(d.value)}
                      disabled={isGenerating}
                      title={d.help}
                      className="text-[12px] font-medium px-3 py-1.5 rounded-lg transition-colors"
                      style={{
                        background: depth === d.value ? 'var(--ink-strong)' : 'transparent',
                        color: depth === d.value ? '#fff' : 'var(--ink-soft)',
                        border: '1px solid ' + (depth === d.value ? 'var(--ink-strong)' : 'var(--line)'),
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                <span className="w-px h-4" style={{ background: 'var(--line)' }} />

                <div
                  className="flex items-center gap-1"
                  title="Simple = text-driven slides. Advanced = adds charts, stats, timelines, process diagrams, and image placeholders."
                >
                  {(['simple', 'advanced'] as const).map((lv) => (
                    <button
                      key={lv}
                      onClick={() => setLevel(lv)}
                      disabled={isGenerating}
                      className="text-[12px] font-medium px-3 py-1.5 rounded-lg transition-colors capitalize"
                      style={{
                        background: level === lv ? 'var(--ink-strong)' : 'transparent',
                        color: level === lv ? '#fff' : 'var(--ink-soft)',
                        border: '1px solid ' + (level === lv ? 'var(--ink-strong)' : 'var(--line)'),
                      }}
                    >
                      {lv}
                    </button>
                  ))}
                </div>

                <span className="w-px h-4" style={{ background: 'var(--line)' }} />

                <div className="flex items-center gap-1">
                  {SLIDE_OPTIONS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setSlideCount(n)}
                      disabled={isGenerating}
                      className="text-[12px] font-medium px-2.5 h-7 rounded-md transition-colors"
                      style={{
                        background: slideCount === n ? 'rgba(10,9,7,0.08)' : 'transparent',
                        color: slideCount === n ? 'var(--ink-strong)' : 'var(--ink-soft)',
                      }}
                    >
                      {n}p
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex items-center gap-2 h-9 px-5 rounded-full text-[13px] font-semibold transition-all"
                style={{
                  background: canSubmit ? 'var(--ink-strong)' : 'var(--paper-2)',
                  color: canSubmit ? '#fff' : 'var(--ink-muted)',
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                }}
              >
                <Sparkles size={13} />
                {isGenerating ? 'Researching…' : 'Generate'}
              </button>
            </div>
          </div>

          <p className="text-[11.5px] mt-6 text-center" style={{ color: 'var(--ink-muted)' }}>
            We cite every fact back to its source article. Set <span className="font-mono">SERPER_API_KEY</span> in
            backend/.env for higher-quality results (otherwise we fall back to a free DuckDuckGo scrape).
          </p>
        </div>
      </div>
    </div>
  )
}
