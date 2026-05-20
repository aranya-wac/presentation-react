import type { Slide, Block, Theme } from '../types'
import { getThemeById } from '../data/themes'
import type { ThemePreset } from '../data/themes'

/**
 * Convert a ThemePreset (palette + fonts) into a backend-shaped Theme object.
 * The backend renderer treats heading→primary and surface→secondary.
 */
export function presetToTheme(p: ThemePreset): Theme {
  return {
    id: p.id,
    name: p.name,
    colors: {
      primary:    p.colors.heading,
      secondary:  p.colors.surface,
      accent:     p.colors.accent,
      background: p.colors.background,
      text:       p.colors.body,
    },
    fonts: {
      heading: { family: p.fonts.heading, size: 52, weight: 800 },
      body:    { family: p.fonts.body,    size: 16, weight: 400 },
      caption: { family: p.fonts.body,    size: 12, weight: 400 },
    },
  }
}

// ── Color helpers ────────────────────────────────────────────────────────────

function normHex(value: string): string {
  if (!value || !value.startsWith('#')) return value.toLowerCase()
  let h = value.slice(1)
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  return `#${h.toLowerCase()}`
}

function withAlpha(hex: string, alpha: number): string {
  if (!hex.startsWith('#')) return hex
  let h = hex.slice(1)
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  if (h.length !== 6) return hex
  const a = Math.max(0, Math.min(255, Math.round(alpha * 255)))
    .toString(16).padStart(2, '0')
  return `#${h}${a}`
}

/** Role lookup keyed by lowercased hex (#rrggbb) of the previous theme. */
type RoleMap = Map<string, keyof ThemePreset['colors']>

function buildRoleMap(prev: ThemePreset): RoleMap {
  const m: RoleMap = new Map()
  ;(['background', 'surface', 'heading', 'body', 'accent'] as const).forEach((role) => {
    m.set(normHex(prev.colors[role]), role)
  })
  return m
}

/**
 * Swap any color in `value` that matches a role in the previous theme with
 * the same role in the next theme. Handles bare `#rrggbb`, `#rrggbbaa`, and
 * occurrences inside gradient/url strings.
 */
function remapColors(value: string | undefined, roles: RoleMap, next: ThemePreset): string | undefined {
  if (!value) return value
  return value.replace(/#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?/g, (_, hex: string, alpha?: string) => {
    const role = roles.get(`#${hex.toLowerCase()}`)
    if (!role) return alpha ? `#${hex}${alpha}` : `#${hex}`
    return alpha ? `${next.colors[role]}${alpha}` : next.colors[role]
  })
}

/**
 * Build a subtle diagonal gradient from the theme palette. Used when a slide
 * had a gradient background but its stops don't map to the previous theme's
 * role colors — we rebuild from scratch so the gradient stays on-theme.
 */
function themeGradient(t: ThemePreset): string {
  return `linear-gradient(135deg, ${t.colors.background} 0%, ${t.colors.surface} 60%, ${withAlpha(t.colors.accent, 0.18)} 100%)`
}

// ── Per-block role-default styling ───────────────────────────────────────────

function applyRoleStyling(block: Block, t: ThemePreset): Block {
  const s = block.styling
  switch (block.type) {
    case 'title':
    case 'heading':
      return { ...block, styling: { ...s, color: t.colors.heading, font_family: t.fonts.heading } }
    case 'subtitle':
    case 'body':
    case 'text':
    case 'caption':
    case 'quote':
    case 'bullet':
      return { ...block, styling: { ...s, color: t.colors.body, font_family: t.fonts.body } }
    case 'badge':
      return { ...block, styling: { ...s, color: t.colors.accent, background_color: withAlpha(t.colors.accent, 0.08) } }
    case 'shape':
      return { ...block, styling: { ...s, background_color: t.colors.accent, color: t.colors.accent } }
    case 'panel':
      return { ...block, styling: { ...s, background_color: t.colors.surface } }
    case 'card':
      return { ...block, styling: { ...s, background_color: t.colors.surface, color: t.colors.heading } }
    case 'stat':
      return { ...block, styling: { ...s, color: t.colors.accent } }
    case 'process_circle':
      return { ...block, styling: { ...s, background_color: t.colors.accent, color: '#ffffff' } }
    case 'image':
    case 'chart':
      return block
    default:
      return { ...block, styling: { ...s, color: t.colors.body } }
  }
}

