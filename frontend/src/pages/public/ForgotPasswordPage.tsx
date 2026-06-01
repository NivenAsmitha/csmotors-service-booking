import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { AuthCard } from '../../features/auth/AuthCard'
import { FormField } from '../../features/auth/FormField'
import { SubmitButton } from '../../features/auth/SubmitButton'
import { forgotPassword, getAuthErrorMessage } from '../../features/auth/auth.api'

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  async function onSubmit(values: ForgotPasswordFormValues) {
    setSubmitError(null)

    try {
      const response = await forgotPassword(values)
      navigate(`/reset-password?email=${encodeURIComponent(values.email)}`, {
        replace: true,
        state: { successMessage: response.message },
      })
    } catch (error: unknown) {
      setSubmitError(getAuthErrorMessage(error, 'Unable to request password reset'))
    }
  }

  return (
    <AuthCard
      description="Enter your account email and we will send a password reset code."
      title="Forgot password"
    >
      {submitError ? (
        <p className="mb-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {submitError}
        </p>
      ) : null}
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <FormField
          autoComplete="email"
          error={errors.email?.message}
          label="Email address"
          type="email"
          {...register('email')}
        />
        <SubmitButton isSubmitting={isSubmitting} loadingText="Sending...">
          Send Reset Code
        </SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Return to{' '}
        <Link className="font-semibold text-brand-700 hover:text-brand-900" to="/login">
          login
        </Link>
      </p>
    </AuthCard>
  )
}
