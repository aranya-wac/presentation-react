import {
  ResponsiveContainer,
  BarChart, Bar,
  PieChart, Pie, Cell,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import type { ChartDataPoint, ChartType, Theme } from '../../types'

interface Props {
  chartType: ChartType
  data: ChartDataPoint[]
  theme?: Theme
  scale?: number
}

const FALLBACK_PALETTE = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#06b6d4', '#3b82f6', '#ef4444',
]

// ── Color math ───────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] | null {
  if (!hex || !hex.startsWith('#')) return null
  let h = hex.slice(1)
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  if (h.length !== 6) return null
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h *= 60
  }
  return [h, s, l]
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360
  s = Math.max(0, Math.min(1, s))
  l = Math.max(0, Math.min(1, l))
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if      (h < 60)  { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else              { r = c; g = 0; b = x }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Build a chart palette of 8 distinct-but-harmonious colors derived from
 * the theme accent. Hue rotates ±30° around accent while lightness oscillates
 * so adjacent bars/slices are still distinguishable. Falls back to a fixed
 * palette when the theme isn't provided.
 */
function buildPalette(theme?: Theme): string[] {
  const rgb = theme?.colors.accent ? hexToRgb(theme.colors.accent) : null
  if (!rgb) return FALLBACK_PALETTE
  const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2])
  // Hue offsets fan out from the accent for variety; lightness alternates
  // between the accent's own lightness and ±0.12 shifts to keep contrast.
  const offsets: Array<[number, number]> = [
    [   0,  0   ],
    [  35, -0.08],
    [ -35,  0.08],
    [  70,  0.04],
    [ -70, -0.04],
    [ 110,  0.12],
    [-110, -0.12],
    [ 180,  0   ],
  ]
  // Keep saturation healthy enough to read on light themes; cap upper bound
  // so cyan/lime themes don't get harsh.
  const sClamp = Math.max(0.35, Math.min(0.85, s))
  return offsets.map(([dh, dl]) => hslToHex(h + dh, sClamp, Math.max(0.25, Math.min(0.75, l + dl))))
}

function isDarkHex(hex?: string): boolean {
  if (!hex) return true
  const rgb = hexToRgb(hex)
  if (!rgb) return true
  return (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255 < 0.5
}

export function ChartElement({ chartType, data, theme, scale = 1 }: Props) {
  const palette = buildPalette(theme)
  const dark = isDarkHex(theme?.colors.background)
  const tickStyle = { fontSize: 11 * Math.max(scale, 0.5), fill: theme?.colors.text ?? (dark ? '#94a3b8' : '#475569') }
  const axisColor = dark ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.18)'
  const emptyTextColor = dark ? 'rgba(255,255,255,0.35)' : 'rgba(15,23,42,0.45)'
  const emptyBorderColor = dark ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.2)'

  if (!data || data.length === 0) {
    return (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: emptyTextColor, fontSize: 12 * scale,
        border: `${scale}px dashed ${emptyBorderColor}`,
        borderRadius: 8 * scale,
      }}>
        No chart data
      </div>
    )
  }

  if (chartType === 'pie') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius="40%"
            outerRadius="80%"
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={palette[i % palette.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend wrapperStyle={tickStyle} />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  if (chartType === 'line') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid stroke={axisColor} strokeDasharray="3 3" />
          <XAxis dataKey="label" stroke={axisColor} tick={tickStyle} />
          <YAxis stroke={axisColor} tick={tickStyle} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="value"
            stroke={palette[0]}
            strokeWidth={2}
            dot={{ fill: palette[0], r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
        <CartesianGrid stroke={axisColor} strokeDasharray="3 3" />
        <XAxis dataKey="label" stroke={axisColor} tick={tickStyle} />
        <YAxis stroke={axisColor} tick={tickStyle} />
        <Tooltip />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={palette[i % palette.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
