interface Props {
  className?: string
  rounded?: string
}

export function Skeleton({ className = '', rounded = 'rounded-xl' }: Props) {
  return <div className={`shimmer ${rounded} ${className}`} />
}
