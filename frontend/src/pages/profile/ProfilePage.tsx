import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Input } from '../../components/ui/Input'
import {
  changeMyPassword,
  getMyProfile,
  updateMyProfile,
} from '../../features/users/users.api'
import { useAuthStore } from '../../stores/auth.store'
import { getApiErrorMessage } from '../../utils/api-error'

const profileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Enter a valid email address'),
  phone: z.string().trim().max(30, 'Phone must be 30 characters or fewer'),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

export function ProfilePage() {
  const updateStoredUser = useAuthStore((state) => state.updateUser)
  const [pendingProfile, setPendingProfile] = useState<ProfileForm | null>(null)
  const [pendingPassword, setPendingPassword] = useState<PasswordForm | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const profileQuery = useQuery({
    queryKey: ['my-profile'],
    queryFn: getMyProfile,
  })
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  })
  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })
  const profileMutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (response) => {
      setPendingProfile(null)
      setSuccessMessage(response.message)
      updateStoredUser(response.user)
      profileForm.reset({
        name: response.user.name,
        email: response.user.email,
        phone: response.user.phone ?? '',
      })
    },
  })
  const passwordMutation = useMutation({
    mutationFn: changeMyPassword,
    onSuccess: (response) => {
      setPendingPassword(null)
      setSuccessMessage('Password changed successfully.')
      updateStoredUser(response.user)
      passwordForm.reset()
    },
  })

  useEffect(() => {
    if (profileQuery.data) {
      profileForm.reset({
        name: profileQuery.data.name,
        email: profileQuery.data.email,
        phone: profileQuery.data.phone ?? '',
      })
    }
  }, [profileForm, profileQuery.data])

  const user = profileQuery.data

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
          Account
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          My Profile
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Update your contact details and manage your password.
        </p>
      </section>

      {successMessage ? <Alert variant="success">{successMessage}</Alert> : null}
      {profileQuery.isError ? (
        <Alert variant="error">
          {getApiErrorMessage(profileQuery.error, 'Unable to load profile')}
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <Card padding="lg">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">My Details</h2>
              <p className="mt-1 text-sm text-slate-600">
                Email changes require a fresh verification code.
              </p>
            </div>
            {user ? (
              <div className="flex flex-wrap gap-2">
                <Badge variant="info">{user.role.replace('_', ' ')}</Badge>
                <Badge variant={user.email_verified ? 'success' : 'warning'}>
                  {user.email_verified ? 'Email verified' : 'Email unverified'}
                </Badge>
              </div>
            ) : null}
          </div>

          {profileMutation.isError ? (
            <Alert className="mt-4" variant="error">
              {getApiErrorMessage(profileMutation.error, 'Unable to update profile')}
            </Alert>
          ) : null}

          {profileQuery.isPending ? (
            <p className="mt-6 text-sm text-slate-500">Loading profile...</p>
          ) : (
            <form
              className="mt-6 space-y-4"
              onSubmit={profileForm.handleSubmit(setPendingProfile)}
            >
              <Input
                error={profileForm.formState.errors.name?.message}
                label="Name"
                placeholder="Your full name"
                {...profileForm.register('name')}
              />
              <Input
                error={profileForm.formState.errors.email?.message}
                label="Email"
                placeholder="name@example.com"
                type="email"
                {...profileForm.register('email')}
              />
              <Input
                error={profileForm.formState.errors.phone?.message}
                label="Phone"
                placeholder="+94 77 123 4567"
                {...profileForm.register('phone')}
              />
              <Input
                disabled
                label="Role"
                value={user?.role.replace('_', ' ') ?? ''}
              />
              <Button
                className="w-full sm:w-auto"
                disabled={profileMutation.isPending}
                type="submit"
              >
                Review profile update
              </Button>
            </form>
          )}
        </Card>

        <Card padding="lg">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-brand-50 p-2 text-brand-700">
              <ShieldCheck aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-950">Change Password</h2>
              <p className="mt-1 text-sm text-slate-600">
                Use a strong password with at least 8 characters.
              </p>
            </div>
          </div>

          {passwordMutation.isError ? (
            <Alert className="mt-4" variant="error">
              {getApiErrorMessage(passwordMutation.error, 'Unable to change password')}
            </Alert>
          ) : null}

          <form
            className="mt-6 space-y-4"
            onSubmit={passwordForm.handleSubmit(setPendingPassword)}
          >
            <Input
              error={passwordForm.formState.errors.currentPassword?.message}
              label="Current password"
              placeholder="Enter current password"
              type="password"
              {...passwordForm.register('currentPassword')}
            />
            <Input
              error={passwordForm.formState.errors.newPassword?.message}
              label="New password"
              placeholder="At least 8 characters"
              type="password"
              {...passwordForm.register('newPassword')}
            />
            <Input
              error={passwordForm.formState.errors.confirmPassword?.message}
              label="Confirm new password"
              placeholder="Repeat new password"
              type="password"
              {...passwordForm.register('confirmPassword')}
            />
            <Button
              className="w-full sm:w-auto"
              disabled={passwordMutation.isPending}
              type="submit"
              variant="warning"
            >
              Review password change
            </Button>
          </form>
        </Card>
      </div>

      <ConfirmDialog
        cancelText="No"
        confirmText="Yes, Save changes"
        loading={profileMutation.isPending}
        message="Update your profile details?"
        onCancel={() => setPendingProfile(null)}
        onConfirm={() => {
          if (pendingProfile) {
            profileMutation.mutate(pendingProfile)
          }
        }}
        open={Boolean(pendingProfile)}
        title="Confirm profile update"
        variant="default"
      />
      <ConfirmDialog
        cancelText="No"
        confirmText="Yes, Change password"
        loading={passwordMutation.isPending}
        message="Change your account password?"
        onCancel={() => setPendingPassword(null)}
        onConfirm={() => {
          if (pendingPassword) {
            passwordMutation.mutate({
              old_password: pendingPassword.currentPassword,
              new_password: pendingPassword.newPassword,
            })
          }
        }}
        open={Boolean(pendingPassword)}
        title="Confirm password change"
        variant="warning"
      />
    </div>
  )
}
