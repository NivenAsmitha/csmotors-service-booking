import type { ComponentProps } from 'react'

type InputProps = ComponentProps<'input'> & {
  error?: string
  label: string
}

export function Input({ error, id, label, name, ...inputProps }: InputProps) {
  const inputId = id ?? name

  return (
    <label className="block" htmlFor={inputId}>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        aria-invalid={Boolean(error)}
        className={[
          'mt-2 w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400',
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100'
            : 'border-slate-300 focus:border-brand-600 focus:ring-4 focus:ring-brand-100',
        ].join(' ')}
        id={inputId}
        name={name}
        {...inputProps}
      />
      {error ? (
        <span className="mt-1.5 block text-xs text-red-600">{error}</span>
      ) : null}
    </label>
  )
}
