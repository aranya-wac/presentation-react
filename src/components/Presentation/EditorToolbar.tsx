import { useEffect, useRef, useState } from 'react'
import type { Block, Styling } from '../../types'
import type { SlideTemplateKind } from './AddSlideMenu'

type SaveStatus = 'idle' | 'saving' | 'saved'

interface Props {
  block: Block | null
  saveStatus: SaveStatus
  onStylingChange: (updates: Partial<Styling>) => void
  onInsertText: () => void
  onInsertImage: () => void
  onInsertChart: () => void
  onAddSlide: (kind: SlideTemplateKind) => void
  onApplyLayout: (kind: SlideTemplateKind) => void
  onPreview: () => void
  onDelete: () => void
  onEditChart?: () => void
  onRegenerateSlide?: () => void
  regenerating?: boolean
}

const TEXT_TYPES = new Set(['title', 'heading', 'subtitle', 'body', 'text', 'caption', 'quote', 'bullet', 'badge', 'card'])
const isTextBlock = (b: Block | null) => !!b && TEXT_TYPES.has(b.type)

const LAYOUTS: { id: SlideTemplateKind; label: string; hint: string }[] = [
  { id: 'title',   label: 'Title',   hint: 'Big title + subtitle' },
  { id: 'agenda',  label: 'Agenda',  hint: 'Heading + bullets'    },
  { id: 'content', label: 'Content', hint: 'Heading + body'       },
  { id: 'blank',   label: 'Blank',   hint: 'Empty canvas'         },
]

export function EditorToolbar({
  block, saveStatus,
  onStylingChange, onInsertText, onInsertImage, onInsertChart,
  onAddSlide, onApplyLayout, onPreview, onDelete, onEditChart,
  onRegenerateSlide, regenerating,
}: Props) {
  const s = block?.styling
  const align = s?.text_align ?? 'left'
  const textActive = isTextBlock(block)
  const isChart = block?.type === 'chart'

  const [layoutOpen, setLayoutOpen] = useState(false)
  const [slideOpen, setSlideOpen]   = useState(false)
  const layoutRef = useRef<HTMLDivElement>(null)
  const slideRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!layoutOpen && !slideOpen) return
    const close = (e: MouseEvent) => {
      if (layoutOpen  && !layoutRef.current?.contains(e.target as Node)) setLayoutOpen(false)
      if (slideOpen   && !slideRef.current?.contains(e.target as Node))  setSlideOpen(false)
    }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [layoutOpen, slideOpen])

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        background: '#ffffff',
        border: '1px solid #E5E7EB',
        borderRadius: 12,
        padding: '6px 10px',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
        height: 48,
        color: '#374151',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Insert group */}
      <Item icon={<IconText />}   label="Text"   onClick={onInsertText}   />
      <Item icon={<IconImage />}  label="Image"  onClick={onInsertImage}  />
      <Item icon={<IconChart />}  label="Chart"  onClick={onInsertChart}  />

      <div ref={layoutRef} style={{ position: 'relative' }}>
        <Item
          icon={<IconLayout />}
          label="Layout"
          onClick={() => { setLayoutOpen((v) => !v); setSlideOpen(false) }}
          active={layoutOpen}
        />
        {layoutOpen && (
          <TemplatePopover
            heading="Apply layout to current slide"
            onPick={(kind) => { onApplyLayout(kind); setLayoutOpen(false) }}
          />
        )}
      </div>

      <div ref={slideRef} style={{ position: 'relative' }}>
        <Item
          icon={<IconPlusSlide />}
          label="Slide"
          onClick={() => { setSlideOpen((v) => !v); setLayoutOpen(false) }}
          active={slideOpen}
        />
        {slideOpen && (
          <TemplatePopover
            heading="Add a new slide"
            onPick={(kind) => { onAddSlide(kind); setSlideOpen(false) }}
          />
        )}
      </div>

      {onRegenerateSlide && (
        <Item
          icon={<IconSparkle />}
          label={regenerating ? 'Regenerating…' : 'Regenerate'}
          onClick={regenerating ? () => {} : onRegenerateSlide}
          active={!!regenerating}
        />
      )}

      <Divider />

      {/* Format group */}
      <IconBtn
        title="Bold"
        disabled={!textActive}
        active={!!s?.bold}
        onClick={() => onStylingChange({ bold: !s?.bold })}
      ><IconBold /></IconBtn>
      <IconBtn
        title="Italic"
        disabled={!textActive}
        active={!!s?.italic}
        onClick={() => onStylingChange({ italic: !s?.italic })}
      ><IconItalic /></IconBtn>
      <IconBtn
        title="Underline"
        disabled={!textActive}
        active={!!s?.underline}
        onClick={() => onStylingChange({ underline: !s?.underline })}
      ><IconUnderline /></IconBtn>

      <Divider />

      <IconBtn
        title="Align left"
        disabled={!textActive}
        active={align === 'left'}
        onClick={() => onStylingChange({ text_align: 'left' })}
      ><IconAlignLeft /></IconBtn>
      <IconBtn
        title="Align center"
        disabled={!textActive}
        active={align === 'center'}
        onClick={() => onStylingChange({ text_align: 'center' })}
      ><IconAlignCenter /></IconBtn>
      <IconBtn
        title="Align right"
        disabled={!textActive}
        active={align === 'right'}
        onClick={() => onStylingChange({ text_align: 'right' })}
      ><IconAlignRight /></IconBtn>

      {isChart && onEditChart && (
        <>
          <Divider />
          <IconBtn title="Edit chart data" onClick={onEditChart}>
            <span style={{ fontSize: 13 }}>✎</span>
          </IconBtn>
        </>
      )}

      {block && (
        <>
          <Divider />
          <IconBtn title="Delete (Del)" onClick={onDelete} danger>
            <IconTrash />
          </IconBtn>
        </>
      )}

      <div style={{ flex: 1 }} />

      {/* Saved indicator */}
      <SaveBadge status={saveStatus} />

      <Divider />

      <Item icon={<IconEye />} label="Preview" onClick={onPreview} />
    </div>
  )
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

