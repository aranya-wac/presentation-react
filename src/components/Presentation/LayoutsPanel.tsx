import { useState } from 'react'
import type { Block, DeckLayout, Slide } from '../../types'

interface Props {
  layouts: DeckLayout[]
  currentSlide: Slide | null
  onSaveCurrent: (name: string) => void
  onApply: (layout: DeckLayout) => void
  onDelete: (layoutId: string) => void
  onClose: () => void
}

export function LayoutsPanel({
  layouts, currentSlide, onSaveCurrent, onApply, onDelete, onClose,
}: Props) {
  const [name, setName] = useState('')

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onSaveCurrent(trimmed)
    setName('')
  }

  return (
    <div
      style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 320,
        background: '#13131f', borderLeft: '1px solid rgba(255,255,255,0.08)',
        zIndex: 100, display: 'flex', flexDirection: 'column',
        boxShadow: '-12px 0 40px rgba(0,0,0,0.45)',
      }}
    >
      <header style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.6, color: 'rgba(255,255,255,0.45)', margin: 0 }}>Layouts</p>
          <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: '2px 0 0 0' }}>Saved in this deck</h2>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 22, cursor: 'pointer' }}>×</button>
      </header>

      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
          placeholder="Layout name (e.g. Section header)"
          disabled={!currentSlide}
          style={{
            width: '100%', padding: '7px 10px', borderRadius: 6,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff', fontSize: 12, marginBottom: 8, boxSizing: 'border-box',
          }}
        />
        <button
          onClick={handleSave}
          disabled={!currentSlide || !name.trim()}
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 8,
            background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.4)',
            color: '#cbd5ff', fontSize: 12, fontWeight: 600,
            cursor: (!currentSlide || !name.trim()) ? 'not-allowed' : 'pointer',
            opacity: (!currentSlide || !name.trim()) ? 0.5 : 1,
          }}
        >
          + Save current slide as layout
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 16px' }}>
        {layouts.length === 0 && (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, padding: '4px 8px', lineHeight: 1.5 }}>
            Save your favorite slide structures as layouts and reuse them anywhere in this deck.
          </p>
        )}
        {layouts.map((l) => (
          <div
            key={l.id}
            style={{
              padding: '10px 12px', borderRadius: 8, marginBottom: 6,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{l.name}</span>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>{l.blocks.length} blocks</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => onApply(l)}
                style={{
                  flex: 1, fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 6,
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.18)',
                  color: 'rgba(255,255,255,0.85)', cursor: 'pointer',
                }}
              >Apply to current</button>
              <button
                onClick={() => onDelete(l.id)}
                style={{
                  fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 6,
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.18)',
                  color: '#f87171', cursor: 'pointer',
                }}
              >Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Strip block-level user content from a slide so it can be re-used as a layout
 * template — keeps id/type/position/styling but blanks out content fields and
 * regenerates ids so applying creates fresh blocks.
 */
export function makeLayoutFromSlide(slide: Slide, name: string): DeckLayout {
  const blanked: Block[] = slide.blocks.map((b) => ({
    id: crypto.randomUUID(),
    type: b.type,
    content: b.type === 'image' ? '' : '',
    position: { ...b.position },
    styling: { ...b.styling },
    chart_type: b.chart_type,
    chart_data: b.chart_data,
  }))
  return { id: crypto.randomUUID(), name, blocks: blanked }
}

/** Apply a layout's blocks to a slide, fresh ids each time. */
export function applyLayoutToSlide(slide: Slide, layout: DeckLayout): Slide {
  return {
    ...slide,
    blocks: layout.blocks.map((b) => ({
      ...b,
      id: crypto.randomUUID(),
    })),
  }
}
