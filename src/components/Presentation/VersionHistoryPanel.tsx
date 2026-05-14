import { useEffect, useState } from 'react'
import { versionsApi } from '../../api/client'
import type { PresentationDetail, PresentationVersion } from '../../types'
import { useToast } from '../ui/Toast'

interface Props {
  presentationId: string
  onClose: () => void
  onRestored: (detail: PresentationDetail) => void
}

export function VersionHistoryPanel({ presentationId, onClose, onRestored }: Props) {
  const toast = useToast()
  const [items, setItems] = useState<PresentationVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const reload = async () => {
    setLoading(true)
    try {
      const { data } = await versionsApi.list(presentationId)
      setItems(data)
    } catch (err: any) {
      toast.error('Could not load history', err.response?.data?.detail ?? 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { reload() }, [presentationId])

  const handleSnapshot = async () => {
    setBusy(true)
    try {
      await versionsApi.create(presentationId, 'Manual snapshot')
      toast.success('Snapshot saved')
      await reload()
    } catch (err: any) {
      toast.error('Snapshot failed', err.response?.data?.detail ?? 'Unknown error')
    } finally {
      setBusy(false)
    }
  }

  const handleRestore = async (v: PresentationVersion) => {
    if (!confirm(`Restore version ${v.version_number}? Current state will be snapshotted first.`)) return
    setBusy(true)
    try {
      const { data } = await versionsApi.restore(presentationId, v.id)
      onRestored(data)
      toast.success('Restored', `Now showing v${v.version_number}.`)
      onClose()
    } catch (err: any) {
      toast.error('Restore failed', err.response?.data?.detail ?? 'Unknown error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 360,
        background: '#13131f', borderLeft: '1px solid rgba(255,255,255,0.08)',
        zIndex: 100, display: 'flex', flexDirection: 'column',
        boxShadow: '-12px 0 40px rgba(0,0,0,0.45)',
      }}
    >
      <header style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.6, color: 'rgba(255,255,255,0.45)', margin: 0 }}>History</p>
          <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: '2px 0 0 0' }}>Version history</h2>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 22, cursor: 'pointer' }}>×</button>
      </header>

      <div style={{ padding: '12px 20px' }}>
        <button
          onClick={handleSnapshot}
          disabled={busy}
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 8,
            background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.4)',
            color: '#cbd5ff', fontSize: 12, fontWeight: 600,
            cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.5 : 1,
          }}
        >
          + Save current as version
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 16px' }}>
        {loading && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, padding: '0 8px' }}>Loading…</p>}
        {!loading && items.length === 0 && (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, padding: '12px 8px', lineHeight: 1.5 }}>
            No snapshots yet. They're created automatically while you edit, or you can save one manually.
          </p>
        )}
        {items.map((v) => (
          <div
            key={v.id}
            style={{
              padding: '10px 12px', borderRadius: 8, marginBottom: 6,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>v{v.version_number}</span>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>
                {v.created_at ? new Date(v.created_at).toLocaleString() : ''}
              </span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11.5, margin: '4px 0 6px', lineHeight: 1.4 }}>
              {v.label || `${v.slide_count} slides · ${v.title || 'Untitled'}`}
            </p>
            <button
              onClick={() => handleRestore(v)}
              disabled={busy}
              style={{
                fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
                background: 'transparent', border: '1px solid rgba(255,255,255,0.18)',
                color: 'rgba(255,255,255,0.85)', cursor: busy ? 'not-allowed' : 'pointer',
              }}
            >
              Restore
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
