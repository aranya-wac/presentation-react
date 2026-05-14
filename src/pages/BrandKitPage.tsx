import { useEffect, useState } from 'react'
import { brandKitApi } from '../api/client'
import { AppLayout } from '../components/Layout/AppLayout'
import { useToast } from '../components/ui/Toast'
import type { BrandKit } from '../types'

const FONT_OPTIONS = [
  'Inter', 'Roboto', 'Montserrat', 'Open Sans', 'Lato',
  'Poppins', 'Playfair Display', 'Georgia', 'Arial', 'Helvetica',
]

export function BrandKitPage() {
  const toast = useToast()
  const [kit, setKit] = useState<BrandKit | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    brandKitApi.get()
      .then(({ data }) => setKit(data))
      .catch((err) => toast.error('Could not load brand kit', err.response?.data?.detail ?? 'Unknown error'))
  }, [])

  const update = (patch: Partial<BrandKit>) => {
    setKit((prev) => prev ? { ...prev, ...patch } : prev)
  }

  const handleSave = async () => {
    if (!kit) return
    setSaving(true)
    try {
      const { data } = await brandKitApi.update(kit)
      setKit(data)
      toast.success('Brand kit saved', 'New presentations will use these defaults.')
    } catch (err: any) {
      toast.error('Save failed', err.response?.data?.detail ?? 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  if (!kit) {
    return (
      <AppLayout>
        <div style={{ padding: 40, color: 'var(--ink-soft)' }}>Loading brand kit…</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 40px' }}>
        <p className="eyebrow" style={{ marginBottom: 8 }}>— Studio</p>
        <h1 className="font-serif" style={{ fontSize: 40, color: 'var(--ink-strong)', letterSpacing: '-0.02em', marginBottom: 8 }}>
          Brand kit
        </h1>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14.5, lineHeight: 1.6, marginBottom: 32 }}>
          Set your default logo, colors, and fonts. New presentations will start from here so every deck stays on-brand.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <Card title="Logo">
            <Row label="Logo URL">
              <input
                type="text"
                value={kit.logo_url}
                onChange={(e) => update({ logo_url: e.target.value })}
                placeholder="https://example.com/logo.svg"
                style={inputStyle}
              />
            </Row>
            {kit.logo_url && (
              <div style={{ marginTop: 12, padding: 14, background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--line)', display: 'flex', justifyContent: 'center' }}>
                <img src={kit.logo_url} alt="Brand logo preview" style={{ maxHeight: 48, maxWidth: '100%' }} />
              </div>
            )}
          </Card>

          <Card title="Typography">
            <Row label="Heading font">
              <select value={kit.heading_font} onChange={(e) => update({ heading_font: e.target.value })} style={inputStyle}>
                {FONT_OPTIONS.map(f => <option key={f}>{f}</option>)}
              </select>
            </Row>
            <Row label="Body font">
              <select value={kit.body_font} onChange={(e) => update({ body_font: e.target.value })} style={inputStyle}>
                {FONT_OPTIONS.map(f => <option key={f}>{f}</option>)}
              </select>
            </Row>
          </Card>

          <Card title="Colors" wide>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
              <ColorField label="Primary" value={kit.primary_color} onChange={(v) => update({ primary_color: v })} />
              <ColorField label="Secondary" value={kit.secondary_color} onChange={(v) => update({ secondary_color: v })} />
              <ColorField label="Accent" value={kit.accent_color} onChange={(v) => update({ accent_color: v })} />
              <ColorField label="Background" value={kit.background_color} onChange={(v) => update({ background_color: v })} />
              <ColorField label="Text" value={kit.text_color} onChange={(v) => update({ text_color: v })} />
            </div>
          </Card>

          <Card title="Preview" wide>
            <div style={{
              borderRadius: 12, border: '1px solid var(--line)', overflow: 'hidden',
              background: kit.background_color, padding: 32,
            }}>
              <div style={{
                fontFamily: kit.heading_font, color: kit.primary_color,
                fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8,
              }}>
                Quarterly Review
              </div>
              <div style={{
                fontFamily: kit.body_font, color: kit.text_color,
                fontSize: 14, lineHeight: 1.6, marginBottom: 16,
              }}>
                Your default body text will appear here. We'll keep it readable and on-brand.
              </div>
              <div style={{
                display: 'inline-block', padding: '4px 10px', borderRadius: 999,
                background: kit.accent_color, color: '#fff',
                fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
                fontFamily: kit.body_font,
              }}>
                Accent
              </div>
            </div>
          </Card>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 22px', borderRadius: 10,
              background: 'var(--ink-strong)', color: '#fff',
              border: 'none', fontSize: 13, fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving…' : 'Save brand kit'}
          </button>
        </div>
      </div>
    </AppLayout>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 8,
  border: '1px solid var(--line)', background: 'var(--surface)',
  fontSize: 13, color: 'var(--ink-strong)',
  boxSizing: 'border-box',
}

function Card({ title, wide, children }: { title: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div style={{
      gridColumn: wide ? 'span 2' : 'span 1',
      background: 'var(--surface)',
      border: '1px solid var(--line)',
      borderRadius: 14,
      padding: 20,
    }}>
      <h3 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--ink-muted)', fontWeight: 700, margin: '0 0 14px 0' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 11, color: 'var(--ink-muted)', marginBottom: 4, fontWeight: 600 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 10, color: 'var(--ink-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 32, height: 32, padding: 2, border: '1px solid var(--line)', borderRadius: 6, background: 'transparent', cursor: 'pointer' }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...inputStyle, padding: '5px 8px', fontSize: 12 }}
        />
      </div>
    </div>
  )
}
