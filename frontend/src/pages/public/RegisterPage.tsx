import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { AuthCard } from '../../features/auth/AuthCard'
import { FormField } from '../../features/auth/FormField'
import { SubmitButton } from '../../features/auth/SubmitButton'
import { getAuthErrorMessage, register } from '../../features/auth/auth.api'

const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    email: z.string().trim().email('Enter a valid email address'),
    phone: z.string().trim(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register: registerField,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      phone: '',
    },
  })

  async function onSubmit(values: RegisterFormValues) {
    setSubmitError(null)

    try {
      await register({
        name: values.name,
        email: values.email,
        ...(values.phone ? { phone: values.phone } : {}),
        password: values.password,
      })
      navigate('/login', {
        replace: true,
        state: { successMessage: 'Registration successful. You can now log in.' },
      })
    } catch (error: unknown) {
      setSubmitError(getAuthErrorMessage(error, 'Unable to register'))
    }
  }

  return (
    <AuthCard
      description="Create your customer account to schedule and manage vehicle services."
      title="Create an account"
    >
      {submitError ? (
        <p className="mb-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {submitError}
        </p>
      ) : null}
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <FormField
          autoComplete="name"
          error={errors.name?.message}
          label="Full name"
          placeholder="Your name"
          {...registerField('name')}
        />
        <FormField
          autoComplete="email"
          error={errors.email?.message}
          label="Email address"
          placeholder="you@example.com"
          type="email"
          {...registerField('email')}
        />
        <FormField
          autoComplete="tel"
          error={errors.phone?.message}
          label="Phone number (optional)"
          placeholder="0771234567"
          type="tel"
          {...registerField('phone')}
        />
        <FormField
          autoComplete="new-password"
          error={errors.password?.message}
          label="Password"
          placeholder="At least 6 characters"
          type="password"
          {...registerField('password')}
        />
        <FormField
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          label="Confirm password"
          placeholder="Enter your password again"
          type="password"
          {...registerField('confirmPassword')}
        />
        <div className="pt-2">
          <SubmitButton
            isSubmitting={isSubmitting}
            loadingText="Creating account..."
          >
            Register
          </SubmitButton>
        </div>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Already registered?{' '}
        <Link className="font-semibold text-brand-700 hover:text-brand-900" to="/login">
          Log in
        </Link>
      </p>
    </AuthCard>
  )
}
