import { useState } from 'react'
import type { Slide } from '../../types'
import { api } from '../../api/client'

interface Props {
  slide: Slide
  onClose: () => void
  onApply: (newSlide: Slide, note: string) => void
}

type Preset = 'shorter' | 'more_visual' | 'add_data' | 'rephrase_execs' | 'fix_grammar'

const PRESETS: { value: Preset; label: string; help: string }[] = [
  { value: 'shorter',         label: 'Make it shorter',       help: 'Tighten copy, halve word count' },
  { value: 'more_visual',     label: 'More visual',           help: 'Charts, stats, fewer words' },
  { value: 'add_data',        label: 'Add data',              help: 'Surface numbers where they fit' },
  { value: 'rephrase_execs',  label: 'Rephrase for execs',    help: 'Outcomes-first, scannable' },
  { value: 'fix_grammar',     label: 'Fix grammar',           help: 'Polish only, no restructure' },
]

export function SlideRewritePanel({ slide, onClose, onApply }: Props) {
  const [busy, setBusy] = useState(false)
  const [instruction, setInstruction] = useState('')
  const [error, setError] = useState<string | null>(null)

  const runRewrite = async (preset?: Preset) => {
    if (busy) return
    setError(null)
    setBusy(true)
    try {
      const { data } = await api.post<{ slide: Slide; note: string }>('/generate/slide/rewrite', {
        slide,
        instruction,
        preset: preset ?? null,
      })
      onApply(data.slide, data.note || '')
    } catch (err: any) {
      setError(err.response?.data?.detail ?? err.message ?? 'Rewrite failed')
    } finally {
      setBusy(false)
    }
  }

  const canRunCustom = instruction.trim().length > 0 && !busy

  return (
    <div
      style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 340,
        background: '#13131f', borderLeft: '1px solid rgba(255,255,255,0.08)',
        zIndex: 100, display: 'flex', flexDirection: 'column',
        boxShadow: '-12px 0 40px rgba(0,0,0,0.45)',
      }}
    >
      <header style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.6, color: 'rgba(255,255,255,0.45)', margin: 0 }}>AI</p>
          <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: '2px 0 0 0' }}>Rewrite this slide</h2>
        </div>
        <button onClick={onClose} disabled={busy} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 22, cursor: busy ? 'not-allowed' : 'pointer' }}>×</button>
      </header>

      <div style={{ padding: '14px 16px', overflowY: 'auto', flex: 1 }}>
        <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.6, color: 'rgba(255,255,255,0.45)', margin: '0 0 8px 0', fontWeight: 600 }}>
          One-click
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6, marginBottom: 18 }}>
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => runRewrite(p.value)}
              disabled={busy}
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: '#e2e8f0',
                cursor: busy ? 'not-allowed' : 'pointer',
                transition: 'all 150ms ease',
                opacity: busy ? 0.5 : 1,
              }}
              onMouseEnter={(e) => { if (!busy) e.currentTarget.style.background = 'rgba(99,102,241,0.12)' }}
              onMouseLeave={(e) => { if (!busy) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
            >
              <div style={{ fontSize: 13, fontWeight: 600 }}>{p.label}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{p.help}</div>
            </button>
          ))}
        </div>

        <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.6, color: 'rgba(255,255,255,0.45)', margin: '0 0 8px 0', fontWeight: 600 }}>
          Custom
        </p>
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          disabled={busy}
          placeholder="e.g. 'turn this into a 3-step process diagram' or 'change the heading to focus on cost savings'"
          rows={4}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, padding: 10,
            color: '#e2e8f0', fontSize: 12.5, lineHeight: 1.5,
            outline: 'none', resize: 'vertical',
            fontFamily: 'Inter, sans-serif',
          }}
        />
        <button
          onClick={() => runRewrite()}
          disabled={!canRunCustom}
          style={{
            width: '100%', marginTop: 10,
            padding: '9px 14px', borderRadius: 8,
            background: canRunCustom ? 'rgba(99,102,241,0.9)' : 'rgba(255,255,255,0.06)',
            border: 'none',
            color: canRunCustom ? '#fff' : 'rgba(255,255,255,0.4)',
            fontSize: 12.5, fontWeight: 600,
            cursor: canRunCustom ? 'pointer' : 'not-allowed',
          }}
        >
          {busy ? 'Rewriting…' : 'Apply instruction'}
        </button>

        {error && (
          <div style={{
            marginTop: 12, padding: '8px 10px', borderRadius: 8,
            background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
            color: '#fca5a5', fontSize: 11.5,
          }}>
            {error}
          </div>
        )}

        <p style={{ marginTop: 18, fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
          Block ids, positions, and styling are preserved. You can undo any rewrite with Ctrl+Z.
        </p>
      </div>
    </div>
  )
}
