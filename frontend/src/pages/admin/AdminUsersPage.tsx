import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Search, UserRoundX } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import {
  createUser,
  deactivateUser,
  getUsers,
  updateUser,
} from '../../features/users/users.api'
import { useAuthStore } from '../../stores/auth.store'
import type { InternalUserRole, User } from '../../types/user'
import { getApiErrorMessage } from '../../utils/api-error'

const internalRoles = ['admin', 'employee', 'it_support'] as const
const createUserSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Enter a valid email address'),
  phone: z.string().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(internalRoles),
})
const editUserSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  phone: z.string().trim(),
  is_active: z.boolean(),
  role: z.enum(internalRoles),
})

type CreateUserForm = z.infer<typeof createUserSchema>
type EditUserForm = z.infer<typeof editUserSchema>

const roleOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'Employee', value: 'employee' },
  { label: 'IT Support', value: 'it_support' },
]
const roleFilterOptions = [
  { label: 'All roles', value: 'all' },
  { label: 'Developer', value: 'developer' },
  { label: 'Admin', value: 'admin' },
  { label: 'IT Support', value: 'it_support' },
  { label: 'Employee', value: 'employee' },
  { label: 'Client', value: 'client' },
]
const activeFilterOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
]

export function AdminUsersPage() {
  const currentUser = useAuthStore((state) => state.user)
  const isReadOnly = currentUser?.role === 'developer'
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<User | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })
  const deactivateMutation = useMutation({
    mutationFn: deactivateUser,
    onSuccess: async () => {
      setDeactivateTarget(null)
      setSuccessMessage('User deactivated successfully.')
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
  const users = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return (usersQuery.data ?? []).filter((user) => {
      const matchesSearch =
        !normalizedSearch ||
        user.name.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch)
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      const matchesActive =
        activeFilter === 'all' ||
        (activeFilter === 'active' ? user.is_active : !user.is_active)

      return matchesSearch && matchesRole && matchesActive
    })
  }, [activeFilter, roleFilter, search, usersQuery.data])

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
            Administration
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Users
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Create internal users, update account details, and deactivate access.
          </p>
        </div>
        {!isReadOnly ? (
          <Button className="w-full sm:w-auto" onClick={() => setIsCreateOpen(true)}>
            <Plus aria-hidden="true" className="size-4" />
            Create User
          </Button>
        ) : null}
      </section>

      {isReadOnly ? (
        <p className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-800">
          Developer read-only
        </p>
      ) : null}
      {successMessage ? (
        <p className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-900">
          {successMessage}
        </p>
      ) : null}
      {deactivateMutation.isError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getApiErrorMessage(deactivateMutation.error, 'Unable to deactivate user')}
        </p>
      ) : null}

      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Search</span>
          <span className="relative mt-2 block">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-3 size-5 text-slate-400"
            />
            <input
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name or email"
              value={search}
            />
          </span>
        </label>
        <Select
          label="Role"
          onChange={(event) => setRoleFilter(event.target.value)}
          options={roleFilterOptions}
          value={roleFilter}
        />
        <Select
          label="Status"
          onChange={(event) => setActiveFilter(event.target.value)}
          options={activeFilterOptions}
          value={activeFilter}
        />
      </section>

      {usersQuery.isPending ? (
        <p className="text-sm text-slate-500">Loading users...</p>
      ) : null}
      {usersQuery.isError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getApiErrorMessage(usersQuery.error, 'Unable to load users')}
        </p>
      ) : null}
      {usersQuery.data ? (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[920px] divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Password change</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr className="text-slate-700" key={user.id}>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">
                      {user.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{user.email}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {user.phone || 'Not provided'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge variant={roleBadgeVariant(user.role)}>
                        {formatRole(user.role)}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge variant={user.is_active ? 'success' : 'danger'}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge variant={user.must_change_password ? 'warning' : 'neutral'}>
                        {user.must_change_password ? 'Required' : 'No'}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {isReadOnly ? (
                        <span className="text-xs text-slate-500">Read only</span>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            className="px-3 py-2"
                            onClick={() => setEditTarget(user)}
                            variant="secondary"
                          >
                            <Pencil aria-hidden="true" className="size-3.5" />
                            Edit
                          </Button>
                          {user.is_active ? (
                            <Button
                              className="px-3 py-2"
                              onClick={() => setDeactivateTarget(user)}
                              variant="danger"
                            >
                              <UserRoundX aria-hidden="true" className="size-3.5" />
                              Deactivate
                            </Button>
                          ) : null}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">
              No users found.
            </p>
          ) : null}
        </section>
      ) : null}

      <CreateUserModal
        currentUserRole={currentUser?.role}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          setSuccessMessage('User created successfully.')
          setIsCreateOpen(false)
        }}
      />
      <EditUserModal
        currentUserRole={currentUser?.role}
        onClose={() => setEditTarget(null)}
        onSuccess={() => {
          setSuccessMessage('User updated successfully.')
          setEditTarget(null)
        }}
        user={editTarget}
      />
      <ConfirmDialog
        confirmLabel="Deactivate user"
        description={`Deactivate ${deactivateTarget?.name ?? 'this user'}? They will no longer be able to log in.`}
        isConfirming={deactivateMutation.isPending}
        isOpen={Boolean(deactivateTarget)}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={() => {
          if (deactivateTarget) {
            deactivateMutation.mutate(deactivateTarget.id)
          }
        }}
        title="Deactivate user"
      />
    </div>
  )
}