function TemplatePopover({
  heading, onPick,
}: {
  heading: string
  onPick: (kind: SlideTemplateKind) => void
}) {
  return (
    <div
      style={{
        position: 'absolute', top: 42, left: 0, zIndex: 60,
        minWidth: 220,
        background: '#fff',
        border: '1px solid #E5E7EB',
        borderRadius: 10, overflow: 'hidden',
        boxShadow: '0 12px 32px rgba(15,23,42,0.18)',
      }}
    >
      <div style={{ padding: '8px 12px 4px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: 1, textTransform: 'uppercase' }}>
        {heading}
      </div>
      {LAYOUTS.map((l) => (
        <button
          key={l.id}
          onClick={() => onPick(l.id)}
          style={{
            width: '100%', textAlign: 'left',
            background: 'none', border: 'none',
            padding: '8px 12px',
            display: 'flex', flexDirection: 'column',
            cursor: 'pointer', color: '#111827',
          }}
          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = '#F3F4F6'}
          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'none'}
        >
          <span style={{ fontSize: 13, fontWeight: 600 }}>{l.label}</span>
          <span style={{ fontSize: 11, color: '#6B7280' }}>{l.hint}</span>
        </button>
      ))}
    </div>
  )
}

function Divider() {
  return <div style={{ width: 1, height: 22, background: '#E5E7EB', margin: '0 6px' }} />
}

