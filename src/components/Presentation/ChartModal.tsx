import { useState } from 'react'
import type { ChartDataPoint, ChartType } from '../../types'
import { ChartElement } from './ChartElement'

interface Props {
  initialType?: ChartType
  initialData?: ChartDataPoint[]
  onCancel: () => void
  onSubmit: (chartType: ChartType, data: ChartDataPoint[]) => void
}

const DEFAULT_DATA: ChartDataPoint[] = [
  { label: 'Q1', value: 30 },
  { label: 'Q2', value: 45 },
  { label: 'Q3', value: 38 },
  { label: 'Q4', value: 60 },
]

export function ChartModal({ initialType = 'bar', initialData, onCancel, onSubmit }: Props) {
  const [chartType, setChartType] = useState<ChartType>(initialType)
  const [rows, setRows] = useState<ChartDataPoint[]>(
    initialData && initialData.length ? initialData : DEFAULT_DATA
  )

  const updateRow = (i: number, patch: Partial<ChartDataPoint>) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }
  const addRow = () => setRows((prev) => [...prev, { label: `Item ${prev.length + 1}`, value: 0 }])
  const removeRow = (i: number) => setRows((prev) => prev.filter((_, idx) => idx !== i))

  const handleSubmit = () => {
    const cleaned = rows
      .map((r) => ({ label: r.label.trim() || '—', value: Number(r.value) || 0 }))
    if (cleaned.length === 0) return
    onSubmit(chartType, cleaned)
  }

  const types: { id: ChartType; label: string; icon: string }[] = [
    { id: 'bar',  label: 'Bar',  icon: '▦' },
    { id: 'pie',  label: 'Pie',  icon: '◔' },
    { id: 'line', label: 'Line', icon: '⤴' },
  ]

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 720, maxWidth: '100%', maxHeight: '90vh',
          background: '#13131f',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          color: '#e2e8f0',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Insert Chart</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
              Pick a chart type, then enter labels and values.
            </span>
          </div>
          <button
            onClick={onCancel}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}
          >×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: 22, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
          {/* Left: type + data table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
                Chart type
              </label>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                {types.map((t) => {
                  const active = chartType === t.id
                  return (
                    <button
                      key={t.id}
                      onClick={() => setChartType(t.id)}
                      style={{
                        flex: 1,
                        padding: '8px 0',
                        borderRadius: 8,
                        border: `1px solid ${active ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                        background: active ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                        color: active ? '#a5b4fc' : 'rgba(255,255,255,0.7)',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}
                    >
                      <span style={{ fontSize: 14 }}>{t.icon}</span> {t.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
                  Data
                </label>
                <button
                  onClick={addRow}
                  style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', borderRadius: 6, padding: '3px 9px', fontSize: 11, cursor: 'pointer' }}
                >+ Row</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflow: 'auto', paddingRight: 4 }}>
                {rows.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6 }}>
                    <input
                      value={r.label}
                      onChange={(e) => updateRow(i, { label: e.target.value })}
                      placeholder="Label"
                      style={{
                        flex: 2, minWidth: 0,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 6, padding: '6px 8px',
                        color: '#fff', fontSize: 12, outline: 'none',
                      }}
                    />
                    <input
                      type="number"
                      value={r.value}
                      onChange={(e) => updateRow(i, { value: Number(e.target.value) })}
                      placeholder="Value"
                      style={{
                        flex: 1, minWidth: 0,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 6, padding: '6px 8px',
                        color: '#fff', fontSize: 12, outline: 'none',
                      }}
                    />
                    <button
                      onClick={() => removeRow(i)}
                      disabled={rows.length <= 1}
                      style={{
                        width: 30, background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 6, color: rows.length <= 1 ? 'rgba(255,255,255,0.2)' : '#f87171',
                        cursor: rows.length <= 1 ? 'default' : 'pointer', fontSize: 14,
                      }}
                    >×</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
              Preview
            </label>
            <div style={{
              flex: 1, minHeight: 280,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, padding: 12,
            }}>
              <ChartElement chartType={chartType} data={rows} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 22px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'flex-end', gap: 8,
        }}>
          <button
            onClick={onCancel}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              color: '#e2e8f0', borderRadius: 8, padding: '8px 16px',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}
          >Cancel</button>
          <button
            onClick={handleSubmit}
            style={{
              background: '#6366f1', border: 'none',
              color: '#fff', borderRadius: 8, padding: '8px 18px',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >Insert chart</button>
        </div>
      </div>
    </div>
  )
}