// ── Main entry point ─────────────────────────────────────────────────────────

/**
 * Restyle every slide & block so it looks like a fresh slide for the given
 * preset, while preserving content. When `prevTheme` is supplied, any color
 * matching a role in the old palette is remapped to the same role in the new
 * palette — so badges, accent rules, gradient stops, dividers, and per-block
 * background tints follow the theme switch (not just the body text).
 *
 * The default `prevTheme` is `vortex` because the backend generator emits
 * decks in that palette, so on first apply (CreatePage) we can still remap.
 *
 * Backgrounds:
 *   - color    → recolored to the new theme background (or role-remapped)
 *   - gradient → role-remapped if its stops were theme colors; otherwise rebuilt
 *   - image    → preserved
 * editor_background.image is preserved; its overlay re-derives from the
 * new theme so legibility tracks the palette.
 */
export function applyPresetToSlides(
  slides: Slide[],
  next: ThemePreset,
  prevTheme: ThemePreset = getThemeById('vortex'),
): Slide[] {
  const roles = buildRoleMap(prevTheme)

  return slides.map((slide) => {
    // ── Background ─────────────────────────────────────────────────────────
    // On a theme switch, any photographic backdrop from the previous theme
    // (whether it lived in slide.background.type === 'image' or in
    // editor_background.image) is dropped and replaced with a gradient built
    // from the new theme palette. Keeping a stale dune/cityscape photo would
    // leak the old theme's atmosphere into the new one.
    const hadEditorPhoto = !!slide.editor_background?.image
    const prevBg = slide.background
    const prevBgIsImage = prevBg?.type === 'image'
    let nextBg = prevBg

    if (hadEditorPhoto || prevBgIsImage) {
      nextBg = { type: 'gradient', value: themeGradient(next) }
    } else if (!prevBg || prevBg.type === 'color') {
      const remapped = prevBg ? remapColors(prevBg.value, roles, next) : undefined
      const sameAsPrevBg = remapped && normHex(remapped) === normHex(prevTheme.colors.background)
      nextBg = {
        type: 'color',
        value: sameAsPrevBg ? next.colors.background : (remapped ?? next.colors.background),
      }
    } else if (prevBg.type === 'gradient') {
      const remapped = remapColors(prevBg.value, roles, next)
      const changed = remapped !== prevBg.value
      nextBg = { type: 'gradient', value: changed ? (remapped as string) : themeGradient(next) }
    }

    // ── Editor-only photographic backdrop ──────────────────────────────────
    // Drop the old photo backdrop on theme switch. The new theme's gradient
    // (assigned to slide.background above) takes its place.
    const nextEditorBg = undefined

    // ── Blocks: role-default styling, then color remap for any leftovers ──
    // Strip full-bleed image blocks first. These are image blocks the AI used
    // as de-facto slide backgrounds (positioned at 0,0 spanning ~1280×720).
    // They leak the previous theme's atmosphere (e.g. brown dunes) through to
    // a freshly-picked light theme, so we drop them; the new theme's gradient
    // computed above on slide.background takes their place.
    const isFullBleedImage = (block: any) => {
      if (block?.type !== 'image') return false
      const p = block.position
      if (!p) return false
      return p.x === 0 && p.y === 0 && p.w >= 1200 && p.h >= 680
    }

    const blocks = slide.blocks
      .filter((block) => !isFullBleedImage(block))
      .map((block) => {
        const styled = applyRoleStyling(block, next)
        // Role-default styling above sets the *standard* slots (e.g. title→heading
        // color). Anything else in the block's styling (custom background_color
        // on a text block, accent stroke on a panel, etc.) gets role-remapped so
        // it tracks the palette swap instead of staying on the old theme.
        const remappedStyling = {
          ...styled.styling,
          color: remapColors(styled.styling.color, roles, next),
          background_color: remapColors(styled.styling.background_color, roles, next),
        }
        return { ...styled, styling: remappedStyling }
      })

    return { ...slide, background: nextBg, editor_background: nextEditorBg, blocks }
  })
}
