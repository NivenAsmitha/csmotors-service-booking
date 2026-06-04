import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Pencil, Plus, Wrench } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { BookingStatusBadge } from '../../components/ui/BookingStatusBadge'
import { TodayServicesDisplayControl } from '../../components/display/TodayServicesDisplayControl'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import {
  createAssignment,
  getAssignmentBoard,
  updateAssignment,
  type AssignmentBoardItem,
  type AssignmentPayload,
} from '../../features/assignments/assignments.api'
import { getActiveEmployees, type ActiveEmployee } from '../../features/users/users.api'
import { updateBookingStatus } from '../../features/bookings/bookings.api'
import { useAuthStore } from '../../stores/auth.store'
import type { BookingStatus } from '../../types/booking'
import { getApiErrorMessage } from '../../utils/api-error'
import { formatDate, getLocalDateKey } from '../../utils/dates'
import { formatSlotLabel } from '../../utils/formatSlotLabel'

const assignmentSchema = z.object({
  employee_id: z.string().min(1, 'Select an employee'),
  scheduled_time: z
    .string()
    .refine(
      (value) => !value || /^([01]\d|2[0-3]):[0-5]\d$/.test(value),
      'Use HH:mm format',
    ),
})

type AssignmentFormValues = z.infer<typeof assignmentSchema>
const statusOptions: { label: string; value: BookingStatus }[] = [
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

export function AssignmentBoardPage() {
  const currentUser = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const [date, setDate] = useState(getLocalDateKey())
  const [selectedBooking, setSelectedBooking] =
    useState<AssignmentBoardItem | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [pendingStatus, setPendingStatus] = useState<{
    bookingId: string
    status: BookingStatus
  } | null>(null)
  const isReadOnly = currentUser?.role === 'developer'
  const boardQuery = useQuery({
    queryKey: ['assignment-board', date],
    queryFn: () => getAssignmentBoard(date),
  })
  const usersQuery = useQuery({
    queryKey: ['active-employees'],
    queryFn: getActiveEmployees,
  })
  const employees = usersQuery.data ?? []
  const statusMutation = useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: string; status: BookingStatus }) =>
      updateBookingStatus(bookingId, status),
    onError: () => setPendingStatus(null),
    onSuccess: async () => {
      setPendingStatus(null)
      setSuccessMessage('Service status updated successfully.')
      await queryClient.invalidateQueries({ queryKey: ['assignment-board'] })
    },
  })

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
          Internal operations
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Assignment Board
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Assign service work and scheduled workshop times.
        </p>
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
      {statusMutation.isError ? (
        <ErrorText error={statusMutation.error} fallback="Unable to update service status" />
      ) : null}

      <TodayServicesDisplayControl />

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="block max-w-xs">
          <span className="text-sm font-semibold text-slate-700">Board date</span>
          <span className="relative mt-2 block">
            <CalendarDays
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-3 size-5 text-slate-400"
            />
            <input
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              onChange={(event) => setDate(event.target.value)}
              type="date"
              value={date}
            />
          </span>
        </label>
      </section>

      {boardQuery.isPending ? <LoadingText text="Loading assignment board..." /> : null}
      {boardQuery.isError ? (
        <ErrorText error={boardQuery.error} fallback="Unable to load assignment board" />
      ) : null}
      {usersQuery.isError ? (
        <ErrorText error={usersQuery.error} fallback="Unable to load employees" />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {boardQuery.data?.map((booking) => (
          <article
            className={[
              'min-w-0 rounded-2xl border p-5 shadow-sm',
              booking.assignment
                ? 'border-slate-200 bg-white'
                : 'border-amber-300 bg-amber-50/60 ring-1 ring-amber-100',
            ].join(' ')}
            key={booking.booking_id}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="wrap-break-word font-bold text-slate-900">{booking.client.name}</h2>
                <p className="mt-1 wrap-break-word text-xs text-slate-500">
                  {booking.client.email} | {booking.client.phone || 'No phone'}
                </p>
              </div>
              <BookingStatusBadge status={booking.status} />
            </div>
            <div className="mt-4 grid min-w-0 gap-2 wrap-break-word text-sm text-slate-600 sm:grid-cols-2">
              <p><span className="font-semibold text-slate-800">Service:</span> {booking.service_name}</p>
              <p><span className="font-semibold text-slate-800">Slot:</span> {formatSlotLabel(booking.slot_label)}</p>
              <p><span className="font-semibold text-slate-800">Date:</span> {formatDate(booking.date)}</p>
              <p className="rounded-lg bg-slate-950 px-3 py-2 font-semibold text-white">
                <span className="text-slate-300">Internal time:</span>{' '}
                {booking.start_time && booking.end_time
                  ? `${booking.start_time} - ${booking.end_time}`
                  : 'No fixed time'}
              </p>
              <p><span className="font-semibold text-slate-800">Bike number:</span> {booking.bike_number || 'Not provided'}</p>
              <p><span className="font-semibold text-slate-800">Bike model:</span> {booking.bike_model || 'Not provided'}</p>
            </div>
            {booking.is_extra ? (
              <Badge className="mt-3" variant="info">Extra Slot</Badge>
            ) : null}
            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
              {booking.assignment ? (
                <>
                  <p><span className="font-semibold text-slate-800">Employee:</span> {booking.assignment.employee_name}</p>
                  <p className="mt-1"><span className="font-semibold text-slate-800">Scheduled:</span> {booking.assignment.scheduled_time || 'Not set'}</p>
                </>
              ) : (
                <p className="font-semibold text-amber-800">Unassigned booking. Assign an employee to schedule workshop work.</p>
              )}
            </div>
            <Button
              className="mt-4 w-full sm:w-auto"
              disabled={
                isReadOnly ||
                usersQuery.isPending ||
                (!booking.assignment && booking.status === 'cancelled')
              }
              onClick={() => setSelectedBooking(booking)}
              variant={booking.assignment ? 'secondary' : 'primary'}
            >
              {booking.assignment ? (
                <Pencil aria-hidden="true" className="size-4" />
              ) : (
                <Plus aria-hidden="true" className="size-4" />
              )}
              {booking.assignment
                ? 'Edit Assignment'
                : booking.status === 'cancelled'
                  ? 'Cancelled'
                  : 'Assign'}
            </Button>
            <label className="mt-4 block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Service status
              </span>
              <select
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
                disabled={isReadOnly || statusMutation.isPending}
                onChange={(event) =>
                  setPendingStatus({
                    bookingId: booking.booking_id,
                    status: event.target.value as BookingStatus,
                  })
                }
                value={booking.status}
              >
                {!statusOptions.some((option) => option.value === booking.status) ? (
                  <option disabled value={booking.status}>{booking.status.replace('_', ' ')}</option>
                ) : null}
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </article>
        ))}
      </div>
      {boardQuery.data?.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No bookings found for this date.
        </p>
      ) : null}

      <AssignmentModal
        booking={selectedBooking}
        employees={employees}
        onClose={() => setSelectedBooking(null)}
        onSuccess={async () => {
          setSelectedBooking(null)
          setSuccessMessage('Employee assigned. Today Services Display will update automatically.')
          await queryClient.invalidateQueries({ queryKey: ['assignment-board'] })
        }}
      />
      <ConfirmDialog
        confirmText="Yes, Update Status"
        loading={statusMutation.isPending}
        message={`Are you sure you want to mark this service as ${formatStatus(pendingStatus?.status)}?`}
        onCancel={() => setPendingStatus(null)}
        onConfirm={() => {
          if (pendingStatus) {
            statusMutation.mutate(pendingStatus)
          }
        }}
        open={Boolean(pendingStatus)}
        title="Update Service Status"
        variant="warning"
      />
    </div>
  )
}

