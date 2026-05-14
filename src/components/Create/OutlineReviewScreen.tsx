import { useState } from 'react'
import { ArrowLeft, GripVertical, Plus, Sparkles, Trash2 } from 'lucide-react'

export type OutlineSlide = { order: number; type: string; title: string }

interface Props {
  deckTitle: string
  initialSlides: OutlineSlide[]
  onBack: () => void
  onConfirm: (slides: OutlineSlide[]) => void
  isGenerating?: boolean
}

const SLIDE_TYPES: { id: string; label: string }[] = [
  { id: 'title',      label: 'Title' },
  { id: 'agenda',     label: 'Agenda' },
  { id: 'content',    label: 'Content' },
  { id: 'stats',      label: 'Stats' },
  { id: 'chart',      label: 'Chart' },
  { id: 'roadmap',    label: 'Roadmap' },
  { id: 'comparison', label: 'Comparison' },
  { id: 'kanban',     label: 'Kanban (3-col)' },
  { id: 'funnel',     label: 'Funnel' },
  { id: 'quote',      label: 'Quote' },
  { id: 'closing',    label: 'Closing' },
]

export function OutlineReviewScreen({
  deckTitle, initialSlides, onBack, onConfirm, isGenerating,
}: Props) {
  const [slides, setSlides] = useState<OutlineSlide[]>(initialSlides)
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null)

  const reorder = (next: OutlineSlide[]) =>
    next.map((s, i) => ({ ...s, order: i + 1 }))

  const updateTitle = (idx: number, title: string) => {
    setSlides((prev) => prev.map((s, i) => (i === idx ? { ...s, title } : s)))
  }

  const updateType = (idx: number, type: string) => {
    setSlides((prev) => prev.map((s, i) => (i === idx ? { ...s, type } : s)))
  }

  const removeAt = (idx: number) => {
    setSlides((prev) => reorder(prev.filter((_, i) => i !== idx)))
  }

  const insertAfter = (idx: number) => {
    setSlides((prev) => {
      const next = [...prev]
      next.splice(idx + 1, 0, { order: 0, type: 'content', title: 'New slide' })
      return reorder(next)
    })
  }

  const handleDragStart = (idx: number) => () => setDraggingIdx(idx)
  const handleDragOver = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault()
    if (draggingIdx === null || draggingIdx === idx) return
    setSlides((prev) => {
      const next = [...prev]
      const [m] = next.splice(draggingIdx, 1)
      next.splice(idx, 0, m)
      setDraggingIdx(idx)
      return reorder(next)
    })
  }
  const handleDragEnd = () => setDraggingIdx(null)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--paper)' }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-10 h-14"
        style={{ borderBottom: '1px solid var(--line)' }}
      >
        <button
          onClick={onBack}
          disabled={isGenerating}
          className="flex items-center gap-2 px-3 h-9 rounded-full text-[13px] transition-colors"
          style={{ color: 'var(--ink)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(10,9,7,0.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <ArrowLeft size={14} />
          Back to prompt
        </button>
        <p className="eyebrow">— Review outline</p>
        <div className="w-[160px]" />
      </div>

      {/* Body */}
      <div className="flex-1 flex items-start justify-center px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-[760px]">
          <div className="mb-8 text-center">
            <p className="eyebrow mb-3">— Confirm structure</p>
            <h1
              className="font-serif leading-[1.05] tracking-tight text-[36px] md:text-[44px]"
              style={{ color: 'var(--ink-strong)' }}
            >
              {deckTitle || 'Your deck outline'}
            </h1>
            <p
              className="text-[14px] mt-4 max-w-md mx-auto leading-relaxed"
              style={{ color: 'var(--ink-soft)' }}
            >
              Rename, reorder, or change slide types. Then click <strong>Generate slides</strong> to write the full deck.
            </p>
          </div>

          {/* Slide list */}
          <div className="space-y-2">
            {slides.map((slide, idx) => (
              <div
                key={`${slide.order}-${idx}`}
                draggable={!isGenerating}
                onDragStart={handleDragStart(idx)}
                onDragOver={handleDragOver(idx)}
                onDragEnd={handleDragEnd}
                className="flex items-center gap-2 rounded-xl px-3 py-2 transition-all"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  opacity: draggingIdx === idx ? 0.5 : 1,
                  cursor: isGenerating ? 'default' : 'grab',
                }}
              >
                <GripVertical size={14} style={{ color: 'var(--ink-muted)' }} />
                <span
                  className="text-[11px] font-semibold w-6 text-center"
                  style={{ color: 'var(--ink-muted)' }}
                >
                  {idx + 1}
                </span>
                <select
                  value={slide.type}
                  onChange={(e) => updateType(idx, e.target.value)}
                  disabled={isGenerating || idx === 0 || idx === slides.length - 1}
                  title={
                    idx === 0
                      ? 'First slide is always Title'
                      : idx === slides.length - 1
                      ? 'Last slide is always Closing'
                      : undefined
                  }
                  className="text-[12px] font-semibold rounded-lg px-2 py-1 outline-none cursor-pointer w-[100px]"
                  style={{
                    background: 'var(--paper-2)',
                    border: '1px solid var(--line)',
                    color: 'var(--ink-strong)',
                  }}
                >
                  {SLIDE_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <input
                  value={slide.title}
                  onChange={(e) => updateTitle(idx, e.target.value)}
                  disabled={isGenerating}
                  className="flex-1 bg-transparent text-[14px] outline-none px-2 py-1 rounded-md"
                  style={{ color: 'var(--ink-strong)' }}
                  placeholder="Slide title"
                />
                <button
                  onClick={() => insertAfter(idx)}
                  disabled={isGenerating}
                  title="Add slide after this one"
                  className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
                  style={{ color: 'var(--ink-muted)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(10,9,7,0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Plus size={14} />
                </button>
                <button
                  onClick={() => removeAt(idx)}
                  disabled={isGenerating || slides.length <= 3}
                  title={slides.length <= 3 ? 'Need at least 3 slides' : 'Delete this slide'}
                  className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
                  style={{
                    color: slides.length <= 3 ? 'rgba(10,9,7,0.2)' : 'var(--ink-muted)',
                    cursor: slides.length <= 3 ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (slides.length > 3) e.currentTarget.style.background = 'rgba(180,60,40,0.10)'
                  }}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between mt-8">
            <p className="text-[12px]" style={{ color: 'var(--ink-muted)' }}>
              {slides.length} slides · drag to reorder
            </p>
            <button
              onClick={() => onConfirm(slides)}
              disabled={isGenerating || slides.length < 3}
              className="flex items-center gap-2 h-11 px-6 rounded-full text-[13px] font-semibold transition-all"
              style={{
                background: isGenerating || slides.length < 3 ? 'rgba(10,9,7,0.15)' : 'var(--ink-strong)',
                color: '#fff',
                cursor: isGenerating || slides.length < 3 ? 'not-allowed' : 'pointer',
              }}
            >
              <Sparkles size={14} />
              {isGenerating ? 'Generating…' : 'Generate slides'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
