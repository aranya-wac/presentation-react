import { useCallback, useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'wac:theme-mode'

/** Read the stored preference once. Defaults to 'system' so first-time users
 *  match their OS without a flash. */
function readStored(): ThemeMode {
  if (typeof window === 'undefined') return 'system'
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
  return 'system'
}

/** Resolve a mode (incl. "system") to the effective theme right now. */
function resolve(mode: ThemeMode): 'light' | 'dark' {
  if (mode !== 'system') return mode
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyAttribute(theme: 'light' | 'dark') {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = theme
}

/**
 * Theme controller. Hooks into:
 *   - localStorage (persistence)
 *   - prefers-color-scheme media query (only when mode === 'system')
 *   - <html data-theme> attribute (CSS picks this up via :root[data-theme=…])
 *
 * Use exactly once at the app root so the attribute stays in sync — the
 * components further down just call the same hook to *read* the current
 * value; mutating from anywhere is safe because we always persist to the
 * same localStorage key.
 */
export function useThemeMode() {
  const [mode, setModeState] = useState<ThemeMode>(readStored)
  const [resolved, setResolved] = useState<'light' | 'dark'>(() => resolve(mode))

  // Apply on mount + whenever mode (or system pref) changes.
  useEffect(() => {
    const next = resolve(mode)
    setResolved(next)
    applyAttribute(next)
  }, [mode])

  // Watch the OS preference; only react when in 'system' mode.
  useEffect(() => {
    if (mode !== 'system') return
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const next: 'light' | 'dark' = mq.matches ? 'dark' : 'light'
      setResolved(next)
      applyAttribute(next)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [mode])

  // Cross-tab sync — if another tab flips theme, follow.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return
      const next = (e.newValue as ThemeMode) || 'system'
      if (next === 'light' || next === 'dark' || next === 'system') {
        setModeState(next)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const setMode = useCallback((next: ThemeMode) => {
    try { localStorage.setItem(STORAGE_KEY, next) } catch { /* private mode etc */ }
    setModeState(next)
  }, [])

  /** Quick light↔dark flip, used by the icon-only toggle button. */
  const toggle = useCallback(() => {
    setMode(resolved === 'dark' ? 'light' : 'dark')
  }, [resolved, setMode])

  return { mode, resolved, setMode, toggle }
}

/** Prevents a light→dark FLASH on initial page load. Inlined into index.html
 *  would be ideal, but a small effect-free read on first JS execution is
 *  close enough since Vite bundles app code into the HEAD. */
export function applyInitialTheme() {
  if (typeof document === 'undefined') return
  const mode = readStored()
  applyAttribute(resolve(mode))
}
