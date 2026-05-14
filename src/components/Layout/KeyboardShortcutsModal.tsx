import { X } from 'lucide-react'

interface Props {
  onClose: () => void
}

interface ShortcutGroup {
  title: string
  items: { keys: string[]; description: string }[]
}

const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform)
const MOD = isMac ? '⌘' : 'Ctrl'

const GROUPS: ShortcutGroup[] = [
  {
    title: 'Global',
    items: [
      { keys: [MOD, 'K'], description: 'Search (coming soon)' },
      { keys: [MOD, '↵'], description: 'Generate from the quick prompt' },
      { keys: ['?'], description: 'Open this shortcuts panel' },
    ],
  },
  {
    title: 'Editor',
    items: [
      { keys: [MOD, 'Z'], description: 'Undo' },
      { keys: [MOD, 'Shift', 'Z'], description: 'Redo' },
      { keys: ['Del'], description: 'Delete selected block' },
      { keys: ['Esc'], description: 'Deselect / exit edit mode' },
      { keys: ['Double-click'], description: 'Edit a block in place' },
      { keys: ['Drag'], description: 'Move or resize a block' },
    ],
  },
  {
    title: 'Present mode',
    items: [
      { keys: ['→', 'Space'], description: 'Next slide' },
      { keys: ['←'], description: 'Previous slide' },
      { keys: ['N'], description: 'Toggle speaker notes' },
      { keys: ['S'], description: 'Toggle speech / read aloud' },
      { keys: ['Esc'], description: 'Exit presentation' },
    ],
  },
]

export function KeyboardShortcutsModal({ onClose }: Props) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(15,14,12,0.45)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 580,
          maxHeight: '85vh',
          background: '#fff',
          borderRadius: 18,
          boxShadow: '0 24px 64px -16px rgba(15,14,12,0.35), 0 8px 24px rgba(15,14,12,0.12)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <header
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--line)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <div>
            <p className="eyebrow" style={{ color: 'var(--ink-faint)', marginBottom: 4 }}>
              — Help
            </p>
            <h2
              className="font-serif"
              style={{ fontSize: 22, color: 'var(--ink-strong)', letterSpacing: '-0.02em' }}
            >
              Keyboard shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'rgba(0,0,0,0.04)', border: 'none',
              color: 'var(--ink-soft)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
          >
            <X size={15} />
          </button>
        </header>

        <div style={{ overflowY: 'auto', padding: '20px 24px 24px' }}>
          {GROUPS.map((group) => (
            <section key={group.title} style={{ marginBottom: 24 }}>
              <p
                className="eyebrow"
                style={{ color: 'var(--ink-muted)', marginBottom: 12 }}
              >
                {group.title}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                {group.items.map((item) => (
                  <div
                    key={item.description}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '7px 0',
                    }}
                  >
                    <span style={{ color: 'var(--ink-strong)', fontSize: 13.5 }}>
                      {item.description}
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {item.keys.map((k, i) => (
                        <kbd
                          key={i}
                          style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            minWidth: 28, height: 24, padding: '0 7px',
                            borderRadius: 6,
                            background: '#fff',
                            border: '1px solid var(--line)',
                            boxShadow: '0 1px 0 rgba(15,14,12,0.04), inset 0 -1px 0 rgba(15,14,12,0.05)',
                            color: 'var(--ink-strong)',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: 11.5,
                            fontWeight: 600,
                            letterSpacing: 0,
                          }}
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--line)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}
        >
          <span className="text-[11.5px]" style={{ color: 'var(--ink-faint)' }}>
            Press <kbd style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 22, height: 20, padding: '0 6px',
              borderRadius: 5,
              background: 'rgba(0,0,0,0.05)', border: '1px solid var(--line)',
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, fontWeight: 600,
              color: 'var(--ink-soft)',
            }}>Esc</kbd> to close
          </span>
          <a
            href="mailto:hello@webandcrafts.com"
            className="text-[12px] font-medium"
            style={{ color: 'var(--ink-strong)' }}
          >
            Email support →
          </a>
        </footer>
      </div>
    </div>
  )
}
