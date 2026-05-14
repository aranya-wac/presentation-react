import { useEffect, useRef, useState } from 'react'
import { api } from '../../api/client'
import type { Slide } from '../../types'

interface Message {
  role: 'user' | 'assistant'
  content: string
  error?: boolean
}

interface Props {
  slide: Slide | null
  presentationId: string
  onSlideUpdate: (slide: Slide) => void
}

// ── Color / gradient maps ─────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  'dark red': '#991b1b',     'light red': '#fca5a5',    'red': '#ef4444',
  'navy blue': '#1e3a8a',    'dark blue': '#1e3a8a',    'light blue': '#93c5fd',
  'sky blue': '#0ea5e9',     'blue': '#3b82f6',         'navy': '#1e3a5f',
  'dark green': '#166534',   'light green': '#bbf7d0',  'green': '#22c55e',
  'emerald': '#10b981',      'teal': '#14b8a6',         'cyan': '#06b6d4',
  'dark purple': '#4c1d95',  'light purple': '#c084fc', 'purple': '#a855f7',
  'violet': '#7c3aed',       'indigo': '#6366f1',       'lavender': '#e9d5ff',
  'hot pink': '#db2777',     'light pink': '#fbcfe8',   'pink': '#ec4899',
  'rose': '#f43f5e',         'amber': '#d97706',        'gold': '#f59e0b',
  'orange': '#f97316',       'peach': '#fb923c',        'yellow': '#eab308',
  'lime': '#84cc16',         'brown': '#78350f',        'cream': '#fafaf8',
  'light gray': '#f3f4f6',   'dark gray': '#374151',    'gray': '#6b7280',
  'grey': '#6b7280',         'slate': '#334155',        'white': '#ffffff',
  'black': '#000000',        'dark': '#0f172a',         'light': '#f8fafc',
}

const GRADIENT_MAP: Record<string, string> = {
  'dark':    'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  'ocean':   'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
  'sunset':  'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
  'forest':  'linear-gradient(135deg, #22c55e 0%, #166534 100%)',
  'purple':  'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
  'fire':    'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
  'sky':     'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
  'gold':    'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  'pink':    'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
  'night':   'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
  'aurora':  'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%)',
  'mint':    'linear-gradient(135deg, #6ee7b7 0%, #3b82f6 100%)',
}

function extractColor(text: string): string | null {
  const hex = text.match(/#([0-9a-fA-F]{3,6})/)
  if (hex) return hex[0]
  const rgb = text.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/)
  if (rgb) {
    const r = parseInt(rgb[1]).toString(16).padStart(2, '0')
    const g = parseInt(rgb[2]).toString(16).padStart(2, '0')
    const b = parseInt(rgb[3]).toString(16).padStart(2, '0')
    return `#${r}${g}${b}`
  }
  const sorted = Object.keys(COLOR_MAP).sort((a, b) => b.length - a.length)
  for (const name of sorted) if (text.includes(name)) return COLOR_MAP[name]
  return null
}

