export interface ThemePreset {
  id: string
  name: string
  /** Short one-liner shown in the preview popover. */
  description?: string
  /** Free-form tags for filtering + display ("Editorial", "Corporate", etc.) */
  tags?: string[]
  /** Loose keyword set used by suggestThemes() to bias AI recommendations. */
  keywords?: string[]
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
    description: 'Confident dark theme with an indigo signal. Great for product, tech, startup decks.',
    tags: ['Modern', 'Startup', 'Tech'],
    keywords: ['startup', 'tech', 'product', 'ai', 'launch', 'roadmap'],
    colors: { background: '#0d0d0d', surface: '#1a1a1a', heading: '#ffffff', body: '#cccccc', accent: '#6366f1' },
    fonts: { heading: 'Inter', body: 'Inter' },
  },
  {
    id: 'pearl',
    name: 'Pearl',
    description: 'Warm off-white with a classic serif. Quiet, considered, editorial.',
    tags: ['Editorial', 'Education'],
    keywords: ['education', 'learning', 'academic', 'literature', 'history', 'classroom'],
    colors: { background: '#fafaf8', surface: '#f0ede8', heading: '#1a1a1a', body: '#4a4a4a', accent: '#8b7355' },
    fonts: { heading: 'Playfair Display', body: 'Georgia' },
  },
  {
    id: 'stratos',
    name: 'Stratos',
    description: 'Midnight blue with a sky accent. Reads as board-room serious.',
    tags: ['Corporate', 'Investor'],
    keywords: ['investor', 'pitch', 'board', 'sales', 'finance', 'enterprise', 'b2b'],
    colors: { background: '#0f172a', surface: '#1e293b', heading: '#e2e8f0', body: '#94a3b8', accent: '#38bdf8' },
    fonts: { heading: 'Montserrat', body: 'Inter' },
  },
  {
    id: 'clementa',
    name: 'Clementa',
    description: 'Warm amber on parchment. Friendly, organic, summer-warm.',
    tags: ['Warm', 'Hospitality'],
    keywords: ['food', 'restaurant', 'hospitality', 'travel', 'wellness'],
    colors: { background: '#fffbf0', surface: '#fef3c7', heading: '#78350f', body: '#92400e', accent: '#f59e0b' },
    fonts: { heading: 'Playfair Display', body: 'Open Sans' },
  },
  {
    id: 'nova',
    name: 'Nova',
    description: 'Soft lavender backdrop with violet ink. Modern, creative, optimistic.',
    tags: ['Modern', 'Creative'],
    keywords: ['design', 'creative', 'marketing', 'campaign', 'brand'],
    colors: { background: '#f8f4ff', surface: '#ede9fe', heading: '#4c1d95', body: '#5b21b6', accent: '#7c3aed' },
    fonts: { heading: 'Poppins', body: 'Inter' },
  },
  {
    id: 'twilight',
    name: 'Twilight',
    description: 'Deep navy with a magenta accent. Theatrical and high-end.',
    tags: ['Luxury', 'Premium'],
    keywords: ['luxury', 'fashion', 'beauty', 'launch', 'gala', 'premium'],
    colors: { background: '#0c1445', surface: '#162060', heading: '#e0e7ff', body: '#a5b4fc', accent: '#f472b6' },
    fonts: { heading: 'Montserrat', body: 'Lato' },
  },
  {
    id: 'coral-glow',
    name: 'Coral Glow',
    description: 'Pale rose with a coral accent. Energetic, approachable, retail-friendly.',
    tags: ['Retail', 'Lifestyle'],
    keywords: ['retail', 'lifestyle', 'consumer', 'community'],
    colors: { background: '#fff5f5', surface: '#ffe4e6', heading: '#881337', body: '#9f1239', accent: '#f43f5e' },
    fonts: { heading: 'Poppins', body: 'Open Sans' },
  },
  {
    id: 'mercury',
    name: 'Mercury',
    description: 'Quiet grayscale. Pure information design — lets the content speak.',
    tags: ['Minimal', 'Corporate'],
    keywords: ['report', 'data', 'analytics', 'research', 'whitepaper', 'business'],
    colors: { background: '#f9fafb', surface: '#f3f4f6', heading: '#111827', body: '#374151', accent: '#6b7280' },
    fonts: { heading: 'Inter', body: 'Inter' },
  },
  {
    id: 'ashrose',
    name: 'Ashrose',
    description: 'Dusty pink with a fuchsia signal. Modern, feminine, design-forward.',
    tags: ['Modern', 'Creative'],
    keywords: ['design', 'event', 'creative', 'wedding', 'fashion'],
    colors: { background: '#fdf2f8', surface: '#fce7f3', heading: '#701a75', body: '#86198f', accent: '#d946ef' },
    fonts: { heading: 'Playfair Display', body: 'Lato' },
  },
  {
    id: 'spectrum',
    name: 'Spectrum',
    description: 'Soft mint with emerald ink. Optimistic, green-forward, calming.',
    tags: ['Sustainability', 'Health'],
    keywords: ['climate', 'sustainability', 'health', 'biotech', 'esg', 'green'],
    colors: { background: '#ecfdf5', surface: '#d1fae5', heading: '#064e3b', body: '#065f46', accent: '#10b981' },
    fonts: { heading: 'Montserrat', body: 'Open Sans' },
  },
  {
    id: 'editorial',
    name: 'Editorial',
    description: 'Magazine-style serif on warm cream with an oxblood accent.',
    tags: ['Editorial', 'Premium'],
    keywords: ['storytelling', 'magazine', 'long-form', 'thought-leadership', 'brand'],
    colors: { background: '#FAF8F3', surface: '#F0EBE0', heading: '#1C1B17', body: '#3F3D37', accent: '#8B1A1A' },
    fonts: { heading: 'Newsreader', body: 'Inter' },
  },
  {
    id: 'brutalist',
    name: 'Brutalist',
    description: 'High-contrast cream-and-black with a signal yellow. Bold, modern, agency-energy.',
    tags: ['Bold', 'Agency'],
    keywords: ['agency', 'launch', 'creative', 'campaign', 'announcement'],
    colors: { background: '#FFF9E6', surface: '#F5EFC8', heading: '#000000', body: '#1A1A1A', accent: '#FFD60A' },
    fonts: { heading: 'Space Grotesk', body: 'Inter' },
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Deep forest with parchment text and an emerald signal. Calm, natural, grounded.',
    tags: ['Sustainability', 'Outdoor'],
    keywords: ['nature', 'outdoor', 'climate', 'biotech', 'forestry', 'sustainability'],
    colors: { background: '#0F2419', surface: '#1A3324', heading: '#F5F1E8', body: '#A8B5A0', accent: '#10B981' },
    fonts: { heading: 'Sora', body: 'Inter' },
  },
]

