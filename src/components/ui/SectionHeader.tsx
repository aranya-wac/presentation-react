import type { ReactNode } from 'react'

interface Props {
  eyebrow?: string
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function SectionHeader({ eyebrow, title, subtitle, action, size = 'md' }: Props) {
  const titleSize =
    size === 'xl' ? 'text-[40px] md:text-[56px]' :
    size === 'lg' ? 'text-[32px] md:text-[44px]' :
    size === 'sm' ? 'text-[20px]' :
    'text-[26px] md:text-[34px]'

  return (
    <div className="flex items-end justify-between gap-8 mb-8">
      <div className="min-w-0 max-w-3xl">
        {eyebrow && (
          <p className="font-mono-eyebrow text-ink-400 mb-3">{eyebrow}</p>
        )}
        <h2 className={`font-serif font-medium text-ink-900 leading-[0.98] tracking-tightest ${titleSize}`}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-[14px] text-ink-500 mt-4 max-w-xl leading-relaxed">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0 pb-1">{action}</div>}
    </div>
  )
}