function parseCommand(msg: string, slide: Slide): { slide: Partial<Slide>; reply: string } | null {
  const t = msg.toLowerCase()

  // ── Gradient background ──────────────────────────────────────────────────
  if (t.includes('gradient')) {
    const sorted = Object.keys(GRADIENT_MAP).sort((a, b) => b.length - a.length)
    for (const name of sorted) {
      if (t.includes(name)) return {
        slide: { background: { type: 'gradient', value: GRADIENT_MAP[name] } },
        reply: `Applied ${name} gradient background.`,
      }
    }
    return {
      slide: { background: { type: 'gradient', value: GRADIENT_MAP['dark'] } },
      reply: 'Applied dark gradient background.',
    }
  }

  // ── Background color ─────────────────────────────────────────────────────
  if (t.includes('background') || t.includes(' bg ') || t.startsWith('bg ')) {
    const color = extractColor(t)
    if (color) return {
      slide: { background: { type: 'color', value: color } },
      reply: `Background changed to ${color}.`,
    }
  }

  // ── Text / font color for all blocks ────────────────────────────────────
  if (t.includes('text color') || t.includes('font color') || t.includes('text to ') || t.includes('title color')) {
    const color = extractColor(t)
    if (color) return {
      slide: { blocks: slide.blocks.map(b => ({ ...b, styling: { ...b.styling, color } })) },
      reply: `Text color changed to ${color}.`,
    }
  }

  // ── Remove background (make transparent / white) ─────────────────────────
  if ((t.includes('remove') || t.includes('clear') || t.includes('reset')) && t.includes('background')) {
    return {
      slide: { background: { type: 'color', value: '#ffffff' } },
      reply: 'Background reset to white.',
    }
  }

  return null
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SlideChat({ slide, presentationId, onSlideUpdate }: Props) {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: "Hi! Describe how you'd like to customize this slide.\n\nExamples:\n• \"change background to dark blue\"\n• \"purple gradient background\"\n• \"text color white\"\n• \"background #1e3a8a\"",
  }])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const endRef   = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const recogRef = useRef<any>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // ── Voice ─────────────────────────────────────────────────────────────────
  const toggleVoice = () => {
    if (listening) { recogRef.current?.stop(); setListening(false); return }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Speech recognition is not supported in this browser.'); return }
    const r = new SR()
    r.lang = 'en-US'
    r.interimResults = false
    r.onresult = (e: any) => {
      const t = e.results[0][0].transcript
      setInput((prev) => prev ? `${prev} ${t}` : t)
      setListening(false)
    }
    r.onerror = () => setListening(false)
    r.onend   = () => setListening(false)
    recogRef.current = r
    r.start()
    setListening(true)
  }

  // ── Send ──────────────────────────────────────────────────────────────────
  const send = async () => {
    const text = input.trim()
    if (!text || !slide) return
    setInput('')
    setLoading(true)
    setMessages(prev => [...prev, { role: 'user', content: text }])

    // 1. Try backend AI
    try {
      const { data } = await api.post(
        `/presentations/${presentationId}/slide-chat`,
        { slide, message: text },
      )
      onSlideUpdate(data.updated_slide as Slide)
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      setLoading(false)
      return
    } catch {
      // fall through to local parsing
    }

    // 2. Frontend command parsing fallback
    const result = slide ? parseCommand(text, slide) : null
    if (result) {
      onSlideUpdate({ ...slide, ...result.slide } as Slide)
      setMessages(prev => [...prev, { role: 'assistant', content: result.reply }])
    } else {
      setMessages(prev => [...prev, {
        role: 'assistant', content:
          "I didn't understand that. Try:\n• \"background dark blue\"\n• \"gradient sunset\"\n• \"text color white\"\n• \"background #hex\"",
        error: true,
      }])
    }
    setLoading(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  const bg     = '#13131f'
  const border = 'rgba(255,255,255,0.07)'
  const muted  = 'rgba(255,255,255,0.35)'
  const text   = '#e2e8f0'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: bg }}>

      {/* Header */}
      <div style={{
        padding: '12px 16px 10px', borderBottom: `1px solid ${border}`,
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
      }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>✦</div>
        <span style={{ color: text, fontWeight: 600, fontSize: 13 }}>AI Slide Editor</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: muted, background: 'rgba(99,102,241,0.12)', padding: '2px 7px', borderRadius: 99, border: '1px solid rgba(99,102,241,0.25)' }}>Beta</span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '88%',
              padding: '8px 12px',
              borderRadius: m.role === 'user' ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
              background: m.role === 'user' ? '#6366f1' : m.error ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.06)',
              color: m.role === 'user' ? '#fff' : m.error ? '#fca5a5' : text,
              fontSize: 12.5,
              lineHeight: 1.55,
              border: m.role === 'assistant' ? `1px solid ${m.error ? 'rgba(248,113,113,0.2)' : border}` : 'none',
              whiteSpace: 'pre-wrap',
            }}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '8px 14px', borderRadius: '12px 12px 12px 3px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${border}`, display: 'flex', gap: 4, alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  width: 6, height: 6, borderRadius: '50%', background: '#6366f1',
                  animation: `bounce 1s ${i * 0.15}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick suggestions */}
      <div style={{ padding: '6px 14px', display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
        {['Dark gradient', 'Ocean gradient', 'Background white', 'Text color white'].map((s) => (
          <button
            key={s}
            onClick={() => { setInput(s); inputRef.current?.focus() }}
            style={{
              background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
              color: '#a5b4fc', borderRadius: 99, padding: '3px 10px',
              fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >{s}</button>
        ))}
      </div>

      {/* Input area */}
      <div style={{ padding: '8px 12px 12px', flexShrink: 0, borderTop: `1px solid ${border}` }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 6,
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${border}`,
          borderRadius: 12, padding: '6px 8px',
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={slide ? 'Describe a change…' : 'Select a slide first'}
            disabled={!slide || loading}
            rows={1}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none', resize: 'none',
              color: text, fontSize: 13, lineHeight: 1.5,
              fontFamily: 'Inter, sans-serif',
            }}
          />

          {/* Voice button */}
          <button
            onClick={toggleVoice}
            title={listening ? 'Stop listening' : 'Speak a command'}
            style={{
              width: 32, height: 32, borderRadius: 8, border: 'none',
              background: listening ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)',
              color: listening ? '#f87171' : muted,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, flexShrink: 0,
              animation: listening ? 'pulse 1s infinite' : 'none',
            }}
          >
            {listening ? '⏹' : '🎤'}
          </button>

          {/* Send button */}
          <button
            onClick={send}
            disabled={!input.trim() || !slide || loading}
            style={{
              width: 32, height: 32, borderRadius: 8, border: 'none',
              background: input.trim() && slide ? '#6366f1' : 'rgba(255,255,255,0.05)',
              color: input.trim() && slide ? '#fff' : muted,
              cursor: input.trim() && slide ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, flexShrink: 0,
            }}
          >↑</button>
        </div>
        <p style={{ fontSize: 10, color: muted, margin: '5px 0 0', textAlign: 'center' }}>
          Enter to send · Shift+Enter for new line · 🎤 to speak
        </p>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          50% { box-shadow: 0 0 0 6px rgba(239,68,68,0); }
        }
      `}</style>
    </div>
  )
}
