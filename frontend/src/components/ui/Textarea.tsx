import type { ComponentProps } from 'react'

type TextareaProps = ComponentProps<'textarea'> & {
  error?: string
  helperText?: string
  label: string
  wrapperClassName?: string
}

export function Textarea({
  className = '',
  error,
  helperText,
  id,
  label,
  name,
  wrapperClassName = '',
  ...textareaProps
}: TextareaProps) {
  const textareaId = id ?? name

  return (
    <label className={['block', wrapperClassName].join(' ')} htmlFor={textareaId}>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <textarea
        aria-invalid={Boolean(error)}
        className={[
          'mt-2 min-h-28 min-w-0 w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400',
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100'
            : 'border-slate-300 focus:border-brand-600 focus:ring-4 focus:ring-brand-100',
          className,
        ].join(' ')}
        id={textareaId}
        name={name}
        {...textareaProps}
      />
      {error ? (
        <span className="mt-1.5 block text-xs text-red-600">{error}</span>
      ) : helperText ? (
        <span className="mt-1.5 block text-xs text-slate-500">{helperText}</span>
      ) : null}
    </label>
  )
}
