import { Monitor, Moon, Sun } from 'lucide-react'
import { motion } from 'framer-motion'
import { useThemeMode, type ThemeMode } from '../../hooks/useThemeMode'

/**
 * Three-way segmented control: Light · System · Dark. Lives in the sidebar
 * footer. The active option carries a sliding indicator behind the icon so
 * the transition feels deliberate.
 */
export function ThemeToggle() {
  const { mode, setMode } = useThemeMode()

  const options: { value: ThemeMode; label: string; icon: JSX.Element }[] = [
    { value: 'light',  label: 'Light theme',  icon: <Sun size={12} strokeWidth={2.2} /> },
    { value: 'system', label: 'System theme', icon: <Monitor size={12} strokeWidth={2.2} /> },
    { value: 'dark',   label: 'Dark theme',   icon: <Moon size={12} strokeWidth={2.2} /> },
  ]

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex p-0.5 rounded-lg"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--line)',
      }}
    >
      {options.map((o) => {
        const active = mode === o.value
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={active}
            aria-label={o.label}
            title={o.label}
            onClick={() => setMode(o.value)}
            className="relative flex items-center justify-center w-7 h-6 rounded-md transition-colors"
            style={{
              color: active ? 'var(--ink-strong)' : 'var(--ink-muted)',
            }}
            onMouseEnter={(e) => {
              if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink-soft)'
            }}
            onMouseLeave={(e) => {
              if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink-muted)'
            }}
          >
            {active && (
              <motion.span
                aria-hidden
                layoutId="theme-toggle-pill"
                className="absolute inset-0 rounded-md"
                style={{
                  background: 'var(--paper)',
                  border: '1px solid var(--line)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 36 }}
              />
            )}
            <span className="relative">{o.icon}</span>
          </button>
        )
      })}
    </div>
  )
}
