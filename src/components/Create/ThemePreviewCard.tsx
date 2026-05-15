import type { ThemePreset } from '../../data/themes'
import { motion } from 'framer-motion'

/**
 * Floating preview shown above the chip row on hover/tap. Renders three
 * miniature slide vignettes (title, content, data) inline using the theme's
 * own colors and fonts — so users can read the actual identity before they
 * commit.
 */
export function ThemePreviewCard({
  theme,
  recommended,
}: {
  theme: ThemePreset
  recommended?: boolean
}) {
  const { colors, fonts } = theme
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.98 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      style={{
        width: 360,
        background: '#fff',
        border: '1px solid var(--line)',
        borderRadius: 16,
        boxShadow:
          '0 1px 2px rgba(15,14,12,0.04), 0 24px 64px -16px rgba(15,14,12,0.22), 0 8px 24px -8px rgba(15,14,12,0.12)',
        overflow: 'hidden',
        pointerEvents: 'none', // popover is informational; clicks pass through
      }}
    >
      {/* Header — theme name + tags */}
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--ink-strong)',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
              }}
            >
              {theme.name}
            </span>
            {recommended && (
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: 'rgba(99,102,241,0.10)',
                  color: '#6366f1',
                  border: '1px solid rgba(99,102,241,0.18)',
                }}
              >
                AI Recommended
              </span>
            )}
          </div>
          {/* Palette swatches */}
          <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
            <Swatch color={colors.background} ringColor={colors.heading} />
            <Swatch color={colors.surface} ringColor={colors.heading} />
            <Swatch color={colors.heading} ringColor={colors.heading} />
            <Swatch color={colors.accent} ringColor={colors.heading} />
          </div>
        </div>
        {theme.description && (
          <p style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 6, lineHeight: 1.5 }}>
            {theme.description}
          </p>
        )}
        {theme.tags && theme.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
            {theme.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '2px 7px',
                  borderRadius: 999,
                  background: 'rgba(0,0,0,0.04)',
                  color: 'var(--ink-soft)',
                  border: '1px solid var(--line)',
                  whiteSpace: 'nowrap',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Slides preview row */}
      <div style={{ padding: 12, display: 'flex', gap: 8, background: 'rgba(0,0,0,0.015)' }}>
        <MiniSlide kind="title" theme={theme} />
        <MiniSlide kind="content" theme={theme} />
        <MiniSlide kind="data" theme={theme} />
      </div>

      {/* Footer — typography */}
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.10em',
            color: 'var(--ink-faint)',
          }}
        >
          Type
        </span>
        <span
          style={{
            fontSize: 14,
            color: 'var(--ink-strong)',
            fontFamily: `'${fonts.heading}', serif`,
            letterSpacing: '-0.01em',
          }}
        >
          {fonts.heading}
        </span>
        <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>·</span>
        <span
          style={{
            fontSize: 12,
            color: 'var(--ink-soft)',
            fontFamily: `'${fonts.body}', sans-serif`,
          }}
        >
          {fonts.body}
        </span>
      </div>
    </motion.div>
  )
}

function Swatch({ color, ringColor }: { color: string; ringColor: string }) {
  return (
    <span
      aria-hidden
      style={{
        width: 12,
        height: 12,
        borderRadius: 4,
        background: color,
        border: `1px solid ${ringColor}22`,
        boxShadow: '0 1px 1px rgba(0,0,0,0.05)',
        display: 'inline-block',
      }}
    />
  )
}

/** A single 16:9 mini slide rendered in the theme's own visual language. */
function MiniSlide({
  kind,
  theme,
}: {
  kind: 'title' | 'content' | 'data'
  theme: ThemePreset
}) {
  const { colors, fonts } = theme
  return (
    <div
      style={{
        flex: 1,
        aspectRatio: '16 / 10',
        background: colors.background,
        borderRadius: 8,
        border: `1px solid ${colors.heading}1a`,
        overflow: 'hidden',
        position: 'relative',
        padding: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {kind === 'title' && (
        <>
          <span
            style={{
              fontFamily: `'${fonts.heading}', serif`,
              fontSize: 9.5,
              fontWeight: 700,
              color: colors.heading,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
            }}
          >
            Quarterly Review
          </span>
          <span
            style={{
              fontFamily: `'${fonts.body}', sans-serif`,
              fontSize: 6,
              color: colors.body,
              lineHeight: 1.3,
            }}
          >
            FY26 · Q3 highlights
          </span>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 12, height: 1.5, background: colors.accent, borderRadius: 1 }} />
            <span style={{ fontSize: 5, color: colors.body, fontFamily: `'${fonts.body}'` }}>
              {theme.name}
            </span>
          </div>
        </>
      )}
      {kind === 'content' && (
        <>
          <span
            style={{
              fontFamily: `'${fonts.heading}', serif`,
              fontSize: 6.5,
              fontWeight: 700,
              color: colors.heading,
              letterSpacing: '-0.01em',
            }}
          >
            Key insights
          </span>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: 999,
                  background: colors.accent,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  flex: 1,
                  height: 2,
                  background: colors.body,
                  opacity: 0.45,
                  borderRadius: 1,
                  marginRight: i === 0 ? 4 : i === 1 ? 8 : 12,
                }}
              />
            </div>
          ))}
        </>
      )}
      {kind === 'data' && (
        <>
          <span
            style={{
              fontFamily: `'${fonts.heading}', serif`,
              fontSize: 6.5,
              fontWeight: 700,
              color: colors.heading,
              letterSpacing: '-0.01em',
            }}
          >
            Performance
          </span>
          {/* Mini bar chart */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 24, marginTop: 2 }}>
            {[32, 56, 48, 72, 64, 88].map((h, i) => (
              <span
                key={i}
                style={{
                  flex: 1,
                  height: `${h}%`,
                  background: i === 5 ? colors.accent : colors.body,
                  opacity: i === 5 ? 1 : 0.35,
                  borderRadius: 1,
                }}
              />
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <span
            style={{
              fontSize: 5,
              color: colors.body,
              fontFamily: `'${fonts.body}'`,
              opacity: 0.7,
            }}
          >
            Q1 — Q3
          </span>
        </>
      )}
    </div>
  )
}
