import { X, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import type { Block, Theme } from '../../types'

interface Props {
  block: Block | null
  theme?: Theme | null
  onClose: () => void
  onChange: (patch: Partial<Block>) => void
}

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: '#475569' }}>
      {label}
    </p>
  )
}

function Divider() {
  return <div className="my-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
}

const BLOCK_LABELS: Record<string, string> = {
  title: 'Title', heading: 'Heading', subtitle: 'Subtitle', text: 'Text',
  caption: 'Caption', bullet: 'Bullet List', card: 'Card', stat: 'Stat',
  quote: 'Quote', badge: 'Badge', image: 'Image', shape: 'Shape',
  panel: 'Panel', process_circle: 'Process Circle',
}

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 52, 60, 72]

const SWATCHES = ['#ffffff', '#000000', '#0f172a', '#1e293b', '#6366f1', '#a855f7',
                  '#00c9a7', '#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#f97316']

function ColorSwatch({
  color, active, onClick, label,
}: { color: string; active: boolean; onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      title={label ?? color}
      className="rounded-full border-2 transition-all flex-shrink-0"
      style={{
        width: 22, height: 22,
        background: color,
        borderColor: active ? '#6366f1' : 'rgba(255,255,255,0.12)',
        transform: active ? 'scale(1.25)' : 'scale(1)',
        boxShadow: active ? '0 0 0 1px #6366f1' : 'none',
      }}
    />
  )
}

function InputField({ value, onChange, rows = 1, placeholder, bold }: {
  value: string; onChange: (v: string) => void; rows?: number; placeholder?: string; bold?: boolean
}) {
  return rows > 1 ? (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full rounded-lg text-white text-[13px] px-3 py-2 outline-none resize-none"
      style={{
        background: '#0a0f1a',
        border: '1px solid rgba(99,102,241,0.25)',
        lineHeight: 1.55,
        fontWeight: bold ? 700 : 400,
      }}
    />
  ) : (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg text-white text-[13px] px-3 py-2 outline-none"
      style={{
        background: '#0a0f1a',
        border: '1px solid rgba(99,102,241,0.25)',
        fontWeight: bold ? 700 : 400,
      }}
    />
  )
}

