import { useEffect, useRef, useState } from 'react'

export type SlideTemplateKind = 'title' | 'agenda' | 'content' | 'blank'

interface Props {
  onPick: (kind: SlideTemplateKind) => void
}

const ITEMS: { id: SlideTemplateKind; label: string; hint: string; icon: string }[] = [
  { id: 'title',   label: 'Title slide',   hint: 'Big title + subtitle',         icon: 'T' },
  { id: 'agenda',  label: 'Agenda',        hint: 'Heading + bullet list',         icon: '≡' },
  { id: 'content', label: 'Content slide', hint: 'Heading + body block',          icon: '¶' },
  { id: 'blank',   label: 'Blank',         hint: 'Empty canvas',                  icon: '□' },
]

export function AddSlideMenu({ onPick }: Props) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div ref={wrapRef} style={{ position: 'relative', margin: '10px 8px 4px' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          background: open ? 'rgba(99,102,241,0.22)' : 'rgba(99,102,241,0.1)',
          border: '1px dashed rgba(99,102,241,0.4)',
          borderRadius: 7, color: '#818cf8',
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          padding: '6px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        }}
      >
        + Add Slide ▾
      </button>

      {open && (
        <div
          style={{
            position: 'absolute', top: 36, left: 0, right: 0, zIndex: 50,
            background: '#1e1e35',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, overflow: 'hidden',
            boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
          }}
        >
          {ITEMS.map((it) => (
            <button
              key={it.id}
              onClick={() => { onPick(it.id); setOpen(false) }}
              style={{
                width: '100%', textAlign: 'left',
                background: 'none', border: 'none',
                padding: '8px 10px',
                color: '#e2e8f0', fontSize: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10,
              }}
              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'none'}
            >
              <span style={{
                width: 26, height: 26, borderRadius: 6,
                background: 'rgba(99,102,241,0.18)',
                color: '#a5b4fc', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, flexShrink: 0,
              }}>{it.icon}</span>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontWeight: 600 }}>{it.label}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{it.hint}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
