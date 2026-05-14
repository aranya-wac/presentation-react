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

function buildPalette(theme?: Theme): string[] {
  const accent = theme?.colors.accent
  const primary = theme?.colors.primary
  const seeded = [accent, primary].filter(Boolean) as string[]
  return [...seeded, ...FALLBACK_PALETTE].slice(0, 8)
}

export function ChartElement({ chartType, data, theme, scale = 1 }: Props) {
  const palette = buildPalette(theme)
  const tickStyle = { fontSize: 11 * Math.max(scale, 0.5), fill: theme?.colors.text ?? '#94a3b8' }
  const axisColor = 'rgba(255,255,255,0.18)'

  if (!data || data.length === 0) {
    return (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.35)', fontSize: 12 * scale,
        border: `${scale}px dashed rgba(255,255,255,0.2)`,
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
