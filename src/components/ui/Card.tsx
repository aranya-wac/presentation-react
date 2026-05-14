import type { HTMLAttributes, ReactNode } from 'react'

interface Props extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
  inset?: boolean
  children: ReactNode
}

export function Card({ interactive, inset, className = '', children, ...rest }: Props) {
  return (
    <div
      className={`bg-white rounded-2xl border border-ink-100 ${inset ? '' : 'shadow-soft'} ${
        interactive
          ? 'transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lift cursor-pointer'
          : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
