import type { Slide, Theme } from '../types'
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

/**
 * Restyle every slide & block so it matches the given preset's colors & fonts.
 * Used when switching themes in the editor and when a deck is generated with
 * a non-default theme chosen on the create screen.
 */
export function applyPresetToSlides(slides: Slide[], t: ThemePreset): Slide[] {
  return slides.map((slide) => ({
    ...slide,
    background: { type: 'color' as const, value: t.colors.background },
    blocks: slide.blocks.map((block) => {
      switch (block.type) {
        case 'title':
        case 'heading':
          return { ...block, styling: { ...block.styling, color: t.colors.heading, font_family: t.fonts.heading } }
        case 'subtitle':
        case 'body':
        case 'text':
        case 'caption':
        case 'quote':
        case 'bullet':
          return { ...block, styling: { ...block.styling, color: t.colors.body, font_family: t.fonts.body } }
        case 'badge':
          return { ...block, styling: { ...block.styling, color: t.colors.accent } }
        case 'shape':
          return { ...block, styling: { ...block.styling, background_color: t.colors.accent, color: t.colors.accent } }
        case 'panel':
          return { ...block, styling: { ...block.styling, background_color: t.colors.surface } }
        case 'card':
          return { ...block, styling: { ...block.styling, background_color: t.colors.surface, color: t.colors.heading } }
        case 'stat':
          return { ...block, styling: { ...block.styling, color: t.colors.accent } }
        case 'process_circle':
          return { ...block, styling: { ...block.styling, background_color: t.colors.accent, color: '#ffffff' } }
        default:
          return { ...block, styling: { ...block.styling, color: t.colors.body } }
      }
    }),
  }))
}
