import type { HTMLAttributes } from 'react'

type CardVariant = 'default' | 'muted' | 'outlined'
type CardPadding = 'none' | 'sm' | 'md' | 'lg'

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: 'article' | 'div' | 'section'
  padding?: CardPadding
  variant?: CardVariant
}

const variantStyles: Record<CardVariant, string> = {
  default: 'border-slate-200 bg-white shadow-sm',
  muted: 'border-slate-200 bg-slate-50',
  outlined: 'border-slate-200 bg-white',
}

const paddingStyles: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-5 sm:p-6',
}

export function Card({
  as: Component = 'section',
  children,
  className = '',
  padding = 'md',
  variant = 'default',
  ...cardProps
}: CardProps) {
  return (
    <Component
      className={[
        'min-w-0 rounded-2xl border',
        variantStyles[variant],
        paddingStyles[padding],
        className,
      ].join(' ')}
      {...cardProps}
    >
      {children}
    </Component>
  )
}