export function BlockEditorPanel({ block, theme, onClose, onChange }: Props) {
  if (!block) {
    return (
      <div
        className="flex flex-col h-full items-center justify-center"
        style={{ width: 264, borderLeft: '1px solid rgba(255,255,255,0.07)', background: '#0d1526' }}
      >
        <div className="text-center px-6">
          <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <p className="text-[13px] font-medium mb-1" style={{ color: '#475569' }}>No block selected</p>
          <p className="text-[11px]" style={{ color: '#334155' }}>Click any block on the slide to edit its properties</p>
        </div>
      </div>
    )
  }

  const s = block.styling
  const isBullet = block.type === 'bullet'
  const isCard = block.type === 'card'
  const isStat = block.type === 'stat'
  const isShape = block.type === 'shape' || block.type === 'panel'
  const isImage = block.type === 'image'

  const bulletLines = isBullet
    ? block.content.split('\n').filter(Boolean).map((l) => l.replace(/^[•\-\*]\s*/, ''))
    : []

  const updateBullets = (lines: string[]) =>
    onChange({ content: lines.map((l) => `• ${l}`).join('\n') })

  const setStyling = (patch: Record<string, unknown>) =>
    onChange({ styling: { ...s, ...patch } as Block['styling'] })

  const curSize = s.font_size ?? 22
  const curWeight = s.font_weight ?? 400
  const curAlign = s.text_align ?? 'left'

  const paletteColors = theme
    ? [theme.colors.primary, theme.colors.accent, theme.colors.background, theme.colors.text]
    : []
  const colorList = [...new Set([...paletteColors, ...SWATCHES])].slice(0, 12)

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ width: 264, borderLeft: '1px solid rgba(255,255,255,0.07)', background: '#0d1526' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <span
          className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}
        >
          {BLOCK_LABELS[block.type] ?? block.type}
        </span>
        <button
          onClick={onClose}
          className="rounded-lg p-1 transition-colors hover:bg-slate-800 text-slate-500 hover:text-white"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── CONTENT ─── */}
        {!isShape && !isImage && (
          <div className="px-4 pt-4 pb-3">
            <SectionHeader label="Content" />

            {!isBullet && !isCard && !isStat && (
              <InputField
                value={block.content}
                onChange={(v) => onChange({ content: v })}
                rows={block.type === 'quote' ? 4 : block.type === 'title' ? 2 : 3}
              />
            )}

            {isBullet && (
              <div className="flex flex-col gap-1.5">
                {bulletLines.map((line, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[10px] flex-shrink-0" style={{ color: '#6366f1' }}>•</span>
                    <input
                      value={line}
                      onChange={(e) => {
                        const updated = [...bulletLines]
                        updated[idx] = e.target.value
                        updateBullets(updated)
                      }}
                      className="flex-1 rounded-lg text-white text-[13px] px-2.5 py-1.5 outline-none"
                      style={{ background: '#0a0f1a', border: '1px solid rgba(99,102,241,0.2)', minWidth: 0 }}
                    />
                    <button
                      onClick={() => updateBullets(bulletLines.filter((_, i) => i !== idx))}
                      className="flex-shrink-0 text-slate-600 hover:text-red-400 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => updateBullets([...bulletLines, ''])}
                  className="text-[12px] mt-1 text-left transition-colors"
                  style={{ color: '#6366f1' }}
                >
                  + Add bullet
                </button>
              </div>
            )}

            {isCard && (
              <div className="flex flex-col gap-2.5">
                <div>
                  <p className="text-[10px] mb-1" style={{ color: '#475569' }}>Title</p>
                  <InputField
                    value={block.content.split('\n')[0] ?? ''}
                    onChange={(v) => {
                      const rest = block.content.split('\n').slice(1).join('\n')
                      onChange({ content: rest ? `${v}\n${rest}` : v })
                    }}
                    bold
                  />
                </div>
                <div>
                  <p className="text-[10px] mb-1" style={{ color: '#475569' }}>Body</p>
                  <InputField
                    value={block.content.split('\n').slice(1).join('\n')}
                    onChange={(v) => {
                      const title = block.content.split('\n')[0] ?? ''
                      onChange({ content: v ? `${title}\n${v}` : title })
                    }}
                    rows={3}
                  />
                </div>
              </div>
            )}

            {isStat && (
              <div className="flex flex-col gap-2.5">
                <div>
                  <p className="text-[10px] mb-1" style={{ color: '#475569' }}>Value</p>
                  <InputField
                    value={block.content.split('\n')[0] ?? ''}
                    onChange={(v) => {
                      const label = block.content.split('\n').slice(1).join('\n')
                      onChange({ content: label ? `${v}\n${label}` : v })
                    }}
                    bold
                    placeholder="47%"
                  />
                </div>
                <div>
                  <p className="text-[10px] mb-1" style={{ color: '#475569' }}>Label</p>
                  <InputField
                    value={block.content.split('\n').slice(1).join(' ')}
                    onChange={(v) => {
                      const val = block.content.split('\n')[0] ?? ''
                      onChange({ content: v ? `${val}\n${v}` : val })
                    }}
                    placeholder="Cost Reduction"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {!isShape && !isImage && <Divider />}

        {/* ── TYPOGRAPHY ─── */}
        {!isShape && !isImage && (
          <div className="px-4 py-3">
            <SectionHeader label="Typography" />

            {/* Font size */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px]" style={{ color: '#64748b' }}>Size</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const i = FONT_SIZES.indexOf(curSize)
                    if (i > 0) setStyling({ font_size: FONT_SIZES[i - 1] })
                  }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold transition-colors"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}
                >−</button>
                <span className="text-white text-[13px] font-mono w-8 text-center tabular-nums">{curSize}</span>
                <button
                  onClick={() => {
                    const i = FONT_SIZES.indexOf(curSize)
                    if (i < FONT_SIZES.length - 1) setStyling({ font_size: FONT_SIZES[i + 1] })
                  }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold transition-colors"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}
                >+</button>
              </div>
            </div>

            {/* Font weight */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px]" style={{ color: '#64748b' }}>Weight</span>
              <div className="flex gap-1">
                {([['400', 'Reg'], ['600', 'Sem'], ['700', 'Bld'], ['800', 'Blk']] as const).map(([w, lbl]) => (
                  <button
                    key={w}
                    onClick={() => setStyling({ font_weight: Number(w) })}
                    className="rounded text-[11px] px-1.5 py-1 transition-colors"
                    style={{
                      background: curWeight === Number(w) ? '#6366f1' : 'rgba(255,255,255,0.06)',
                      color: curWeight === Number(w) ? '#fff' : '#64748b',
                      fontWeight: Number(w),
                    }}
                  >{lbl}</button>
                ))}
              </div>
            </div>

            {/* Alignment */}
            {block.type !== 'bullet' && (
              <div className="flex items-center justify-between">
                <span className="text-[12px]" style={{ color: '#64748b' }}>Align</span>
                <div className="flex gap-1">
                  {(['left', 'center', 'right'] as const).map((a) => {
                    const Icon = a === 'left' ? AlignLeft : a === 'center' ? AlignCenter : AlignRight
                    return (
                      <button
                        key={a}
                        onClick={() => setStyling({ text_align: a })}
                        className="w-8 h-7 rounded-lg flex items-center justify-center transition-colors"
                        style={{
                          background: curAlign === a ? '#6366f1' : 'rgba(255,255,255,0.06)',
                          color: curAlign === a ? '#fff' : '#64748b',
                        }}
                      >
                        <Icon size={13} />
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {!isShape && !isImage && <Divider />}

        {/* ── COLORS ─── */}
        <div className="px-4 py-3">
          <SectionHeader label="Colors" />

          {!isShape && (
            <div className="mb-3">
              <p className="text-[11px] mb-2" style={{ color: '#475569' }}>Text</p>
              <div className="flex flex-wrap gap-1.5">
                {colorList.map((c) => (
                  <ColorSwatch key={c} color={c} active={s.color === c} onClick={() => setStyling({ color: c })} />
                ))}
                <label className="relative cursor-pointer" title="Custom">
                  <input
                    type="color"
                    value={s.color ?? '#ffffff'}
                    onChange={(e) => setStyling({ color: e.target.value })}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                  <div
                    className="rounded-full flex items-center justify-center text-[10px]"
                    style={{ width: 22, height: 22, background: s.color ?? 'rgba(255,255,255,0.08)', border: '1px dashed rgba(255,255,255,0.3)', color: '#64748b' }}
                  >+</div>
                </label>
              </div>
            </div>
          )}

          <div>
            <p className="text-[11px] mb-2" style={{ color: '#475569' }}>Background</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setStyling({ background_color: undefined })}
                className="rounded-full flex items-center justify-center text-[10px] flex-shrink-0"
                style={{
                  width: 22, height: 22,
                  border: !s.background_color ? '2px solid #6366f1' : '1px dashed rgba(255,255,255,0.3)',
                  color: '#64748b',
                }}
                title="None"
              >∅</button>
              {colorList.map((c) => (
                <ColorSwatch
                  key={c}
                  color={c}
                  active={s.background_color === c}
                  onClick={() => setStyling({ background_color: c })}
                />
              ))}
              <label className="relative cursor-pointer" title="Custom">
                <input
                  type="color"
                  value={s.background_color ?? '#1e293b'}
                  onChange={(e) => setStyling({ background_color: e.target.value })}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
                <div
                  className="rounded-full flex items-center justify-center text-[10px]"
                  style={{ width: 22, height: 22, background: s.background_color ?? 'rgba(255,255,255,0.08)', border: '1px dashed rgba(255,255,255,0.3)', color: '#64748b' }}
                >+</div>
              </label>
            </div>
          </div>
        </div>

        <Divider />

        {/* ── POSITION ─── */}
        <div className="px-4 py-3">
          <SectionHeader label="Position" />
          <div className="grid grid-cols-2 gap-1.5">
            {([['X', block.position.x], ['Y', block.position.y], ['W', block.position.w], ['H', block.position.h]] as const).map(([lbl, val]) => (
              <div
                key={lbl}
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <span className="text-[10px] font-mono" style={{ color: '#475569', width: 12 }}>{lbl}</span>
                <span className="text-[12px] font-mono" style={{ color: '#94a3b8' }}>{Math.round(val)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
