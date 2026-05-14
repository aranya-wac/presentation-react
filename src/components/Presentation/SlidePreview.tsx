import { useEffect, useRef } from 'react'
import type { Block, Position, Slide, Theme } from '../../types'
import { ChartElement } from './ChartElement'

interface Props {
  slide: Slide
  theme?: Theme
  scale?: number
  selectedBlockId?: string | null
  editingBlockId?: string | null
  onBlockClick?: (blockId: string) => void
  onBlockDoubleClick?: (blockId: string) => void
  onBlockContentChange?: (blockId: string, newContent: string) => void
  /** Enables drag/resize handles. Off by default (so thumbnails stay static). */
  editable?: boolean
  /** Called whenever a block's position changes during drag or resize. */
  onBlockPositionChange?: (blockId: string, next: Position) => void
}

const W = 1280
const H = 720

function getBackground(slide: Slide, theme?: Theme): string {
  const bg = slide.background
  if (bg) {
    if (bg.type === 'gradient') return bg.value
    if (bg.type === 'image')    return `url(${bg.value}) center/cover no-repeat`
    if (bg.type === 'color')    return bg.value
  }
  return theme?.colors.background ?? '#F8FAFC'
}

// ── Drag helpers ──────────────────────────────────────────────────────────────

type ResizeDir = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'

function clampPos(p: Position): Position {
  // Allow some overshoot but keep elements at least partially on the slide.
  const minW = 20, minH = 20
  return {
    x: Math.max(-p.w + 40, Math.min(W - 40, p.x)),
    y: Math.max(-p.h + 40, Math.min(H - 40, p.y)),
    w: Math.max(minW, p.w),
    h: Math.max(minH, p.h),
  }
}

function applyResize(start: Position, dir: ResizeDir, dx: number, dy: number): Position {
  let { x, y, w, h } = start
  if (dir.includes('e')) w = start.w + dx
  if (dir.includes('s')) h = start.h + dy
  if (dir.includes('w')) { x = start.x + dx; w = start.w - dx }
  if (dir.includes('n')) { y = start.y + dy; h = start.h - dy }
  return clampPos({ x, y, w, h })
}

function startDrag(
  e: React.MouseEvent,
  start: Position,
  scale: number,
  onUpdate: (next: Position) => void,
) {
  const sx = e.clientX
  const sy = e.clientY
  const onMove = (ev: MouseEvent) => {
    const dx = (ev.clientX - sx) / scale
    const dy = (ev.clientY - sy) / scale
    onUpdate(clampPos({ ...start, x: start.x + dx, y: start.y + dy }))
  }
  const onUp = () => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

function startResize(
  e: React.MouseEvent,
  start: Position,
  dir: ResizeDir,
  scale: number,
  onUpdate: (next: Position) => void,
) {
  const sx = e.clientX
  const sy = e.clientY
  const onMove = (ev: MouseEvent) => {
    const dx = (ev.clientX - sx) / scale
    const dy = (ev.clientY - sy) / scale
    onUpdate(applyResize(start, dir, dx, dy))
  }
  const onUp = () => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

// ── Editing textarea ──────────────────────────────────────────────────────────

function EditingTextarea({
  block, scale, onChange, onCommit,
}: {
  block: Block
  scale: number
  onChange: (content: string) => void
  onCommit: () => void
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const s = block.styling

  useEffect(() => {
    ref.current?.focus()
    ref.current?.select()
  }, [])

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey)) {
      e.preventDefault()
      onCommit()
    }
  }

  return (
    <textarea
      ref={ref}
      defaultValue={block.content}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKey}
      onBlur={onCommit}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position:    'absolute',
        left:        block.position.x * scale,
        top:         block.position.y * scale,
        width:       block.position.w * scale,
        height:      block.position.h * scale,
        background:  'rgba(255,255,255,0.10)',
        border:      `${2 * scale}px solid #6366f1`,
        color:       s.color || '#ffffff',
        fontFamily:  s.font_family || 'Inter, sans-serif',
        fontSize:    (s.font_size ?? 16) * scale,
        fontWeight:  s.bold ? 800 : (s.font_weight ?? 400),
        fontStyle:   s.italic ? 'italic' : 'normal',
        textDecoration: s.underline ? 'underline' : 'none',
        textAlign:   (s.text_align as React.CSSProperties['textAlign']) ?? 'left',
        resize:      'none',
        padding:     `${4 * scale}px`,
        lineHeight:  1.4,
        outline:     'none',
        borderRadius: 4 * scale,
        boxSizing:   'border-box',
      }}
    />
  )
}

