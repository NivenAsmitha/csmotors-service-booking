import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { AuthCard } from '../../features/auth/AuthCard'
import { FormField } from '../../features/auth/FormField'
import { SubmitButton } from '../../features/auth/SubmitButton'
import {
  getAuthErrorMessage,
  resendVerification,
  verifyEmail,
} from '../../features/auth/auth.api'

const verifyEmailSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  otp: z.string().regex(/^\d{6}$/, 'Enter the 6 digit verification code'),
})

type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>

export function VerifyEmailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(
    (location.state as { successMessage?: string } | null)?.successMessage ??
      null,
  )
  const [isResending, setIsResending] = useState(false)
  const {
    formState: { errors, isSubmitting },
    getValues,
    handleSubmit,
    register,
  } = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      email: searchParams.get('email') ?? '',
      otp: '',
    },
  })

  async function onSubmit(values: VerifyEmailFormValues) {
    setSubmitError(null)

    try {
      await verifyEmail(values)
      navigate('/login', {
        replace: true,
        state: { successMessage: 'Email verified successfully. You can now log in.' },
      })
    } catch (error: unknown) {
      setSubmitError(getAuthErrorMessage(error, 'Unable to verify email'))
    }
  }

  async function resend() {
    const email = getValues('email')

    if (!z.string().email().safeParse(email).success) {
      setSubmitError('Enter a valid email address before resending the code.')
      return
    }

    setSubmitError(null)
    setIsResending(true)
    try {
      const response = await resendVerification({ email })
      setStatusMessage(response.message)
    } catch (error: unknown) {
      setSubmitError(getAuthErrorMessage(error, 'Unable to resend code'))
    } finally {
      setIsResending(false)
    }
  }

  return (
    <AuthCard
      description="Enter the 6 digit code sent to your email address."
      title="Verify your email"
    >
      {statusMessage ? (
        <Alert className="mb-5" variant="success">
          {statusMessage}
        </Alert>
      ) : null}
      {submitError ? (
        <Alert className="mb-5" variant="error">
          {submitError}
        </Alert>
      ) : null}
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <FormField
          autoComplete="email"
          error={errors.email?.message}
          label="Email address"
          type="email"
          {...register('email')}
        />
        <FormField
          autoComplete="one-time-code"
          error={errors.otp?.message}
          inputMode="numeric"
          label="Verification code"
          maxLength={6}
          placeholder="123456"
          {...register('otp')}
        />
        <SubmitButton isSubmitting={isSubmitting} loadingText="Verifying...">
          Verify Email
        </SubmitButton>
      </form>
      <Button
        className="mt-4 w-full text-brand-700 hover:text-brand-900"
        loading={isResending}
        loadingText="Sending..."
        onClick={resend}
        variant="ghost"
      >
        Resend Code
      </Button>
      <p className="mt-6 text-center text-sm text-slate-600">
        Already verified?{' '}
        <Link className="font-semibold text-brand-700 hover:text-brand-900" to="/login">
          Log in
        </Link>
      </p>
    </AuthCard>
  )
}
