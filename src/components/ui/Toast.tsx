import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { Check, AlertCircle, Info, X, Loader2 } from 'lucide-react'

type ToastVariant = 'success' | 'error' | 'info' | 'loading'

interface ToastItem {
  id: number
  variant: ToastVariant
  title: string
  description?: string
  /** loading toasts are sticky until updated/dismissed */
  sticky?: boolean
}

type ToastUpdate = Partial<Omit<ToastItem, 'id'>>

interface ToastContextValue {
  show: (t: Omit<ToastItem, 'id'>) => number
  success: (title: string, description?: string) => number
  error: (title: string, description?: string) => number
  info: (title: string, description?: string) => number
  loading: (title: string, description?: string) => number
  update: (id: number, patch: ToastUpdate) => void
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}

const DURATION_MS = 3600

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const clearTimer = useCallback((id: number) => {
    const t = timersRef.current.get(id)
    if (t) { clearTimeout(t); timersRef.current.delete(id) }
  }, [])

  const dismiss = useCallback((id: number) => {
    clearTimer(id)
    setToasts((ts) => ts.filter((t) => t.id !== id))
  }, [clearTimer])

  const scheduleAutoDismiss = useCallback((id: number) => {
    clearTimer(id)
    const handle = setTimeout(() => dismiss(id), DURATION_MS)
    timersRef.current.set(id, handle)
  }, [clearTimer, dismiss])

  const show = useCallback<ToastContextValue['show']>((t) => {
    const id = ++idRef.current
    setToasts((ts) => [...ts, { ...t, id }])
    if (!t.sticky && t.variant !== 'loading') scheduleAutoDismiss(id)
    return id
  }, [scheduleAutoDismiss])

  const update = useCallback<ToastContextValue['update']>((id, patch) => {
    setToasts((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)))
    const nextVariant = patch.variant
    if (nextVariant && nextVariant !== 'loading' && !patch.sticky) {
      scheduleAutoDismiss(id)
    }
  }, [scheduleAutoDismiss])

  const success = useCallback((title: string, description?: string) =>
    show({ variant: 'success', title, description }), [show])
  const error = useCallback((title: string, description?: string) =>
    show({ variant: 'error', title, description }), [show])
  const info = useCallback((title: string, description?: string) =>
    show({ variant: 'info', title, description }), [show])
  const loading = useCallback((title: string, description?: string) =>
    show({ variant: 'loading', title, description, sticky: true }), [show])

  return (
    <ToastContext.Provider value={{ show, success, error, info, loading, update, dismiss }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[]
  onDismiss: (id: number) => void
}) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  )
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const [enter, setEnter] = useState(false)
  useEffect(() => {
    const r = requestAnimationFrame(() => setEnter(true))
    return () => cancelAnimationFrame(r)
  }, [])

  const palette = getPalette(toast.variant)
  const Icon = palette.icon

  return (
    <div
      role="status"
      style={{
        pointerEvents: 'auto',
        minWidth: 280,
        maxWidth: 380,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '12px 14px 12px 14px',
        background: 'var(--paper, #FAFAF7)',
        border: '1px solid var(--line, #E8E5DE)',
        borderRadius: 14,
        boxShadow:
          '0 1px 1px rgba(15,14,12,0.04), 0 12px 32px -8px rgba(15,14,12,0.18)',
        transform: enter ? 'translateY(0)' : 'translateY(-8px)',
        opacity: enter ? 1 : 0,
        transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease',
      }}
    >
      <div
        key={toast.variant}
        style={{
          width: 28,
          height: 28,
          borderRadius: palette.round ? '50%' : 8,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: palette.iconBg,
          color: palette.iconColor,
          animation: palette.pop ? 'wac-toast-pop 320ms cubic-bezier(0.34,1.56,0.64,1)' : undefined,
        }}
      >
        <Icon
          size={15}
          strokeWidth={2.6}
          style={toast.variant === 'loading'
            ? { animation: 'wac-toast-spin 900ms linear infinite' }
            : undefined}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-serif, Georgia, serif)',
            fontSize: 14,
            lineHeight: 1.25,
            letterSpacing: '-0.01em',
            color: 'var(--ink-strong, #0F0E0C)',
          }}
        >
          {toast.title}
        </p>
        {toast.description && (
          <p
            style={{
              margin: '3px 0 0 0',
              fontSize: 12.5,
              lineHeight: 1.45,
              color: 'var(--ink-soft, #4A4640)',
            }}
          >
            {toast.description}
          </p>
        )}
      </div>

      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--ink-faint, #9E9A92)',
          padding: 2,
          marginTop: 2,
          flexShrink: 0,
          lineHeight: 0,
          borderRadius: 6,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink-strong, #0F0E0C)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink-faint, #9E9A92)')}
      >
        <X size={14} />
      </button>
    </div>
  )
}

function getPalette(v: ToastVariant) {
  switch (v) {
    case 'success':
      return { icon: Check, iconBg: 'var(--ink-strong, #0F0E0C)', iconColor: '#fff', round: true, pop: true }
    case 'error':
      return { icon: AlertCircle, iconBg: 'var(--accent-soft, rgba(180,60,40,0.10))', iconColor: 'var(--accent, #B43C28)', round: false, pop: true }
    case 'loading':
      return { icon: Loader2, iconBg: 'rgba(10,9,7,0.06)', iconColor: 'var(--ink-strong, #0F0E0C)', round: true, pop: false }
    case 'info':
    default:
      return { icon: Info, iconBg: 'rgba(10,9,7,0.06)', iconColor: 'var(--ink-strong, #0F0E0C)', round: false, pop: false }
  }
}

if (typeof document !== 'undefined' && !document.getElementById('wac-toast-anim')) {
  const style = document.createElement('style')
  style.id = 'wac-toast-anim'
  style.textContent = `
    @keyframes wac-toast-spin { to { transform: rotate(360deg) } }
    @keyframes wac-toast-pop {
      0%   { transform: scale(0.4); opacity: 0 }
      60%  { transform: scale(1.08); opacity: 1 }
      100% { transform: scale(1) }
    }
  `
  document.head.appendChild(style)
}
