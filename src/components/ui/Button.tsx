import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'link'
type Size = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

const sizeClass: Record<Size, string> = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'secondary', size = 'md', leadingIcon, trailingIcon, className = '', children, ...rest },
  ref,
) {
  if (variant === 'ghost') {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full text-[13px] font-semibold transition-all duration-200 ease-out hover:bg-black/5 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap ${sizeClass[size]} ${className}`}
        style={{ color: 'var(--ink)' }}
        {...rest}
      >
        {leadingIcon}
        {children}
        {trailingIcon}
      </button>
    )
  }
  if (variant === 'link') {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center gap-1.5 text-[13px] font-semibold underline-offset-4 hover:underline disabled:opacity-40 ${className}`}
        style={{ color: 'var(--ink-strong)' }}
        {...rest}
      >
        {leadingIcon}
        {children}
        {trailingIcon}
      </button>
    )
  }
  const cls = variant === 'primary' ? 'btn-primary' : 'btn-secondary'
  return (
    <button ref={ref} className={`${cls} ${sizeClass[size]} ${className}`} {...rest}>
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  )
})
