type SubmitButtonProps = {
  children: string
  isSubmitting: boolean
  loadingText: string
}

export function SubmitButton({
  children,
  isSubmitting,
  loadingText,
}: SubmitButtonProps) {
  return (
    <button
      className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
      disabled={isSubmitting}
      type="submit"
    >
      {isSubmitting ? loadingText : children}
    </button>
  )
}
