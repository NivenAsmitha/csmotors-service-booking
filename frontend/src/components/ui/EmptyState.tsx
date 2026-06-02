import type { ReactNode } from 'react'

type EmptyStateProps = {
  action?: ReactNode
  description?: string
  icon?: ReactNode
  title: string
}

export function EmptyState({ action, description, icon, title }: EmptyStateProps) {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
      {icon ? <div className="mx-auto mb-3 flex justify-center text-slate-400">{icon}</div> : null}
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {description ? <p className="mx-auto mt-1 max-w-lg text-sm leading-6 text-slate-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </section>
  )
}