type AssignmentModalProps = {
  booking: AssignmentBoardItem | null
  employees: ActiveEmployee[]
  onClose: () => void
  onSuccess: () => Promise<void>
}

function AssignmentModal({
  booking,
  employees,
  onClose,
  onSuccess,
}: AssignmentModalProps) {
  const [pendingValues, setPendingValues] = useState<AssignmentFormValues | null>(null)
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { employee_id: '', scheduled_time: '' },
  })
  const mutation = useMutation({
    mutationFn: (values: AssignmentFormValues) => {
      if (!booking) {
        throw new Error('Booking is required')
      }

      const payload: AssignmentPayload = {
        employee_id: values.employee_id,
        ...(values.scheduled_time
          ? { scheduled_time: values.scheduled_time }
          : {}),
      }

      return booking.assignment
        ? updateAssignment(booking.assignment.id, payload)
        : createAssignment({ booking_id: booking.booking_id, ...payload })
    },
    onError: () => setPendingValues(null),
    onSuccess: async () => {
      setPendingValues(null)
      await onSuccess()
    },
  })

  useEffect(() => {
    reset({
      employee_id: booking?.assignment?.employee_id ?? '',
      scheduled_time: booking?.assignment?.scheduled_time ?? '',
    })
  }, [booking, reset])

  function close() {
    if (!mutation.isPending) {
      setPendingValues(null)
      onClose()
    }
  }

  return (
    <Modal
      isOpen={Boolean(booking)}
      onClose={close}
      title={booking?.assignment ? 'Edit assignment' : 'Assign employee'}
    >
      {mutation.isError ? (
        <ErrorText error={mutation.error} fallback="Unable to save assignment" />
      ) : null}
      <form className="mt-4 space-y-4" onSubmit={handleSubmit(setPendingValues)}>
        <Select
          error={errors.employee_id?.message}
          label="Employee"
          options={[
            { label: 'Select an employee', value: '' },
            ...employees.map((employee) => ({
              label: employee.name || 'Unnamed employee',
              value: employee.id,
            })),
          ]}
          {...register('employee_id')}
        />
        {employees.length === 0 ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            No active employees found. Please create an employee first.
          </p>
        ) : null}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          <p>
            <span className="font-semibold text-slate-800">Bike number:</span>{' '}
            {booking?.bike_number || 'Not provided'}
          </p>
          <p className="mt-1">
            <span className="font-semibold text-slate-800">Bike model:</span>{' '}
            {booking?.bike_model || 'Not provided'}
          </p>
        </div>
        <Input
          error={errors.scheduled_time?.message}
          label="Scheduled time (optional)"
          type="time"
          {...register('scheduled_time')}
        />
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button className="w-full sm:w-auto" disabled={mutation.isPending} onClick={close} variant="secondary">
            Cancel
          </Button>
          <Button className="w-full sm:w-auto" disabled={mutation.isPending} type="submit">
            <Wrench aria-hidden="true" className="size-4" />
            {mutation.isPending ? 'Saving...' : 'Save assignment'}
          </Button>
        </div>
      </form>
      <ConfirmDialog
        cancelText="No"
        confirmText="Yes, Assign"
        loading={mutation.isPending}
        message={`Are you sure you want to assign this booking to ${selectedEmployeeName(employees, pendingValues?.employee_id)}?`}
        onCancel={() => setPendingValues(null)}
        onConfirm={() => {
          if (pendingValues) {
            mutation.mutate(pendingValues)
          }
        }}
        open={Boolean(pendingValues)}
        title="Confirm Assignment"
        variant="default"
      >
        <div className="space-y-1">
          <p><span className="font-semibold">Client:</span> {booking?.client.name ?? '-'}</p>
          <p><span className="font-semibold">Service:</span> {booking?.service_name ?? '-'}</p>
          <p><span className="font-semibold">Date:</span> {booking ? formatDate(booking.date) : '-'}</p>
          <p><span className="font-semibold">Slot:</span> {formatSlotLabel(booking?.slot_label)}</p>
          <p><span className="font-semibold">Bike number:</span> {booking?.bike_number || 'Not provided'}</p>
          <p><span className="font-semibold">Bike model:</span> {booking?.bike_model || 'Not provided'}</p>
          <p><span className="font-semibold">Employee:</span> {selectedEmployeeName(employees, pendingValues?.employee_id)}</p>
        </div>
      </ConfirmDialog>
    </Modal>
  )
}

function selectedEmployeeName(employees: ActiveEmployee[], employeeId?: string) {
  return employees.find((employee) => employee.id === employeeId)?.name ?? 'this employee'
}

function formatStatus(status?: BookingStatus) {
  if (!status) {
    return ''
  }

  return status.replace('_', ' ').replace(/^\w/, (character) => character.toUpperCase())
}

function LoadingText({ text }: { text: string }) {
  return <p className="text-sm text-slate-500">{text}</p>
}

function ErrorText({ error, fallback }: { error: unknown; fallback: string }) {
  return (
    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {getApiErrorMessage(error, fallback)}
    </p>
  )
}
