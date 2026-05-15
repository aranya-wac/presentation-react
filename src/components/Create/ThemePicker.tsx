import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { THEME_PRESETS, suggestThemes, type ThemePreset } from '../../data/themes'
import { ThemePreviewCard } from './ThemePreviewCard'

interface Props {
  selectedId: string
  onSelect: (id: string) => void
  /** Live user prompt — drives the AI-recommended theme reordering + badge. */
  prompt?: string
  disabled?: boolean
}

/**
 * Premium theme browser.
 *
 * - Chips are visually equal and quiet at rest.
 * - Hover (desktop) / focus (keyboard) / tap (mobile) opens a popover with
 *   miniature slide previews so the user can read the visual identity
 *   before committing.
 * - When the prompt looks like it matches a topic (e.g. "investor pitch"),
 *   one or two themes get an "AI Recommended" badge and float to the front.
 *
 * Keyboard nav: Tab/Shift+Tab moves between chips, Enter/Space selects.
 * The preview popover opens automatically while a chip has focus.
 */
export function ThemePicker({ selectedId, onSelect, prompt = '', disabled }: Props) {
  // Hover (mouse) vs focus (keyboard) vs persistent (mobile tap) all
  // open the popover. We track which theme to preview and where to anchor it.
  const [previewId, setPreviewId] = useState<string | null>(null)
  // On touch devices the user has no hover — first tap previews,
  // second confirms. `pinned` lets the popover survive blur on mobile.
  const [pinned, setPinned] = useState<string | null>(null)
  // Detect touch-only at first interaction (more reliable than UA sniffing).
  const [touchMode, setTouchMode] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  // AI Recommended order — top-N theme ids, in descending relevance.
  const recommendedIds = useMemo(() => suggestThemes(prompt, 2), [prompt])

  // Sort: recommended first (in score order), then everything else in its
  // canonical order. Selected theme is NOT pushed to the top — that would
  // make the row jump around as the user types.
  const sortedThemes = useMemo<ThemePreset[]>(() => {
    if (recommendedIds.length === 0) return THEME_PRESETS
    const recSet = new Set(recommendedIds)
    const recommended = recommendedIds
      .map((id) => THEME_PRESETS.find((t) => t.id === id))
      .filter((t): t is ThemePreset => Boolean(t))
    const rest = THEME_PRESETS.filter((t) => !recSet.has(t.id))
    return [...recommended, ...rest]
  }, [recommendedIds])

  // Close the popover on click outside (touch mode).
  useEffect(() => {
    if (!pinned) return
    const onDocPointer = (e: Event) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setPinned(null)
        setPreviewId(null)
      }
    }
    document.addEventListener('mousedown', onDocPointer)
    document.addEventListener('touchstart', onDocPointer)
    return () => {
      document.removeEventListener('mousedown', onDocPointer)
      document.removeEventListener('touchstart', onDocPointer)
    }
  }, [pinned])

  // Compute popover X position so it anchors near the hovered chip but
  // never overflows the container.
  const [popoverX, setPopoverX] = useState<number>(0)
  useEffect(() => {
    if (!previewId || !containerRef.current) return
    const chip = chipRefs.current[previewId]
    if (!chip) return
    const containerRect = containerRef.current.getBoundingClientRect()
    const chipRect = chip.getBoundingClientRect()
    const popoverWidth = 360
    const padding = 16
    // Center on the chip, then clamp inside the container.
    let x = chipRect.left - containerRect.left + chipRect.width / 2 - popoverWidth / 2
    x = Math.max(padding, Math.min(containerRect.width - popoverWidth - padding, x))
    setPopoverX(x)
  }, [previewId])

  const activeTheme = sortedThemes.find((t) => t.id === (pinned ?? previewId)) ?? null

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ padding: '12px 20px', borderTop: '1px solid var(--line)' }}
    >
      {/* Floating popover */}
      <AnimatePresence mode="wait">
        {activeTheme && (
          <motion.div
            key={activeTheme.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 8px)',
              left: popoverX,
              zIndex: 30,
            }}
          >
            <ThemePreviewCard
              theme={activeTheme}
              recommended={recommendedIds.includes(activeTheme.id)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Label */}
      <div className="flex items-center gap-2 mb-2.5">
        <span
          className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: 'var(--ink-faint)' }}
        >
          Theme
        </span>
        {recommendedIds.length > 0 && (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: '#6366f1' }}
          >
            <Sparkles size={10} strokeWidth={2.5} />
            AI suggestions ready
          </span>
        )}
      </div>

      {/* Chip row */}
      <div
        className="flex items-center gap-1.5 flex-wrap"
        onTouchStart={() => setTouchMode(true)}
      >
        {sortedThemes.map((t) => {
          const isSelected = selectedId === t.id
          const isRecommended = recommendedIds.includes(t.id)
          return (
            <ThemeChip
              key={t.id}
              theme={t}
              selected={isSelected}
              recommended={isRecommended}
              disabled={disabled}
              ref={(el) => { chipRefs.current[t.id] = el }}
              onClick={() => {
                if (touchMode) {
                  // First tap: preview. Second tap on the same chip: select.
                  if (pinned === t.id) {
                    onSelect(t.id)
                    setPinned(null)
                    setPreviewId(null)
                  } else {
                    setPinned(t.id)
                    setPreviewId(t.id)
                  }
                } else {
                  onSelect(t.id)
                }
              }}
              onHoverEnter={() => { if (!touchMode) setPreviewId(t.id) }}
              onHoverLeave={() => { if (!touchMode && pinned === null) setPreviewId(null) }}
              onFocusIn={() => setPreviewId(t.id)}
              onFocusOut={() => { if (pinned === null) setPreviewId(null) }}
            />
          )
        })}
      </div>
    </div>
  )
}

