import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { templatesApi } from '../../api/client'
import type { TemplateListItem } from '../../types'

interface Props {
  selectedId: string | null
  onSelect: (id: string | null) => void
  disabled?: boolean
}

/**
 * Template chip picker. Replaces the theme picker — picking a template means
 * the generated pptx adopts that template's design. Selection is optional:
 * leaving it unset preserves the prompt-only generation flow (so file/url/
 * image attachments keep working).
 */
export function TemplatePicker({ selectedId, onSelect, disabled }: Props) {
  const [templates, setTemplates] = useState<TemplateListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    templatesApi
      .list({ source: 'all' })
      .then((r) => setTemplates(r.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line)' }}>
      <div className="flex items-center gap-2 mb-2.5">
        <span
          className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: 'var(--ink-faint)' }}
        >
          Template
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {loading && (
          <span className="text-[12px]" style={{ color: 'var(--ink-faint)' }}>
            Loading…
          </span>
        )}
        {!loading && templates.length === 0 && (
          <span className="text-[12px]" style={{ color: 'var(--ink-faint)' }}>
            No templates available.
          </span>
        )}
        {!loading &&
          templates.map((t) => {
            const isSelected = selectedId === t.id
            const accent = t.theme?.colors?.accent ?? '#B43C28'
            const bg = t.theme?.colors?.background ?? '#FAFAFA'
            const ink = t.theme?.colors?.text ?? '#0A0907'
            return (
              <motion.button
                key={t.id}
                type="button"
                onClick={() => onSelect(isSelected ? null : t.id)}
                disabled={disabled}
                aria-pressed={isSelected}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 600, damping: 30, mass: 0.4 }}
                className="relative flex items-center gap-1.5 h-8 px-2.5 rounded-full transition-colors"
                style={{
                  background: isSelected ? 'var(--ink-strong)' : 'var(--surface)',
                  color: isSelected ? 'var(--paper)' : 'var(--ink-strong)',
                  border: `1px solid ${isSelected ? 'var(--ink-strong)' : 'var(--line)'}`,
                  boxShadow: isSelected
                    ? '0 1px 2px rgba(15,14,12,0.08), 0 4px 12px -2px rgba(15,14,12,0.15)'
                    : '0 1px 2px rgba(15,14,12,0.03)',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  outline: 'none',
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 4,
                    background: bg,
                    border: `1px solid ${isSelected ? 'rgba(255,255,255,0.25)' : `${ink}22`}`,
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
                      background: accent,
                    }}
                  />
                </span>
                <span className="text-[11.5px] font-semibold whitespace-nowrap">{t.name}</span>
              </motion.button>
            )
          })}
      </div>
    </div>
  )
}
