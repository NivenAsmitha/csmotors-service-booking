import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react'
import type { HTMLAttributes, ReactNode } from 'react'

type AlertVariant = 'success' | 'error' | 'warning' | 'info'

type AlertProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  title?: string
  variant?: AlertVariant
}

const variantStyles: Record<AlertVariant, string> = {
  success: 'border-brand-100 bg-brand-50 text-brand-900',
  error: 'border-red-200 bg-red-50 text-red-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
}

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: TriangleAlert,
  info: Info,
}

export function Alert({
  children,
  className = '',
  title,
  variant = 'info',
  ...alertProps
}: AlertProps) {
  const Icon = icons[variant]

  return (
    <div
      className={['flex gap-3 rounded-xl border px-4 py-3 text-sm', variantStyles[variant], className].join(' ')}
      role={variant === 'error' ? 'alert' : 'status'}
      {...alertProps}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 break-words">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className={title ? 'mt-1' : ''}>{children}</div>
      </div>
    </div>
  )
}
