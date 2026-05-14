import type { Slide, Theme } from '../../types'
import { SlidePreview } from '../Presentation/SlidePreview'

interface Props {
  slides: Slide[]
  theme: Theme
  selectedIndex: number
  onSelect: (index: number) => void
}

export function OutlinePanel({ slides, theme, selectedIndex, onSelect }: Props) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 flex-shrink-0"
        style={{ height: 40, borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#334155' }}>
          Slides
        </span>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full font-mono"
          style={{ background: 'rgba(255,255,255,0.05)', color: '#475569' }}
        >
          {slides.length}
        </span>
      </div>

      {/* Slide list */}
      <div className="flex flex-col gap-1 p-2 overflow-y-auto">
        {slides.map((slide, idx) => {
          const isSelected = idx === selectedIndex

          return (
            <button
              key={idx}
              onClick={() => onSelect(idx)}
              className="w-full rounded-xl transition-all group flex flex-col gap-1.5 p-2 text-left"
              style={{
                background: isSelected ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.02)',
                border: isSelected
                  ? '1.5px solid rgba(99,102,241,0.45)'
                  : '1.5px solid transparent',
                outline: 'none',
              }}
            >
              {/* Thumbnail — fixed 160×90 at scale 0.125 */}
              <div
                style={{
                  width: 160, height: 90,
                  overflow: 'hidden',
                  borderRadius: 6,
                  position: 'relative',
                  flexShrink: 0,
                  boxShadow: isSelected
                    ? '0 0 0 1.5px rgba(99,102,241,0.5)'
                    : '0 2px 8px rgba(0,0,0,0.4)',
                }}
              >
                <div
                  style={{
                    position: 'absolute', top: 0, left: 0,
                    width: 1280, height: 720,
                    transform: 'scale(0.125)',
                    transformOrigin: 'top left',
                    pointerEvents: 'none',
                  }}
                >
                  <SlidePreview slide={slide} theme={theme} scale={1} />
                </div>
              </div>

              {/* Slide number + type */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono tabular-nums" style={{ color: '#334155' }}>
                  {idx + 1}
                </span>
                <span
                  className="text-[9px] font-semibold truncate"
                  style={{ color: isSelected ? '#818cf8' : '#475569' }}
                >
                  {slide.type.replace(/_/g, ' ')}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