export function getThemeById(id: string): ThemePreset {
  return THEME_PRESETS.find((t) => t.id === id) ?? THEME_PRESETS[0]
}

/**
 * Lightweight on-device theme suggestion. Tokenises the user's prompt and
 * scores each theme by keyword overlap. Returns the top N theme ids in
 * descending relevance order. Falls back to an empty list when the prompt
 * is too short to draw conclusions from — the caller can use that signal
 * to skip the "AI Recommended" badge.
 *
 * Deliberately not an LLM call — runs synchronously on every keystroke.
 */
export function suggestThemes(prompt: string, limit: number = 3): string[] {
  const text = (prompt || '').toLowerCase()
  if (text.trim().length < 6) return []

  const tokens = new Set(text.split(/[^a-z0-9]+/).filter((t) => t.length > 2))
  if (tokens.size === 0) return []

  const scored = THEME_PRESETS.map((t) => {
    let score = 0
    for (const kw of t.keywords ?? []) {
      // Exact token hit
      if (tokens.has(kw)) score += 3
      // Substring within the prompt — catches phrases like "investor pitch"
      else if (text.includes(kw)) score += 2
    }
    // Tag boost — looser match, smaller weight
    for (const tag of t.tags ?? []) {
      if (tokens.has(tag.toLowerCase())) score += 1
    }
    return { id: t.id, score }
  })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.id)
}
