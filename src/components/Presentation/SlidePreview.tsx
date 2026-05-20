import { useEffect, useRef } from 'react'
import type { Block, Position, Slide, Theme } from '../../types'
import { ChartElement } from './ChartElement'
import {
  Sparkles, Zap, Users, TrendingUp, Palette, ShieldCheck, Rocket, Award,
  Lightbulb, Globe, Target, Compass, MessageCircle, Database, Smartphone,
  Calendar, AlertTriangle, CheckCircle2, GraduationCap, ShoppingCart,
  Code2, Cloud, CircleCheck, BarChart3, DollarSign, PlugZap,
  type LucideIcon,
} from 'lucide-react'

// Gamma-style card icon registry. Backend emits icon names matching the
// _ICON_KEYWORDS map in slide_generator_agent.py. Unknown names fall back
// to CircleCheck so cards never render iconless.
const CARD_ICONS: Record<string, LucideIcon> = {
  'dollar-sign':     DollarSign,
  'bar-chart-3':     BarChart3,
  'sparkles':        Sparkles,
  'zap':             Zap,
  'users':           Users,
  'trending-up':     TrendingUp,
  'palette':         Palette,
  'shield-check':    ShieldCheck,
  'rocket':          Rocket,
  'award':           Award,
  'plug-zap':        PlugZap,
  'lightbulb':       Lightbulb,
  'globe':           Globe,
  'target':          Target,
  'compass':         Compass,
  'message-circle':  MessageCircle,
  'database':        Database,
  'smartphone':      Smartphone,
  'calendar':        Calendar,
  'alert-triangle':  AlertTriangle,
  'check-circle-2':  CheckCircle2,
  'graduation-cap':  GraduationCap,
  'shopping-cart':   ShoppingCart,
  'code-2':          Code2,
  'cloud':           Cloud,
  'circle-check':    CircleCheck,
}

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
  /** Total slides in deck — drives the "01 / N" progress chrome. */
  totalSlides?: number
  /** Deck title — shown as a subtle footer line. */
  deckTitle?: string
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
          background:   s.background_color || (theme?.colors.background ?? 'rgba(255,255,255,0.04)'),
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
    // Fallback gradient is derived from the current theme so that switching
    // theme actually changes the panel background. The previous hardcoded
    // dark gradient persisted across light/dark switches and made theme
    // changes appear to have no effect on panel-heavy template slides.
    const themeFallback = theme
      ? `linear-gradient(160deg, ${theme.colors.background} 0%, ${theme.colors.primary ?? theme.colors.accent} 100%)`
      : `linear-gradient(160deg, #0F172A 0%, #1E293B 100%)`
    const grad = s.background_color || themeFallback
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
    // Hero illustrations sit at either edge of the slide (left for split_panel
    // replacements, right for title/closing). Both variants get the same
    // blend treatment so the image visually merges into the slide.
    const isTitleIllustration = (pos.x >= 600 || pos.x === 0) && pos.h >= 400
    // Title-slide SQUARE photo flush to top-left corner (Gamma editorial
    // style — clean square, not curved). Detected by:
    // - x=0 (corner-flush)
    // - y=0 (top-corner-flush)
    // - square-ish dimensions (w ≈ h)
    // - large enough (h ≥ 400)
    // (Note: split_panel illustrations at x=0 are TALLER than wide, so the
    // square check `w ≈ h` distinguishes the two.)
    const isPhotoHeroLeft = pos.x === 0 && pos.y === 0 && pos.h >= 400 && Math.abs(pos.w - pos.h) < 100
    // Full-bleed background (Gamma "Industry Benchmark"-style title): the
    // image covers the whole slide canvas, text overlays on top. Detected by
    // x=0, y=0, w≈1280, h≈720.
    const isFullBleedBg = pos.x === 0 && pos.y === 0 && pos.w >= 1200 && pos.h >= 680

    // Theme detection (used for blend-mode + glow color).
    const tbg = theme?.colors?.background || ''
    const isDarkTheme = /^#[0-9a-f]{6}$/i.test(tbg) && (() => {
      const h = tbg.slice(1)
      const r = parseInt(h.slice(0, 2), 16)
      const g = parseInt(h.slice(2, 4), 16)
      const b = parseInt(h.slice(4, 6), 16)
      return (0.2126*r + 0.7152*g + 0.0722*b) / 255 < 0.35
    })()
    const themeAccent = theme?.colors?.accent || '#6366F1'

    // Gamma title illustrations blend INTO the slide. Two combined effects:
    // (a) Tight radial mask — only the center subject is fully opaque;
    //     edges fade to transparent fast so any image bg leftover disappears.
    // (b) `lighten` blend on dark themes — pixels darker than the slide bg
    //     vanish, only the brighter illustration shapes show through.
    //     `darken` on light themes does the inverse.
    const titleMask = isTitleIllustration
      ? 'radial-gradient(circle at center, #000 30%, rgba(0,0,0,0.7) 45%, rgba(0,0,0,0.15) 58%, transparent 68%)'
      : undefined
    const titleBlendMode: React.CSSProperties['mixBlendMode'] = isTitleIllustration
      ? (isDarkTheme ? 'lighten' : 'darken')
      : undefined

    if (isFullBleedBg) {
      // Full-bleed background photo (Gamma "Industry Benchmark"-style).
      // Two flavors:
      //   - title/closing: soft top-to-bottom vignette so the photo's depth
      //     reads through.
      //   - deck-wide bg on content slides (id starts "deck-bg-"): stronger
      //     uniform darkness so cards/text stay readable on top.
      const overlay = 'transparent'
      return (
        <div
          key={block.id}
          style={{
            ...baseStyle,
            borderRadius: 0,
            overflow: 'hidden',
          }}
          {...handlers}
        >
          <img
            src={block.content}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: overlay,
            }}
          />
        </div>
      )
    }

    if (isPhotoHeroLeft) {
      // Title-slide hero illustration: SQUARE flush to the top-left corner.
      // A tight right-edge alpha fade (final ~7% of width) dissolves any
      // residual seam between the AI-generated image and the slide canvas
      // when the image's background tone doesn't perfectly match. Still
      // reads as a square — not a curve — at presentation distance.
      const edgeFade =
        'linear-gradient(to right, #000 0%, #000 93%, transparent 100%)'
      return (
        <img
          key={block.id}
          src={block.content}
          alt=""
          draggable={false}
          style={{
            ...baseStyle,
            objectFit: 'cover',
            borderRadius: 0,
            WebkitMaskImage: edgeFade,
            maskImage: edgeFade,
          }}
          {...handlers}
        />
      )
    }

    if (isTitleIllustration) {
      // Wrap image in a positioned container so we can render an accent
      // glow underneath. The glow gives the illustration the "designed"
      // sense of presence Gamma achieves with hand-crafted compositions.
      return (
        <div
          key={block.id}
          style={{ ...baseStyle, overflow: 'visible' }}
          {...handlers}
        >
          {/* Accent radial glow behind the illustration */}
          <div style={{
            position: 'absolute',
            inset: '-10%',
            background: `radial-gradient(circle at 50% 50%, ${themeAccent}33 0%, ${themeAccent}11 35%, transparent 65%)`,
            filter: `blur(${8 * scale}px)`,
            pointerEvents: 'none',
          }} />
          <img
            src={block.content}
            alt=""
            draggable={false}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              maskImage:       titleMask,
              WebkitMaskImage: titleMask,
              mixBlendMode:    titleBlendMode,
              pointerEvents:   'none',
            }}
          />
        </div>
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
          borderRadius: pos.x === 0 ? 0 : 20 * scale,
          boxShadow:    pos.x === 0
            ? 'none'
            : `0 ${4 * scale}px ${16 * scale}px rgba(0,0,0,0.35)`,
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

    // Gamma-style icon at top-left of card (lucide-react). Backend emits
    // block.icon as a kebab-case Lucide name; we look up the component.
    const accentColor = theme?.colors.accent || '#6366f1'
    const Icon = block.icon ? CARD_ICONS[block.icon] : null
    const iconBg = isDarkCard ? `${accentColor}20` : 'rgba(0,0,0,0.06)'
    const iconColor = isDarkCard ? accentColor : (s.color || theme?.colors.primary || '#0F172A')

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
          gap:           10 * scale,
          boxSizing:     'border-box',
          boxShadow:     isDarkCard
            ? `0 ${8 * scale}px ${24 * scale}px rgba(0,0,0,0.25)`
            : `0 ${4 * scale}px ${16 * scale}px rgba(0,0,0,0.08), inset 0 0 0 ${scale}px rgba(0,0,0,0.06)`,
        }}
        {...handlers}
      >
        {Icon && (
          <div style={{
            width:           38 * scale,
            height:          38 * scale,
            borderRadius:    10 * scale,
            background:      iconBg,
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            flexShrink:      0,
            marginBottom:    4 * scale,
          }}>
            <Icon size={20 * scale} color={iconColor} strokeWidth={2} />
          </div>
        )}
        <span style={{
          fontFamily: s.font_family || 'Inter, sans-serif',
          fontSize:   (s.font_size ?? 18) * scale,
          fontWeight: textWeight({ ...s, font_weight: s.font_weight ?? 700 }),
          fontStyle:  s.italic ? 'italic' : 'normal',
          textDecoration: s.underline ? 'underline' : 'none',
          color:      s.color || '#ffffff',
          lineHeight: 1.25,
          letterSpacing: '-0.01em',
        }}>
          {title}
        </span>
        {body && (
          <span style={{
            fontFamily: s.font_family || 'Inter, sans-serif',
            fontSize:   (s.font_size ?? 18) * 0.7 * scale,
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
          background:     s.background_color || (theme?.colors.background ?? 'rgba(255,255,255,0.08)'),
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
        <span
          className="slide-heading"
          style={{
            // Inter Tight is a tighter display variant — produces visibly
            // sharper headlines than regular Inter at 52pt+.
            fontFamily:  s.font_family || '"Inter Tight", Inter, sans-serif',
            fontSize:    (s.font_size ?? 52) * scale,
            fontWeight:  textWeight({ ...s, font_weight: s.font_weight ?? 800 }),
            fontStyle:   s.italic ? 'italic' : 'normal',
            textDecoration: s.underline ? 'underline' : 'none',
            color:       s.color || theme?.colors.primary || '#0F172A',
            lineHeight:  1.05,
            textAlign:   (s.text_align as React.CSSProperties['textAlign']) ?? 'left',
            width:       '100%',
            letterSpacing: '-0.025em',
            // Better kerning for huge headlines.
            fontFeatureSettings: '"kern" 1, "ss01" 1, "cv11" 1',
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
  totalSlides,
  deckTitle,
}: Props) {
  const background = getBackground(slide, theme)
  const selectedBlock = editable
    ? (slide.blocks ?? []).find((b) => b.id === selectedBlockId) ?? null
    : null

  // Gamma-style chrome: subtle inset highlight + corner radius emphasise
  // the slide as a designed unit, without replacing the slide's own bg.
  const themeBg = theme?.colors?.background ?? '#FFFFFF'
  const isDarkTheme = /^#[0-9a-f]{6}$/i.test(themeBg) && (() => {
    const h = themeBg.slice(1)
    const r = parseInt(h.slice(0,2), 16)
    const g = parseInt(h.slice(2,4), 16)
    const b = parseInt(h.slice(4,6), 16)
    return (0.2126*r + 0.7152*g + 0.0722*b) / 255 < 0.35
  })()

  return (
    <div
      style={{
        width:     W * scale,
        height:    H * scale,
        background,
        position:  'relative',
        overflow:  'hidden',
        // Gamma uses ~24px rounded corners on slide cards.
        borderRadius: (isDarkTheme ? 20 : 6) * scale,
        // Crisper edge on dark themes — subtle inner highlight + outer shadow.
        boxShadow: isDarkTheme
          ? `0 ${8 * scale}px ${32 * scale}px rgba(0,0,0,0.55), inset 0 0 0 ${scale}px rgba(255,255,255,0.06)`
          : `0 ${4 * scale}px ${20 * scale}px rgba(0,0,0,0.18)`,
        flexShrink: 0,
      }}
      onClick={() => onBlockClick?.('')}
    >

      {/* Editor-only photographic backdrop (full-bleed image + dark overlay).
          Exporters never render this — PPTX/PDF use `background` only. */}
      {slide.editor_background?.image && (
        <>
          <img
            src={slide.editor_background.image}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              pointerEvents: 'none',
              userSelect: 'none',
              zIndex: 0,
            }}
          />
          {slide.editor_background.overlay && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: slide.editor_background.overlay,
              pointerEvents: 'none',
              zIndex: 1,
            }} />
          )}
        </>
      )}

      {/* Gamma-style "01 / 09" slide progress at top-right. */}
      <div style={{
        position:   'absolute',
        top:        18 * scale,
        right:      24 * scale,
        fontSize:   11 * scale,
        color:      isDarkTheme ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.45)',
        fontFamily: '"Inter Tight", Inter, sans-serif',
        fontWeight: 600,
        letterSpacing: '0.08em',
        zIndex:     10,
        pointerEvents: 'none',
      }}>
        {`${String(slide.order).padStart(2, '0')}${totalSlides ? ` / ${String(totalSlides).padStart(2, '0')}` : ''}`}
      </div>

      {/* Deck-title footer at bottom-left — subtle editorial chrome. */}
      {deckTitle && (
        <div style={{
          position:   'absolute',
          bottom:     18 * scale,
          left:       24 * scale,
          fontSize:   10 * scale,
          color:      isDarkTheme ? 'rgba(255,255,255,0.32)' : 'rgba(15,23,42,0.40)',
          fontFamily: '"Inter Tight", Inter, sans-serif',
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase' as const,
          maxWidth: (W - 100) * scale,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          zIndex: 10,
          pointerEvents: 'none',
        }}>
          {deckTitle}
        </div>
      )}

      {/* Subtle film-grain texture on dark themes — prevents flat-color look,
          common touch in premium editorial UIs. Pure SVG noise, no asset
          required. Very low opacity so it reads as texture not pattern. */}
      {isDarkTheme && (
        <svg
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0.04,
            mixBlendMode: 'overlay',
            pointerEvents: 'none',
            zIndex: 1,
          }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" seed="3" />
            <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      )}

      {(slide.blocks ?? []).map((block) => {
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
