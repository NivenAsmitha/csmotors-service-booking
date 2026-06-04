import type { ButtonHTMLAttributes } from 'react'
import { LoadingSpinner } from './LoadingSpinner'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'warning' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean
  loadingText?: string
  size?: ButtonSize
  variant?: ButtonVariant
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700',
  secondary:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
  danger: 'border border-red-200 bg-white text-red-700 hover:bg-red-50',
  warning: 'bg-amber-500 text-slate-950 hover:bg-amber-400',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'rounded-lg px-3 py-2 text-xs',
  md: 'rounded-lg px-4 py-2.5 text-sm',
  lg: 'rounded-xl px-5 py-3 text-sm',
}

export function Button({
  children,
  className = '',
  disabled,
  loading = false,
  loadingText,
  size = 'md',
  type = 'button',
  variant = 'primary',
  ...buttonProps
}: ButtonProps) {
  return (
    <button
      aria-busy={loading}
      className={[
        'inline-flex max-w-full items-center justify-center gap-2 whitespace-normal text-center font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60',
        sizeStyles[size],
        variantStyles[variant],
        className,
      ].join(' ')}
      disabled={disabled || loading}
      type={type}
      {...buttonProps}
    >
      {loading ? <LoadingSpinner className="size-4" /> : null}
      {loading && loadingText ? loadingText : children}
    </button>
  )
}
