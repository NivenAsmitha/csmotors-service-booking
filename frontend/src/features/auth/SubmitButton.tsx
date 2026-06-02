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
    <Button
      className="w-full"
      loading={isSubmitting}
      loadingText={loadingText}
      size="lg"
      type="submit"
    >
      {children}
    </Button>
  )
}
import { Button } from '../../components/ui/Button'
