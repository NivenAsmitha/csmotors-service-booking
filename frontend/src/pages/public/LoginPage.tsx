import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Alert } from '../../components/ui/Alert'
import { AuthCard } from '../../features/auth/AuthCard'
import { FormField } from '../../features/auth/FormField'
import { SubmitButton } from '../../features/auth/SubmitButton'
import { getAuthErrorMessage, login } from '../../features/auth/auth.api'
import { useAuthStore } from '../../stores/auth.store'
import { getDashboardPath } from '../../utils/routes'

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const saveLogin = useAuthStore((state) => state.login)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const successMessage = (
    location.state as { successMessage?: string } | null
  )?.successMessage
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(values: LoginFormValues) {
    setSubmitError(null)

    try {
      const response = await login(values)
      saveLogin(response.user, response.access_token)
      navigate(
        response.user.must_change_password
          ? '/change-password'
          : getDashboardPath(response.user.role),
        { replace: true },
      )
    } catch (error: unknown) {
      setSubmittedEmail(values.email)
      setSubmitError(getAuthErrorMessage(error, 'Unable to log in'))
    }
  }

  return (
    <AuthCard
      description="Sign in to manage your CS Motors service bookings."
      title="Welcome back"
    >
      {successMessage ? (
        <Alert className="mb-5" variant="success">
          {successMessage}
        </Alert>
      ) : null}
      {submitError ? (
        <Alert className="mb-5" variant="error">
          <p>{submitError}</p>
          {submitError.toLowerCase().includes('verify your email') ? (
            <Link
              className="mt-2 inline-flex font-semibold text-red-800 underline"
              to={`/verify-email?email=${encodeURIComponent(submittedEmail)}`}
            >
              Verify your email
            </Link>
          ) : null}
        </Alert>
      ) : null}
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <FormField
          autoComplete="email"
          error={errors.email?.message}
          label="Email address"
          placeholder="you@example.com"
          type="email"
          {...register('email')}
        />
        <FormField
          autoComplete="current-password"
          error={errors.password?.message}
          label="Password"
          placeholder="Enter your password"
          type="password"
          {...register('password')}
        />
        <div className="text-right">
          <Link
            className="text-sm font-semibold text-brand-700 hover:text-brand-900"
            to="/forgot-password"
          >
            Forgot password?
          </Link>
        </div>
        <div className="pt-2">
          <SubmitButton isSubmitting={isSubmitting} loadingText="Signing in...">
            Log in
          </SubmitButton>
        </div>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        New customer?{' '}
        <Link className="font-semibold text-brand-700 hover:text-brand-900" to="/register">
          Create an account
        </Link>
      </p>
    </AuthCard>
  )
}
