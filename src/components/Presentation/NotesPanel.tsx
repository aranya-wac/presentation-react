import { useEffect, useState } from 'react'

interface NotesPanelProps {
  /** Current notes string for the active slide */
  value: string
  /** Called as the user edits, debounced upstream by the editor's autosave */
  onChange: (next: string) => void
  /** Identifier of the current slide so we can reset our local buffer when it changes */
  slideKey: string | number
}

/**
 * Presenter notes textarea, rendered as a slide-out drawer above the canvas footer.
 * Keeps a local buffer to avoid sending a save on every keystroke.
 */
export function NotesPanel({ value, onChange, slideKey }: NotesPanelProps) {
  const [draft, setDraft] = useState(value || '')

  useEffect(() => {
    setDraft(value || '')
  }, [slideKey, value])

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 36,
        left: 24,
        right: 24,
        background: 'rgba(20,20,30,0.92)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: '12px 14px',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        zIndex: 50,
      }}
    >
      <div
        style={{
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          color: 'rgba(255,255,255,0.5)',
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        Presenter notes
      </div>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== value) onChange(draft)
        }}
        placeholder="Talking points, transitions, references — only you see these."
        rows={3}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          resize: 'none',
          color: '#e2e8f0',
          fontSize: 13,
          lineHeight: 1.5,
          fontFamily: 'Inter, sans-serif',
          padding: 0,
        }}
      />
    </div>
  )
}
