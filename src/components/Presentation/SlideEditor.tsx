import type { Block, Styling } from '../../types'

// ─── PropertyPanel (exported) ─────────────────────────────────────────────────

interface PropertyPanelProps {
  block: Block
  onStylingChange: (s: Partial<Styling>) => void
  onContentChange: (c: string) => void
  onImageUpload: (url: string) => void
  dark?: boolean
}

const FONT_FAMILIES = [
  'Inter', 'Roboto', 'Montserrat', 'Open Sans', 'Lato',
  'Poppins', 'Playfair Display', 'Georgia', 'Arial', 'Helvetica',
]
const FONT_WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900]

export function PropertyPanel({ block, onStylingChange, onContentChange, onImageUpload, dark }: PropertyPanelProps) {
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onImageUpload(reader.result as string)
    reader.readAsDataURL(file)
  }

  const bg   = dark ? '#1e1e35'           : '#ffffff'
  const bdr  = dark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'
  const text = dark ? '#e2e8f0'           : '#374151'
  const mute = dark ? 'rgba(255,255,255,0.4)' : '#6b7280'
  const inp  = dark ? 'rgba(255,255,255,0.07)' : '#f9fafb'

  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 10, color: mute, marginBottom: 4, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }
  const inputStyle: React.CSSProperties = { width: '100%', background: inp, border: `1px solid ${bdr}`, borderRadius: 6, padding: '5px 8px', fontSize: 12, color: text, outline: 'none', boxSizing: 'border-box' }
  const selectStyle: React.CSSProperties = { ...inputStyle }

  return (
    <div style={{ background: bg, borderRadius: dark ? 0 : 12, padding: dark ? 0 : 16, display: 'flex', flexDirection: 'column', gap: 16, fontSize: 13 }}>
      <p style={{ fontWeight: 600, color: text, fontSize: 12, textTransform: 'capitalize', margin: 0 }}>
        {block.type} block
      </p>

      {/* Content / Image */}
      {block.type === 'image' ? (
        <div>
          <label style={labelStyle}>Upload Image</label>
          <input type="file" accept="image/*" onChange={handleImageFile} style={{ fontSize: 11, color: mute }} />
        </div>
      ) : (
        <div>
          <label style={labelStyle}>Content</label>
          <textarea
            value={block.content}
            onChange={(e) => onContentChange(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
          />
        </div>
      )}

      {/* Font family */}
      <div>
        <label style={labelStyle}>Font Family</label>
        <select value={block.styling.font_family || 'Inter'} onChange={(e) => onStylingChange({ font_family: e.target.value })} style={selectStyle}>
          {FONT_FAMILIES.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      {/* Size + Weight */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Size</label>
          <input
            type="number" min={8} max={200}
            value={block.styling.font_size || 16}
            onChange={(e) => onStylingChange({ font_size: Number(e.target.value) })}
            style={inputStyle}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Weight</label>
          <select value={block.styling.font_weight || 400} onChange={(e) => onStylingChange({ font_weight: Number(e.target.value) })} style={selectStyle}>
            {FONT_WEIGHTS.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
      </div>

      {/* Colors */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Text Color</label>
          <input
            type="color"
            value={block.styling.color || '#000000'}
            onChange={(e) => onStylingChange({ color: e.target.value })}
            style={{ width: '100%', height: 32, border: `1px solid ${bdr}`, borderRadius: 6, cursor: 'pointer', padding: 2, background: inp }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Background</label>
          <input
            type="color"
            value={block.styling.background_color && block.styling.background_color !== 'transparent' ? block.styling.background_color : '#ffffff'}
            onChange={(e) => onStylingChange({ background_color: e.target.value })}
            style={{ width: '100%', height: 32, border: `1px solid ${bdr}`, borderRadius: 6, cursor: 'pointer', padding: 2, background: inp }}
          />
        </div>
      </div>

      {/* Alignment */}
      <div>
        <label style={labelStyle}>Alignment</label>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['left', 'center', 'right', 'justify'] as const).map((a) => (
            <button
              key={a}
              onClick={() => onStylingChange({ text_align: a })}
              style={{
                flex: 1,
                padding: '4px 0',
                borderRadius: 5,
                border: `1px solid ${block.styling.text_align === a ? '#6366f1' : bdr}`,
                background: block.styling.text_align === a ? '#6366f1' : inp,
                color: block.styling.text_align === a ? '#fff' : mute,
                fontSize: 11,
                cursor: 'pointer',
                fontWeight: block.styling.text_align === a ? 700 : 400,
              }}
            >
              {a[0].toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── SlideEditor (legacy wrapper, kept for compat) ────────────────────────────

import type { Slide } from '../../types'

interface SlideEditorProps {
  slide: Slide
  onChange: (slide: Slide) => void
}

export function SlideEditor({ slide, onChange }: SlideEditorProps) {
  const updateBlock = (blockId: string, updates: Partial<Block>) => {
    onChange({ ...slide, blocks: slide.blocks.map((b) => (b.id === blockId ? { ...b, ...updates } : b)) })
  }
  const updateStyling = (blockId: string, updates: Partial<Styling>) => {
    const block = slide.blocks.find((b) => b.id === blockId)
    if (!block) return
    updateBlock(blockId, { styling: { ...block.styling, ...updates } })
  }
  const selectedBlock = slide.blocks[0] ?? null

  if (!selectedBlock) return null

  return (
    <PropertyPanel
      block={selectedBlock}
      onStylingChange={(u) => updateStyling(selectedBlock.id, u)}
      onContentChange={(c) => updateBlock(selectedBlock.id, { content: c })}
      onImageUpload={(url) => updateBlock(selectedBlock.id, { content: url })}
    />
  )
}