function Item({
  icon, label, onClick, active,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 34, padding: '0 10px',
        background: active ? '#EEF2FF' : 'transparent',
        border: '1px solid ' + (active ? '#C7D2FE' : 'transparent'),
        borderRadius: 8,
        color: active ? '#4338CA' : '#374151',
        fontSize: 13, fontWeight: 500, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        transition: 'background 120ms ease',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = '#F3F4F6' }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      <span style={{ display: 'inline-flex', width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      {label}
    </button>
  )
}

function IconBtn({
  title, onClick, active, disabled, danger, children,
}: {
  title: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
  danger?: boolean
  children: React.ReactNode
}) {
  const color = disabled
    ? '#D1D5DB'
    : danger
      ? '#DC2626'
      : active
        ? '#4338CA'
        : '#374151'
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={() => { if (!disabled) onClick() }}
      style={{
        width: 34, height: 34,
        background: active ? '#EEF2FF' : 'transparent',
        border: '1px solid ' + (active ? '#C7D2FE' : 'transparent'),
        borderRadius: 8,
        color,
        cursor: disabled ? 'default' : 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 120ms ease',
        padding: 0,
      }}
      onMouseEnter={(e) => { if (!disabled && !active) (e.currentTarget as HTMLElement).style.background = '#F3F4F6' }}
      onMouseLeave={(e) => { if (!disabled && !active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >{children}</button>
  )
}

function SaveBadge({ status }: { status: SaveStatus }) {
  if (status === 'idle') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 12, color: '#9CA3AF', fontWeight: 500,
        padding: '0 6px',
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D1D5DB' }} />
        Idle
      </span>
    )
  }
  if (status === 'saving') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 12, color: '#6B7280', fontWeight: 500,
        padding: '0 6px',
      }}>
        <span style={{
          width: 10, height: 10, borderRadius: '50%',
          border: '2px solid #D1D5DB', borderTopColor: '#6366F1',
          animation: 'spin 0.8s linear infinite',
        }} />
        Saving
      </span>
    )
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: 12, color: '#059669', fontWeight: 600,
      padding: '0 6px',
    }}>
      <IconCheck />
      Saved
    </span>
  )
}

// ── Inline icons (16×16) ──────────────────────────────────────────────────────

const SVG = (children: React.ReactNode) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
)

const IconText      = () => SVG(<><path d="M4 6h16" /><path d="M12 6v14" /></>)
const IconImage     = () => SVG(<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></>)
const IconChart     = () => SVG(<><path d="M3 3v18h18" /><rect x="7"  y="11" width="3" height="6" /><rect x="12" y="7"  width="3" height="10" /><rect x="17" y="13" width="3" height="4" /></>)
const IconLayout    = () => SVG(<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></>)
const IconPlusSlide = () => SVG(<><rect x="2" y="5" width="14" height="11" rx="2" /><path d="M19 8v8" /><path d="M15 12h8" /></>)
const IconBold      = () => SVG(<><path d="M6 4h7a4 4 0 0 1 0 8H6z" /><path d="M6 12h8a4 4 0 0 1 0 8H6z" /></>)
const IconItalic    = () => SVG(<><line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" /></>)
const IconUnderline = () => SVG(<><path d="M6 4v8a6 6 0 0 0 12 0V4" /><line x1="4" y1="21" x2="20" y2="21" /></>)
const IconAlignLeft   = () => SVG(<><line x1="3" y1="6"  x2="21" y2="6"  /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="18" y2="18" /></>)
const IconAlignCenter = () => SVG(<><line x1="3" y1="6"  x2="21" y2="6"  /><line x1="6" y1="12" x2="18" y2="12" /><line x1="4" y1="18" x2="20" y2="18" /></>)
const IconAlignRight  = () => SVG(<><line x1="3" y1="6"  x2="21" y2="6"  /><line x1="9" y1="12" x2="21" y2="12" /><line x1="6" y1="18" x2="21" y2="18" /></>)
const IconTrash       = () => SVG(<><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></>)
const IconEye         = () => SVG(<><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></>)
const IconCheck       = () => SVG(<polyline points="20 6 9 17 4 12" />)
const IconSparkle     = () => SVG(<><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /></>)
