export interface ThemePreset {
  id: string
  name: string
  colors: {
    background: string
    surface: string
    heading: string
    body: string
    accent: string
  }
  fonts: {
    heading: string
    body: string
  }
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'vortex',
    name: 'Vortex',
    colors: { background: '#0d0d0d', surface: '#1a1a1a', heading: '#ffffff', body: '#cccccc', accent: '#6366f1' },
    fonts: { heading: 'Inter', body: 'Inter' },
  },
  {
    id: 'pearl',
    name: 'Pearl',
    colors: { background: '#fafaf8', surface: '#f0ede8', heading: '#1a1a1a', body: '#4a4a4a', accent: '#8b7355' },
    fonts: { heading: 'Playfair Display', body: 'Georgia' },
  },
  {
    id: 'stratos',
    name: 'Stratos',
    colors: { background: '#0f172a', surface: '#1e293b', heading: '#e2e8f0', body: '#94a3b8', accent: '#38bdf8' },
    fonts: { heading: 'Montserrat', body: 'Inter' },
  },
  {
    id: 'clementa',
    name: 'Clementa',
    colors: { background: '#fffbf0', surface: '#fef3c7', heading: '#78350f', body: '#92400e', accent: '#f59e0b' },
    fonts: { heading: 'Playfair Display', body: 'Open Sans' },
  },
  {
    id: 'nova',
    name: 'Nova',
    colors: { background: '#f8f4ff', surface: '#ede9fe', heading: '#4c1d95', body: '#5b21b6', accent: '#7c3aed' },
    fonts: { heading: 'Poppins', body: 'Inter' },
  },
  {
    id: 'twilight',
    name: 'Twilight',
    colors: { background: '#0c1445', surface: '#162060', heading: '#e0e7ff', body: '#a5b4fc', accent: '#f472b6' },
    fonts: { heading: 'Montserrat', body: 'Lato' },
  },
  {
    id: 'coral-glow',
    name: 'Coral Glow',
    colors: { background: '#fff5f5', surface: '#ffe4e6', heading: '#881337', body: '#9f1239', accent: '#f43f5e' },
    fonts: { heading: 'Poppins', body: 'Open Sans' },
  },
  {
    id: 'mercury',
    name: 'Mercury',
    colors: { background: '#f9fafb', surface: '#f3f4f6', heading: '#111827', body: '#374151', accent: '#6b7280' },
    fonts: { heading: 'Inter', body: 'Inter' },
  },
  {
    id: 'ashrose',
    name: 'Ashrose',
    colors: { background: '#fdf2f8', surface: '#fce7f3', heading: '#701a75', body: '#86198f', accent: '#d946ef' },
    fonts: { heading: 'Playfair Display', body: 'Lato' },
  },
  {
    id: 'spectrum',
    name: 'Spectrum',
    colors: { background: '#ecfdf5', surface: '#d1fae5', heading: '#064e3b', body: '#065f46', accent: '#10b981' },
    fonts: { heading: 'Montserrat', body: 'Open Sans' },
  },
  // ── Editorial — magazine-style serif, warm off-white, oxblood accent.
  // Use for thought-leadership, long-form, brand storytelling decks.
  {
    id: 'editorial',
    name: 'Editorial',
    colors: { background: '#FAF8F3', surface: '#F0EBE0', heading: '#1C1B17', body: '#3F3D37', accent: '#8B1A1A' },
    fonts: { heading: 'Newsreader', body: 'Inter' },
  },
  // ── Brutalist — high-contrast cream/black with signal yellow.
  // Use for bold product launches, tech announcements, agency decks.
  {
    id: 'brutalist',
    name: 'Brutalist',
    colors: { background: '#FFF9E6', surface: '#F5EFC8', heading: '#000000', body: '#1A1A1A', accent: '#FFD60A' },
    fonts: { heading: 'Space Grotesk', body: 'Inter' },
  },
  // ── Forest — deep green dark theme with parchment text + emerald accent.
  // Use for sustainability, climate-tech, biotech, nature/outdoor decks.
  {
    id: 'forest',
    name: 'Forest',
    colors: { background: '#0F2419', surface: '#1A3324', heading: '#F5F1E8', body: '#A8B5A0', accent: '#10B981' },
    fonts: { heading: 'Sora', body: 'Inter' },
  },
]

export function getThemeById(id: string): ThemePreset {
  return THEME_PRESETS.find((t) => t.id === id) ?? THEME_PRESETS[0]
}
