import type { HTMLAttributes, ReactNode } from 'react'

type BadgeVariant =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'purple'

type BadgeProps = {
  children: ReactNode
  variant?: BadgeVariant
} & HTMLAttributes<HTMLSpanElement>

const variantStyles: Record<BadgeVariant, string> = {
  neutral: 'bg-slate-100 text-slate-700',
  success: 'bg-brand-100 text-brand-900',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-800',
  purple: 'bg-violet-100 text-violet-800',
}

export function Badge({ children, className = '', variant = 'neutral', ...badgeProps }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize',
        variantStyles[variant],
        className,
      ].join(' ')}
      {...badgeProps}
    >
      {children}
    </span>
  )
}