type CreateUserModalProps = {
  currentUserRole?: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function CreateUserModal({
  currentUserRole,
  isOpen,
  onClose,
  onSuccess,
}: CreateUserModalProps) {
  const queryClient = useQueryClient()
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { phone: '', role: 'employee' },
  })
  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: async () => {
      reset()
      onSuccess()
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
  const options =
    currentUserRole === 'developer'
      ? roleOptions
      : roleOptions.filter((option) => option.value !== 'admin')

  function close() {
    if (!mutation.isPending) {
      reset()
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={close} title="Create internal user">
      {mutation.isError ? (
        <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {getApiErrorMessage(mutation.error, 'Unable to create user')}
        </p>
      ) : null}
      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) =>
          mutation.mutate({
            ...values,
            ...(values.phone ? { phone: values.phone } : {}),
          }),
        )}
      >
        <Input error={errors.name?.message} label="Name" placeholder="Full name" {...register('name')} />
        <Input
          error={errors.email?.message}
          label="Email"
          placeholder="name@example.com"
          type="email"
          {...register('email')}
        />
        <Input
          error={errors.phone?.message}
          label="Phone (optional)"
          placeholder="+94 77 123 4567"
          {...register('phone')}
        />
        <Input
          error={errors.password?.message}
          label="Temporary password"
          placeholder="At least 6 characters"
          type="password"
          {...register('password')}
        />
        <Select
          error={errors.role?.message}
          label="Role"
          options={options}
          {...register('role')}
        />
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button className="w-full sm:w-auto" disabled={mutation.isPending} onClick={close} variant="secondary">
            Cancel
          </Button>
          <Button className="w-full sm:w-auto" disabled={mutation.isPending} type="submit">
            {mutation.isPending ? 'Creating...' : 'Create user'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

type EditUserModalProps = {
  currentUserRole?: string
  onClose: () => void
  onSuccess: () => void
  user: User | null
}

function EditUserModal({
  currentUserRole,
  onClose,
  onSuccess,
  user,
}: EditUserModalProps) {
  const queryClient = useQueryClient()
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: '',
      phone: '',
      is_active: true,
      role: 'employee',
    },
  })
  const mutation = useMutation({
    mutationFn: (values: EditUserForm) => {
      if (!user) {
        throw new Error('User is required')
      }

      return updateUser(user.id, {
        name: values.name,
        phone: values.phone,
        is_active: values.is_active,
        ...(currentUserRole === 'developer' ? { role: values.role } : {}),
      })
    },
    onSuccess: async () => {
      onSuccess()
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        phone: user.phone ?? '',
        is_active: user.is_active,
        role: isInternalRole(user.role) ? user.role : 'employee',
      })
    }
  }, [reset, user])

  function close() {
    if (!mutation.isPending) {
      onClose()
    }
  }

  return (
    <Modal isOpen={Boolean(user)} onClose={close} title="Edit user">
      {mutation.isError ? (
        <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {getApiErrorMessage(mutation.error, 'Unable to update user')}
        </p>
      ) : null}
      <form className="space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <Input error={errors.name?.message} label="Name" placeholder="Full name" {...register('name')} />
        <Input
          error={errors.phone?.message}
          label="Phone (optional)"
          placeholder="+94 77 123 4567"
          {...register('phone')}
        />
        <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-3">
          <input className="size-4 accent-brand-600" type="checkbox" {...register('is_active')} />
          <span className="text-sm font-semibold text-slate-700">Active user</span>
        </label>
        {currentUserRole === 'developer' ? (
          <Select
            error={errors.role?.message}
            label="Role"
            options={roleOptions}
            {...register('role')}
          />
        ) : null}
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button className="w-full sm:w-auto" disabled={mutation.isPending} onClick={close} variant="secondary">
            Cancel
          </Button>
          <Button className="w-full sm:w-auto" disabled={mutation.isPending} type="submit">
            {mutation.isPending ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function isInternalRole(role: User['role']): role is InternalUserRole {
  return role === 'admin' || role === 'employee' || role === 'it_support'
}

function formatRole(role: User['role']) {
  return role.replace('_', ' ')
}

function roleBadgeVariant(role: User['role']) {
  if (role === 'developer') {
    return 'purple' as const
  }

  if (role === 'admin') {
    return 'info' as const
  }

  if (role === 'employee') {
    return 'success' as const
  }

  return 'neutral' as const
}
