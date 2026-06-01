export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="text-center">
        <div className="mx-auto size-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
        <p className="mt-4 text-sm font-semibold text-slate-600">
          Loading CS Motors...
        </p>
      </div>
    </div>
  )
}
