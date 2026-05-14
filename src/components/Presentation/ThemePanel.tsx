import { THEME_PRESETS } from '../../data/themes'
import type { ThemePreset } from '../../data/themes'

interface ThemePanelProps {
  currentThemeId: string
  onClose: () => void
  onApply: (theme: ThemePreset) => void
}

export function ThemePanel({ currentThemeId, onClose, onApply }: ThemePanelProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 280,
        background: '#ffffff',
        borderLeft: '1px solid #e5e7eb',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #f3f4f6',
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>Theme</span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#9ca3af',
            fontSize: 20,
            lineHeight: 1,
            padding: '0 2px',
          }}
          aria-label="Close theme panel"
        >
          ×
        </button>
      </div>

      {/* Theme grid */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          alignContent: 'start',
        }}
      >
        {THEME_PRESETS.map((theme) => {
          const isActive = theme.id === currentThemeId
          return (
            <button
              key={theme.id}
              onClick={() => onApply(theme)}
              style={{
                background: 'none',
                border: `2px solid ${isActive ? '#6366f1' : '#e5e7eb'}`,
                borderRadius: 10,
                padding: 0,
                cursor: 'pointer',
                textAlign: 'left',
                overflow: 'hidden',
                transition: 'border-color 0.15s',
              }}
              title={theme.name}
            >
              {/* Preview swatch */}
              <div
                style={{
                  background: theme.colors.background,
                  height: 64,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  padding: '8px 10px',
                  gap: 4,
                }}
              >
                <div
                  style={{
                    fontFamily: theme.fonts.heading,
                    fontSize: 11,
                    fontWeight: 700,
                    color: theme.colors.heading,
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  Title
                </div>
                <div
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: 8,
                    color: theme.colors.body,
                    lineHeight: 1.3,
                  }}
                >
                  Body &{' '}
                  <span style={{ color: theme.colors.accent, textDecoration: 'underline' }}>
                    link
                  </span>
                </div>
                <div
                  style={{
                    width: 16,
                    height: 3,
                    borderRadius: 2,
                    background: theme.colors.accent,
                    marginTop: 2,
                  }}
                />
              </div>

              {/* Name row */}
              <div
                style={{
                  padding: '6px 10px',
                  fontSize: 11,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#6366f1' : '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#fafafa',
                }}
              >
                <span>{theme.name}</span>
                {isActive && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="6" fill="#6366f1" />
                    <path
                      d="M3.5 6l1.8 1.8L8.5 4"
                      stroke="#fff"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
