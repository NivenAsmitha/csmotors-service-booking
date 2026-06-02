import { LoadingSpinner } from './LoadingSpinner'

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="text-center">
        <LoadingSpinner className="size-10 border-4 text-brand-600" label="Loading CS Motors" />
        <p className="mt-4 text-sm font-semibold text-slate-600">
          Loading CS Motors...
        </p>
      </div>
    </div>
  )
}
