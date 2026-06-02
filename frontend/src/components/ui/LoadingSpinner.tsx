import type { HTMLAttributes } from 'react'

type LoadingSpinnerProps = HTMLAttributes<HTMLSpanElement> & {
  label?: string
}

export function LoadingSpinner({
  className = 'size-5',
  label = 'Loading',
  ...spinnerProps
}: LoadingSpinnerProps) {
  return (
    <span
      aria-label={label}
      className={[
        'inline-block animate-spin rounded-full border-2 border-current border-r-transparent',
        className,
      ].join(' ')}
      role="status"
      {...spinnerProps}
    />
  )
}
