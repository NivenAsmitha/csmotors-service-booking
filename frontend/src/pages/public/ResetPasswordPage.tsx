import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { AuthCard } from '../../features/auth/AuthCard'
import { FormField } from '../../features/auth/FormField'
import { SubmitButton } from '../../features/auth/SubmitButton'
import { getAuthErrorMessage, resetPassword } from '../../features/auth/auth.api'

const resetPasswordSchema = z
  .object({
    email: z.string().trim().email('Enter a valid email address'),
    otp: z.string().regex(/^\d{6}$/, 'Enter the 6 digit reset code'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const successMessage = (
    location.state as { successMessage?: string } | null
  )?.successMessage
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: searchParams.get('email') ?? '',
    },
  })

  async function onSubmit(values: ResetPasswordFormValues) {
    setSubmitError(null)

    try {
      await resetPassword({
        email: values.email,
        otp: values.otp,
        newPassword: values.newPassword,
      })
      navigate('/login', {
        replace: true,
        state: { successMessage: 'Password reset successfully. You can now log in.' },
      })
    } catch (error: unknown) {
      setSubmitError(getAuthErrorMessage(error, 'Unable to reset password'))
    }
  }

  return (
    <AuthCard
      description="Enter the reset code from your email and choose a new password."
      title="Reset password"
    >
      {successMessage ? (
        <p className="mb-5 rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5 text-sm text-brand-900">
          {successMessage}
        </p>
      ) : null}
      {submitError ? (
        <p className="mb-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {submitError}
        </p>
      ) : null}
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <FormField error={errors.email?.message} label="Email address" type="email" {...register('email')} />
        <FormField error={errors.otp?.message} inputMode="numeric" label="Reset code" maxLength={6} placeholder="123456" {...register('otp')} />
        <FormField autoComplete="new-password" error={errors.newPassword?.message} label="New password" type="password" {...register('newPassword')} />
        <FormField autoComplete="new-password" error={errors.confirmPassword?.message} label="Confirm password" type="password" {...register('confirmPassword')} />
        <SubmitButton isSubmitting={isSubmitting} loadingText="Resetting...">
          Reset Password
        </SubmitButton>
      </form>
    </AuthCard>
  )
}