// ── Chip ────────────────────────────────────────────────────────────────────

interface ChipProps {
  theme: ThemePreset
  selected: boolean
  recommended: boolean
  disabled?: boolean
  onClick: () => void
  onHoverEnter: () => void
  onHoverLeave: () => void
  onFocusIn: () => void
  onFocusOut: () => void
}

const ThemeChip = (function () {
  // Avoiding forwardRef ceremony with a small ref-callback shim.
  function Inner({
    theme,
    selected,
    recommended,
    disabled,
    onClick,
    onHoverEnter,
    onHoverLeave,
    onFocusIn,
    onFocusOut,
    chipRef,
  }: ChipProps & { chipRef: (el: HTMLButtonElement | null) => void }) {
    const { colors } = theme
    return (
      <motion.button
        ref={chipRef}
        type="button"
        onClick={onClick}
        onMouseEnter={onHoverEnter}
        onMouseLeave={onHoverLeave}
        onFocus={onFocusIn}
        onBlur={onFocusOut}
        disabled={disabled}
        aria-pressed={selected}
        aria-label={`${theme.name} theme${recommended ? ' — AI recommended' : ''}`}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 600, damping: 30, mass: 0.4 }}
        className="relative flex items-center gap-1.5 h-8 px-2.5 rounded-full transition-colors"
        style={{
          background: selected ? 'var(--ink-strong)' : '#fff',
          color: selected ? '#fff' : 'var(--ink-strong)',
          border: `1px solid ${selected ? 'var(--ink-strong)' : 'var(--line)'}`,
          boxShadow: selected
            ? '0 1px 2px rgba(15,14,12,0.08), 0 4px 12px -2px rgba(15,14,12,0.15)'
            : '0 1px 2px rgba(15,14,12,0.03)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
        }}
        onMouseDown={(e) => {
          // Subtle hover lift via direct style — keeps spring tight.
          if (!selected) (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,0,0,0.22)'
        }}
      >
        {/* Palette swatch — quarter-circle background + accent stripe */}
        <span
          aria-hidden
          style={{
            width: 14,
            height: 14,
            borderRadius: 4,
            background: colors.background,
            border: `1px solid ${selected ? 'rgba(255,255,255,0.25)' : `${colors.heading}22`}`,
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: 5,
              background: colors.accent,
            }}
          />
        </span>
        <span className="text-[11.5px] font-semibold whitespace-nowrap">{theme.name}</span>
        {recommended && (
          <span
            aria-hidden
            style={{
              width: 5,
              height: 5,
              borderRadius: 999,
              background: '#6366f1',
              boxShadow: '0 0 6px rgba(99,102,241,0.7)',
              marginLeft: 2,
              flexShrink: 0,
            }}
          />
        )}
        {selected && (
          <motion.span
            aria-hidden
            layoutId="theme-active-ring"
            style={{
              position: 'absolute',
              inset: -2,
              borderRadius: 999,
              border: '1.5px solid rgba(15,14,12,0.18)',
              pointerEvents: 'none',
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 36 }}
          />
        )}
      </motion.button>
    )
  }

  // Public component — adapts the ref-callback prop into a regular ref.
  return function ThemeChipWrap({
    ref,
    ...rest
  }: ChipProps & { ref?: (el: HTMLButtonElement | null) => void }) {
    return <Inner {...rest} chipRef={ref ?? (() => {})} />
  }
})()
