import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { AuthCard } from '../../features/auth/AuthCard'
import { FormField } from '../../features/auth/FormField'
import { SubmitButton } from '../../features/auth/SubmitButton'
import {
  changePassword,
  getAuthErrorMessage,
} from '../../features/auth/auth.api'
import { useAuthStore } from '../../stores/auth.store'
import { getDashboardPath } from '../../utils/routes'

const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const updateUser = useAuthStore((state) => state.updateUser)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  })

  async function onSubmit(values: ChangePasswordFormValues) {
    setSubmitError(null)

    try {
      const response = await changePassword({
        old_password: values.oldPassword,
        new_password: values.newPassword,
      })
      updateUser(response.user)
      navigate(getDashboardPath(response.user.role), { replace: true })
    } catch (error: unknown) {
      setSubmitError(getAuthErrorMessage(error, 'Unable to change password'))
    }
  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <AuthCard
        description={
          user?.must_change_password
            ? 'Set a new password before continuing to your dashboard.'
            : 'Update the password for your CS Motors account.'
        }
        title="Change password"
      >
        {submitError ? (
          <p className="mb-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {submitError}
          </p>
        ) : null}
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <FormField
            autoComplete="current-password"
            error={errors.oldPassword?.message}
            label="Current password"
            placeholder="Enter your current password"
            type="password"
            {...register('oldPassword')}
          />
          <FormField
            autoComplete="new-password"
            error={errors.newPassword?.message}
            label="New password"
            placeholder="At least 6 characters"
            type="password"
            {...register('newPassword')}
          />
          <FormField
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            label="Confirm new password"
            placeholder="Enter your new password again"
            type="password"
            {...register('confirmPassword')}
          />
          <div className="pt-2">
            <SubmitButton
              isSubmitting={isSubmitting}
              loadingText="Updating password..."
            >
              Change password
            </SubmitButton>
          </div>
        </form>
        <button
          className="mt-5 w-full text-sm font-semibold text-slate-500 transition hover:text-slate-800"
          onClick={handleLogout}
          type="button"
        >
          Log out
        </button>
      </AuthCard>
    </div>
  )
}