// ── Block renderer ────────────────────────────────────────────────────────────

interface RenderCtx {
  scale: number
  theme?: Theme
  isSelected: boolean
  editable: boolean
  onBlockClick?: (id: string) => void
  onBlockDoubleClick?: (id: string) => void
  onBlockPositionChange?: (id: string, p: Position) => void
}

function blockHandlers(block: Block, ctx: RenderCtx) {
  const { editable, onBlockClick, onBlockDoubleClick, onBlockPositionChange, scale } = ctx

  return {
    onMouseDown: (e: React.MouseEvent) => {
      if (!editable) return
      if (e.button !== 0) return
      e.stopPropagation()
      onBlockClick?.(block.id)
      if (onBlockPositionChange) {
        startDrag(e, block.position, scale, (p) => onBlockPositionChange(block.id, p))
      }
    },
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!editable) onBlockClick?.(block.id)
    },
    onDoubleClick: (e: React.MouseEvent) => {
      e.stopPropagation()
      onBlockDoubleClick?.(block.id)
    },
  }
}

function textWeight(s: Block['styling']): number {
  if (s.bold) return 800
  return s.font_weight ?? 400
}

function renderBlock(block: Block, ctx: RenderCtx) {
  const { scale, theme, isSelected, editable } = ctx
  const s   = block.styling
  const pos = block.position

  const baseStyle: React.CSSProperties = {
    position:   'absolute',
    left:       pos.x * scale,
    top:        pos.y * scale,
    width:      pos.w * scale,
    height:     pos.h * scale,
    overflow:   'hidden',
    boxSizing:  'border-box',
    cursor:     editable ? 'move' : (ctx.onBlockClick ? 'pointer' : 'default'),
    outline:    isSelected ? `${2 * scale}px solid #6366f1` : 'none',
    outlineOffset: 2 * scale,
    userSelect: editable ? 'none' : 'auto',
  }

  const handlers = blockHandlers(block, ctx)

  // ── Chart block ───────────────────────────────────────────────────────
  if (block.type === 'chart') {
    return (
      <div
        key={block.id}
        style={{
          ...baseStyle,
          background:   s.background_color || 'rgba(255,255,255,0.04)',
          borderRadius: 12 * scale,
          padding:      8 * scale,
        }}
        {...handlers}
      >
        <ChartElement
          chartType={block.chart_type ?? 'bar'}
          data={block.chart_data ?? []}
          theme={theme}
          scale={scale}
        />
      </div>
    )
  }

  // ── Panel block ───────────────────────────────────────────────────────
  if (block.type === 'panel') {
    const grad = s.background_color || `linear-gradient(160deg, #0F172A 0%, #1E293B 100%)`
    return (
      <div key={block.id} style={{ ...baseStyle, background: grad, borderRadius: 0 }} {...handlers} />
    )
  }

  // ── Shape ─────────────────────────────────────────────────────────────
  if (block.type === 'shape') {
    const bg = s.background_color || s.color || theme?.colors.accent || '#6366f1'
    return (
      <div
        key={block.id}
        style={{ ...baseStyle, background: bg, borderRadius: Math.min(pos.h, pos.w) * scale * 0.5 }}
        {...handlers}
      />
    )
  }

  // ── Image ─────────────────────────────────────────────────────────────
  if (block.type === 'image') {
    if (!block.content) {
      return (
        <div
          key={block.id}
          style={{
            ...baseStyle,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.04)',
            border: `${scale}px dashed rgba(255,255,255,0.2)`,
            color: 'rgba(255,255,255,0.4)', fontSize: 12 * scale,
            borderRadius: 8 * scale,
          }}
          {...handlers}
        >No image</div>
      )
    }
    return (
      <img
        key={block.id}
        src={block.content}
        alt=""
        draggable={false}
        style={{
          ...baseStyle,
          objectFit:    'cover',
          borderRadius: pos.x === 0 ? 0 : 12 * scale,
        }}
        {...handlers}
      />
    )
  }

  // ── Badge ─────────────────────────────────────────────────────────────
  if (block.type === 'badge') {
    const borderColor = s.color || theme?.colors.accent || '#6366f1'
    return (
      <div
        key={block.id}
        style={{
          ...baseStyle,
          display:        'inline-flex',
          alignItems:     'center',
          border:         `${1.5 * scale}px solid ${borderColor}`,
          borderRadius:   100 * scale,
          padding:        `0 ${10 * scale}px`,
          background:     `${borderColor}12`,
          overflow:       'visible',
        }}
        {...handlers}
      >
        <span style={{
          fontFamily:    s.font_family || 'Inter, sans-serif',
          fontSize:      (s.font_size ?? 11) * scale,
          fontWeight:    textWeight(s),
          fontStyle:     s.italic ? 'italic' : 'normal',
          textDecoration: s.underline ? 'underline' : 'none',
          color:         borderColor,
          letterSpacing: 0.1 * (s.font_size ?? 11) * scale,
          textTransform: 'uppercase' as const,
          whiteSpace:    'nowrap',
        }}>
          {block.content}
        </span>
      </div>
    )
  }

  // ── Card ──────────────────────────────────────────────────────────────
  if (block.type === 'card') {
    const bgColor = s.background_color || theme?.colors.primary || '#0F172A'
    const lines   = block.content.split('\n').filter(Boolean)
    const title   = lines[0] || ''
    const body    = lines.slice(1).join(' ')
    const isDarkCard = bgColor.startsWith('#') &&
      parseInt(bgColor.slice(1), 16) < 0x888888 * 3

    return (
      <div
        key={block.id}
        style={{
          ...baseStyle,
          background:    bgColor,
          borderRadius:  16 * scale,
          padding:       `${18 * scale}px ${20 * scale}px`,
          display:       'flex',
          flexDirection: 'column',
          justifyContent:'flex-start',
          gap:           6 * scale,
          boxSizing:     'border-box',
          boxShadow:     isDarkCard
            ? `0 ${8 * scale}px ${24 * scale}px rgba(0,0,0,0.25)`
            : `0 ${4 * scale}px ${16 * scale}px rgba(0,0,0,0.08), inset 0 0 0 ${scale}px rgba(0,0,0,0.06)`,
        }}
        {...handlers}
      >
        <span style={{
          fontFamily: s.font_family || 'Inter, sans-serif',
          fontSize:   (s.font_size ?? 18) * scale,
          fontWeight: textWeight({ ...s, font_weight: s.font_weight ?? 700 }),
          fontStyle:  s.italic ? 'italic' : 'normal',
          textDecoration: s.underline ? 'underline' : 'none',
          color:      s.color || '#ffffff',
          lineHeight: 1.3,
        }}>
          {title}
        </span>
        {body && (
          <span style={{
            fontFamily: s.font_family || 'Inter, sans-serif',
            fontSize:   (s.font_size ?? 18) * 0.75 * scale,
            fontWeight: 400,
            color:      s.color ? `${s.color}b0` : 'rgba(255,255,255,0.72)',
            lineHeight: 1.5,
          }}>
            {body}
          </span>
        )}
      </div>
    )
  }

  // ── Process circle ────────────────────────────────────────────────────
  if (block.type === 'process_circle') {
    const bgColor = s.background_color || theme?.colors.accent || '#6366f1'
    const lines   = block.content.split('\n').filter(Boolean)
    return (
      <div
        key={block.id}
        style={{
          ...baseStyle,
          background:     bgColor,
          borderRadius:   '50%',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          padding:        `${12 * scale}px`,
          gap:            3 * scale,
          textAlign:      'center',
          boxShadow:      `0 ${6 * scale}px ${20 * scale}px ${bgColor}60`,
        }}
        {...handlers}
      >
        {lines.map((line, i) => (
          <span key={i} style={{
            fontFamily: s.font_family || 'Inter, sans-serif',
            fontSize:   (i === 0 ? s.font_size ?? 16 : (s.font_size ?? 16) * 0.75) * scale,
            fontWeight: i === 0 ? textWeight({ ...s, font_weight: s.font_weight ?? 700 }) : 400,
            color:      s.color || '#ffffff',
            lineHeight: 1.2,
          }}>
            {line}
          </span>
        ))}
      </div>
    )
  }

  // ── Stat ──────────────────────────────────────────────────────────────
  if (block.type === 'stat') {
    const [value, ...labelParts] = block.content.split('\n')
    const label = labelParts.join(' ')
    return (
      <div
        key={block.id}
        style={{
          ...baseStyle,
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          background:     s.background_color || 'rgba(255,255,255,0.08)',
          borderRadius:   16 * scale,
          border:         `${scale}px solid rgba(255,255,255,0.12)`,
          padding:        `${16 * scale}px`,
          gap:            6 * scale,
          boxShadow:      `0 ${4 * scale}px ${24 * scale}px rgba(0,0,0,0.15)`,
        }}
        {...handlers}
      >
        <span style={{
          fontFamily: s.font_family || 'Inter, sans-serif',
          fontSize:   (s.font_size ?? 60) * scale,
          fontWeight: textWeight({ ...s, font_weight: s.font_weight ?? 800 }),
          color:      s.color || theme?.colors.accent || '#6366f1',
          lineHeight: 1,
        }}>
          {value}
        </span>
        {label && (
          <span style={{
            fontFamily: s.font_family || 'Inter, sans-serif',
            fontSize:   16 * scale,
            fontWeight: 500,
            color:      'rgba(255,255,255,0.65)',
            textAlign:  'center',
            lineHeight: 1.3,
          }}>
            {label}
          </span>
        )}
      </div>
    )
  }

  // ── Quote ─────────────────────────────────────────────────────────────
  if (block.type === 'quote') {
    return (
      <div
        key={block.id}
        style={{ ...baseStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: `0 ${20 * scale}px` }}
        {...handlers}
      >
        <p style={{
          fontFamily: s.font_family || 'Georgia, serif',
          fontSize:   (s.font_size ?? 30) * scale,
          fontWeight: textWeight(s),
          fontStyle:  s.italic === false ? 'normal' : 'italic',
          textDecoration: s.underline ? 'underline' : 'none',
          color:      s.color || '#ffffff',
          textAlign:  (s.text_align as React.CSSProperties['textAlign']) ?? 'center',
          lineHeight: 1.65,
          margin:     0,
        }}>
          {block.content}
        </p>
      </div>
    )
  }

  // ── Bullet list ───────────────────────────────────────────────────────
  if (block.type === 'bullet') {
    const lines = block.content.split('\n').filter(Boolean)
    return (
      <div
        key={block.id}
        style={{ ...baseStyle, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: 10 * scale, padding: `${6 * scale}px 0` }}
        {...handlers}
      >
        {lines.map((line, idx) => {
          const clean = line.replace(/^[•\-\*]\s*/, '')
          const boldMatch = clean.match(/^\*\*(.+?)\*\*:\s*(.*)$/)
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 * scale }}>
              <span style={{
                minWidth:    8 * scale,
                width:       8 * scale,
                height:      8 * scale,
                borderRadius:'50%',
                background:  theme?.colors.accent || theme?.colors.primary || '#6366f1',
                marginTop:   (s.font_size ?? 22) * scale * 0.38,
                flexShrink:  0,
              }} />
              <span style={{
                fontFamily: s.font_family || 'Inter, sans-serif',
                fontSize:   (s.font_size ?? 22) * scale,
                fontWeight: textWeight(s),
                fontStyle:  s.italic ? 'italic' : 'normal',
                textDecoration: s.underline ? 'underline' : 'none',
                color:      s.color || theme?.colors.text || '#0F172A',
                lineHeight: 1.55,
                textAlign:  (s.text_align as React.CSSProperties['textAlign']) ?? 'left',
              }}>
                {boldMatch ? (
                  <>
                    <strong style={{ fontWeight: 700 }}>{boldMatch[1]}:</strong>{' '}{boldMatch[2]}
                  </>
                ) : clean}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  // ── Title / Heading ───────────────────────────────────────────────────
  if (block.type === 'title' || block.type === 'heading') {
    return (
      <div
        key={block.id}
        style={{ ...baseStyle, display: 'flex', alignItems: 'center' }}
        {...handlers}
      >
        <span style={{
          fontFamily:  s.font_family || 'Inter, sans-serif',
          fontSize:    (s.font_size ?? 52) * scale,
          fontWeight:  textWeight({ ...s, font_weight: s.font_weight ?? 800 }),
          fontStyle:   s.italic ? 'italic' : 'normal',
          textDecoration: s.underline ? 'underline' : 'none',
          color:       s.color || theme?.colors.primary || '#0F172A',
          lineHeight:  1.15,
          textAlign:   (s.text_align as React.CSSProperties['textAlign']) ?? 'left',
          width:       '100%',
          letterSpacing: -0.5 * scale,
        }}>
          {block.content}
        </span>
      </div>
    )
  }

  // ── Subtitle / Caption / Generic text ─────────────────────────────────
  return (
    <div
      key={block.id}
      style={{ ...baseStyle, display: 'flex', alignItems: 'center', padding: `0 ${block.type === 'caption' ? 8 * scale : 0}px` }}
      {...handlers}
    >
      <span style={{
        fontFamily: s.font_family || 'Inter, sans-serif',
        fontSize:   (s.font_size ?? 16) * scale,
        fontWeight: textWeight(s),
        fontStyle:  s.italic ? 'italic' : 'normal',
        textDecoration: s.underline ? 'underline' : 'none',
        color:      s.color || theme?.colors.text || '#64748B',
        lineHeight: 1.55,
        textAlign:  (s.text_align as React.CSSProperties['textAlign']) ?? 'left',
        width:      '100%',
      }}>
        {block.content}
      </span>
    </div>
  )
}

// ── Resize handles overlay ────────────────────────────────────────────────────

function ResizeHandles({
  block, scale, onPositionChange,
}: {
  block: Block
  scale: number
  onPositionChange: (next: Position) => void
}) {
  const pos = block.position
  const HANDLE = 10
  const half = HANDLE / 2

  const left   = pos.x * scale
  const top    = pos.y * scale
  const width  = pos.w * scale
  const height = pos.h * scale

  const handles: { dir: ResizeDir; x: number; y: number; cursor: string }[] = [
    { dir: 'nw', x: left,           y: top,            cursor: 'nwse-resize' },
    { dir: 'n',  x: left + width/2, y: top,            cursor: 'ns-resize'   },
    { dir: 'ne', x: left + width,   y: top,            cursor: 'nesw-resize' },
    { dir: 'e',  x: left + width,   y: top + height/2, cursor: 'ew-resize'   },
    { dir: 'se', x: left + width,   y: top + height,   cursor: 'nwse-resize' },
    { dir: 's',  x: left + width/2, y: top + height,   cursor: 'ns-resize'   },
    { dir: 'sw', x: left,           y: top + height,   cursor: 'nesw-resize' },
    { dir: 'w',  x: left,           y: top + height/2, cursor: 'ew-resize'   },
  ]

  return (
    <>
      {handles.map((h) => (
        <div
          key={h.dir}
          onMouseDown={(e) => {
            e.stopPropagation()
            startResize(e, pos, h.dir, scale, onPositionChange)
          }}
          style={{
            position: 'absolute',
            left: h.x - half,
            top:  h.y - half,
            width: HANDLE, height: HANDLE,
            background: '#fff',
            border: '1.5px solid #6366f1',
            borderRadius: 2,
            cursor: h.cursor,
            zIndex: 5,
            boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
          }}
        />
      ))}
    </>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function SlidePreview({
  slide,
  theme,
  scale = 0.3,
  selectedBlockId,
  editingBlockId,
  onBlockClick,
  onBlockDoubleClick,
  onBlockContentChange,
  editable = false,
  onBlockPositionChange,
}: Props) {
  const background = getBackground(slide, theme)
  const selectedBlock = editable
    ? slide.blocks.find((b) => b.id === selectedBlockId) ?? null
    : null

  return (
    <div
      style={{
        width:     W * scale,
        height:    H * scale,
        background,
        position:  'relative',
        overflow:  'hidden',
        borderRadius: 6 * scale,
        boxShadow: `0 ${4 * scale}px ${20 * scale}px rgba(0,0,0,0.18)`,
        flexShrink: 0,
      }}
      onClick={() => onBlockClick?.('')}
    >
      <div style={{
        position:   'absolute',
        bottom:     10 * scale,
        right:      16 * scale,
        fontSize:   11 * scale,
        color:      'rgba(255,255,255,0.28)',
        fontFamily: 'Inter, sans-serif',
        zIndex:     10,
        fontWeight: 600,
        pointerEvents: 'none',
      }}>
        {slide.order}
      </div>

      {slide.blocks.map((block) => {
        const isEditing  = editingBlockId === block.id
        const isSelected = selectedBlockId === block.id

        if (isEditing && block.type !== 'image' && block.type !== 'shape' && block.type !== 'panel' && block.type !== 'chart') {
          return (
            <EditingTextarea
              key={block.id}
              block={block}
              scale={scale}
              onChange={(c) => onBlockContentChange?.(block.id, c)}
              onCommit={() => onBlockClick?.(block.id) /* exits editing, keeps selection */}
            />
          )
        }

        return renderBlock(block, {
          scale, theme, isSelected, editable,
          onBlockClick, onBlockDoubleClick, onBlockPositionChange,
        })
      })}

      {/* Resize handles for the selected block (editor mode only) */}
      {editable && selectedBlock && onBlockPositionChange && editingBlockId !== selectedBlock.id && (
        <ResizeHandles
          block={selectedBlock}
          scale={scale}
          onPositionChange={(p) => onBlockPositionChange(selectedBlock.id, p)}
        />
      )}
    </div>
  )
}
