import type { ComponentProps } from 'react'

type SelectOption = {
  label: string
  value: string
}

type SelectProps = ComponentProps<'select'> & {
  error?: string
  helperText?: string
  label: string
  options: SelectOption[]
  wrapperClassName?: string
}

export function Select({
  className = '',
  error,
  helperText,
  id,
  label,
  name,
  options,
  wrapperClassName = '',
  ...selectProps
}: SelectProps) {
  const selectId = id ?? name

  return (
    <label className={['block', wrapperClassName].join(' ')} htmlFor={selectId}>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <select
        aria-invalid={Boolean(error)}
        className={[
          'mt-2 min-w-0 w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition',
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100'
            : 'border-slate-300 focus:border-brand-600 focus:ring-4 focus:ring-brand-100',
          className,
        ].join(' ')}
        id={selectId}
        name={name}
        {...selectProps}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <span className="mt-1.5 block text-xs text-red-600">{error}</span>
      ) : helperText ? (
        <span className="mt-1.5 block text-xs text-slate-500">{helperText}</span>
      ) : null}
    </label>
  )
}
