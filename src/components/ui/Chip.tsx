import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  leadingIcon?: ReactNode
  children: ReactNode
}

export function Chip({ active = false, leadingIcon, className = '', children, ...rest }: Props) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-[12.5px] font-medium transition-all duration-200 ease-out ${className}`}
      style={
        active
          ? { background: 'var(--ink-strong)', color: '#fff' }
          : { background: 'transparent', color: 'var(--ink-soft)' }
      }
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(10,9,7,0.05)'
          e.currentTarget.style.color = 'var(--ink-strong)'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--ink-soft)'
        }
      }}
      {...rest}
    >
      {leadingIcon}
      {children}
    </button>
  )
}
