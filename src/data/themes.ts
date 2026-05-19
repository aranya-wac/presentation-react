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

// Gamma-named themes with refined low-contrast palettes — names mirror the
// Gamma reference collection (Pearl, Vortex, Clementa, Stratos, Nova,
// Twilight, Coral Glow, Mercury, Ashrose, Spectrum). Designed for editorial
// quality with subtle tonal contrast, not high-saturation accents.
export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'pearl',
    name: 'Pearl',
    description: 'Soft pearl cream with warm beige accents. Editorial light, magazine-style.',
    tags: ['Light', 'Editorial', 'Neutral'],
    keywords: ['editorial', 'magazine', 'minimal', 'classic', 'paper', 'brand'],
    colors: { background: '#F5F2EB', surface: '#ECE7DE', heading: '#2A2925', body: '#4A4842', accent: '#8B8275' },
    fonts: { heading: 'Inter Tight', body: 'Inter' },
  },
  {
    id: 'vortex',
    name: 'Vortex',
    description: 'Deep charcoal with refined silver accents. Atmospheric dark, premium editorial.',
    tags: ['Dark', 'Editorial', 'Premium'],
    keywords: ['premium', 'editorial', 'dark', 'product', 'pitch', 'brand', 'modern'],
    colors: { background: '#0B0E14', surface: '#1A1F2A', heading: '#E8EBF0', body: '#B8BCC4', accent: '#6B7280' },
    fonts: { heading: 'Inter Tight', body: 'Inter' },
  },
  {
    id: 'clementa',
    name: 'Clementa',
    description: 'Warm cream paper with terracotta accent. Magazine spread, hospitality, lifestyle.',
    tags: ['Light', 'Warm', 'Editorial'],
    keywords: ['hospitality', 'lifestyle', 'editorial', 'magazine', 'travel', 'wellness'],
    colors: { background: '#F7F0E4', surface: '#EFE6D2', heading: '#2B1E10', body: '#3D2C1B', accent: '#C9854E' },
    fonts: { heading: 'Inter Tight', body: 'Inter' },
  },
  {
    id: 'stratos',
    name: 'Stratos',
    description: 'Deep navy with soft slate-blue accent. Corporate, boardroom, financial-grade.',
    tags: ['Dark', 'Corporate', 'Modern'],
    keywords: ['investor', 'board', 'finance', 'enterprise', 'b2b', 'sales', 'corporate'],
    colors: { background: '#0F1626', surface: '#1F2A40', heading: '#DDE3F0', body: '#9BA5B8', accent: '#6B8AC4' },
    fonts: { heading: 'Inter Tight', body: 'Inter' },
  },
  {
    id: 'nova',
    name: 'Nova',
    description: 'Soft lavender with muted violet accent. Dreamy editorial, creative, modern.',
    tags: ['Light', 'Creative', 'Editorial'],
    keywords: ['creative', 'design', 'brand', 'modern', 'product', 'art'],
    colors: { background: '#EBE6F2', surface: '#DDD3EA', heading: '#2A1F40', body: '#3D3055', accent: '#8B7AAD' },
    fonts: { heading: 'Inter Tight', body: 'Inter' },
  },
  {
    id: 'twilight',
    name: 'Twilight',
    description: 'Warm dusty peach with muted amber. Sunset editorial, hospitality, travel.',
    tags: ['Light', 'Warm', 'Editorial'],
    keywords: ['travel', 'hospitality', 'lifestyle', 'wellness', 'experience', 'editorial'],
    colors: { background: '#F2E2D2', surface: '#E8D5BF', heading: '#3A1F0F', body: '#4D2F1C', accent: '#C97A4A' },
    fonts: { heading: 'Inter Tight', body: 'Inter' },
  },
  {
    id: 'coral-glow',
    name: 'Coral Glow',
    description: 'Soft coral with muted peach accent. Warm, approachable, modern editorial.',
    tags: ['Light', 'Warm', 'Soft'],
    keywords: ['brand', 'lifestyle', 'creative', 'wellness', 'consumer', 'editorial'],
    colors: { background: '#F5E0D5', surface: '#ECD0BF', heading: '#3A2418', body: '#4D3525', accent: '#D67A5C' },
    fonts: { heading: 'Inter Tight', body: 'Inter' },
  },
  {
    id: 'mercury',
    name: 'Mercury',
    description: 'Refined monochrome grayscale. Information design, analytics, reports, QBRs.',
    tags: ['Light', 'Minimal', 'Data'],
    keywords: ['report', 'analytics', 'data', 'research', 'qbr', 'review', 'whitepaper'],
    colors: { background: '#F0F0F0', surface: '#E5E5E5', heading: '#1A1A1A', body: '#2A2A2A', accent: '#8A8A8A' },
    fonts: { heading: 'Inter Tight', body: 'Inter' },
  },
  {
    id: 'ashrose',
    name: 'Ashrose',
    description: 'Muted dusty pink with refined rose accent. Editorial soft, brand, fashion.',
    tags: ['Light', 'Soft', 'Editorial'],
    keywords: ['brand', 'fashion', 'beauty', 'lifestyle', 'editorial', 'consumer'],
    colors: { background: '#F0E2E0', surface: '#E5D2CF', heading: '#3A2025', body: '#4D2F35', accent: '#B0707A' },
    fonts: { heading: 'Inter Tight', body: 'Inter' },
  },
  {
    id: 'spectrum',
    name: 'Spectrum',
    description: 'Cool blue-violet neutral with refined gradient feel. Tech, AI, modern product.',
    tags: ['Light', 'Tech', 'Modern'],
    keywords: ['ai', 'ml', 'tech', 'product', 'platform', 'innovation', 'modern'],
    colors: { background: '#EAEAF5', surface: '#DDDBEA', heading: '#1F2A4A', body: '#2F3D5A', accent: '#6B7AC4' },
    fonts: { heading: 'Inter Tight', body: 'Inter' },
  },
  {
    id: 'gamma-dark',
    name: 'Gamma Dark',
    description: 'Premium dark editorial with indigo accent. The flagship — modern SaaS pitches and product decks.',
    tags: ['Premium', 'Editorial', 'Modern'],
    keywords: ['startup', 'ai', 'product', 'pitch', 'saas', 'investor', 'modern', 'tech'],
    colors: { background: '#09090B', surface: '#1F1F23', heading: '#FAFAFA', body: '#E5E5E5', accent: '#6366F1' },
    fonts: { heading: 'Inter Tight', body: 'Inter' },
  },
  {
    id: 'gamma-paper',
    name: 'Gamma Paper',
    description: 'Editorial light. Warm beige paper with deep terracotta. Magazine-spread storytelling.',
    tags: ['Premium', 'Editorial', 'Light'],
    keywords: ['editorial', 'magazine', 'storytelling', 'thought-leadership', 'brand', 'education'],
    colors: { background: '#F4EFE4', surface: '#E8E2D2', heading: '#0A0A0A', body: '#1A1A1A', accent: '#D4733A' },
    fonts: { heading: 'Inter Tight', body: 'Inter' },
  },
  {
    id: 'gamma-editorial',
    name: 'Gamma Editorial',
    description: 'Cinematic noir. Pure black with a signal red. Agency, launch, dramatic brand work.',
    tags: ['Premium', 'Bold', 'Cinematic'],
    keywords: ['launch', 'agency', 'campaign', 'fashion', 'luxury', 'cinematic', 'brand'],
    colors: { background: '#050507', surface: '#1A1A1F', heading: '#FAFAFA', body: '#E5E5E5', accent: '#FF4C4C' },
    fonts: { heading: 'Inter Tight', body: 'Inter' },
  },
  {
    id: 'gamma-sunset',
    name: 'Gamma Sunset',
    description: 'Cinematic warm. Deep ember with amber glow. Hospitality, travel, lifestyle.',
    tags: ['Premium', 'Warm', 'Cinematic'],
    keywords: ['hospitality', 'travel', 'luxury', 'sunset', 'wellness', 'experience', 'restaurant'],
    colors: { background: '#0D0604', surface: '#2A1810', heading: '#FFEEDD', body: '#A89384', accent: '#FF8C42' },
    fonts: { heading: 'Inter Tight', body: 'Inter' },
  },
  {
    id: 'gamma-midnight',
    name: 'Gamma Midnight',
    description: 'Corporate navy with ice-blue accent. Board-room, enterprise, financial-grade decks.',
    tags: ['Premium', 'Corporate', 'Modern'],
    keywords: ['investor', 'board', 'finance', 'enterprise', 'b2b', 'sales', 'corporate'],
    colors: { background: '#050B1F', surface: '#162455', heading: '#E8EEFF', body: '#8B97C2', accent: '#7FB8FF' },
    fonts: { heading: 'Inter Tight', body: 'Inter' },
  },
  {
    id: 'gamma-aurora',
    name: 'Gamma Aurora',
    description: 'Deep purple with electric violet. Futuristic, AI, holographic. Modern tech demos.',
    tags: ['Premium', 'Tech', 'Bold'],
    keywords: ['ai', 'ml', 'futuristic', 'innovation', 'tech', 'product', 'demo'],
    colors: { background: '#0A0418', surface: '#2D1B4E', heading: '#F5EBFF', body: '#9B85C2', accent: '#B794F6' },
    fonts: { heading: 'Inter Tight', body: 'Inter' },
  },
  {
    id: 'gamma-slate',
    name: 'Gamma Slate',
    description: 'Mono grayscale. Pure information design — analytics, reports, research, QBRs.',
    tags: ['Premium', 'Minimal', 'Data'],
    keywords: ['report', 'analytics', 'data', 'research', 'qbr', 'review', 'whitepaper'],
    colors: { background: '#F7F7F7', surface: '#EAEAEA', heading: '#1A1A1A', body: '#737373', accent: '#A8A8A8' },
    fonts: { heading: 'Inter Tight', body: 'Inter' },
  },
  {
    id: 'gamma-sage',
    name: 'Gamma Sage',
    description: 'Deep forest green with botanical accent. Sustainability, climate, biotech, ESG.',
    tags: ['Premium', 'Natural', 'Sustainable'],
    keywords: ['sustainability', 'climate', 'esg', 'biotech', 'health', 'nature', 'wellness'],
    colors: { background: '#081A11', surface: '#1E4A38', heading: '#E8F2EC', body: '#8FA89A', accent: '#7FCBA0' },
    fonts: { heading: 'Inter Tight', body: 'Inter' },
  },
  {
    id: 'gamma-ivory',
    name: 'Gamma Ivory',
    description: 'Classical editorial. Ivory cream with navy and antique gold serif. Refined, fine-art.',
    tags: ['Premium', 'Classical', 'Editorial'],
    keywords: ['editorial', 'classical', 'fine-art', 'literature', 'long-form', 'magazine'],
    colors: { background: '#FBF8F1', surface: '#F0EAD9', heading: '#1A2440', body: '#7A8299', accent: '#BF8A3B' },
    fonts: { heading: 'Newsreader', body: 'Inter' },
  },
  {
    id: 'gamma-carbon',
    name: 'Gamma Carbon',
    description: 'Industrial black with refined cyan. Engineering, blueprints, technical specs.',
    tags: ['Premium', 'Industrial', 'Tech'],
    keywords: ['engineering', 'okr', 'planning', 'technical', 'ops', 'industrial', 'spec'],
    colors: { background: '#000000', surface: '#1A1A1A', heading: '#F0F0F0', body: '#666666', accent: '#00E5FF' },
    fonts: { heading: 'Inter Tight', body: 'Inter' },
  },
  {
    id: 'gamma-sprout',
    name: 'Gamma Sprout',
    description: 'Soft sage green with cream. Watercolor-style editorial. Botanical, peaceful, considered.',
    tags: ['Premium', 'Light', 'Botanical'],
    keywords: ['nature', 'wellness', 'organic', 'health', 'sustainability', 'editorial', 'magazine', 'strategy'],
    colors: { background: '#EAF4EC', surface: '#D7E8DC', heading: '#0B3D2E', body: '#1C3A2C', accent: '#2E8B6B' },
    fonts: { heading: 'Newsreader', body: 'Inter' },
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
