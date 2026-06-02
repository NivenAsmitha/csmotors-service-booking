import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { BookingStatusBadge } from '../../components/ui/BookingStatusBadge'
import { Select } from '../../components/ui/Select'
import {
  getBookings,
  updateBookingStatus,
  type BookingFilters,
} from '../../features/bookings/bookings.api'
import { getServices } from '../../features/services/services.api'
import { getUsers } from '../../features/users/users.api'
import { useAuthStore } from '../../stores/auth.store'
import type { BookingStatus } from '../../types/booking'
import { getApiErrorMessage } from '../../utils/api-error'
import { formatDate } from '../../utils/dates'

const statusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

export function AdminBookingsPage() {
  const currentUser = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const isReadOnly = currentUser?.role === 'developer'
  const [date, setDate] = useState('')
  const [status, setStatus] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [search, setSearch] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const filters = useMemo<BookingFilters>(
    () => ({
      ...(date ? { date } : {}),
      ...(status ? { status: status as BookingStatus } : {}),
      ...(serviceId ? { service_id: serviceId } : {}),
    }),
    [date, serviceId, status],
  )
  const bookingsQuery = useQuery({
    queryKey: ['bookings', filters],
    queryFn: () => getBookings(filters),
  })
  const servicesQuery = useQuery({
    queryKey: ['services'],
    queryFn: getServices,
  })
  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })
  const statusMutation = useMutation({
    mutationFn: ({
      bookingId,
      nextStatus,
    }: {
      bookingId: string
      nextStatus: BookingStatus
    }) => updateBookingStatus(bookingId, nextStatus),
    onSuccess: async () => {
      setSuccessMessage('Booking status updated.')
      await queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
  const employeesById = useMemo(
    () => new Map((usersQuery.data ?? []).map((user) => [user.id, user.name])),
    [usersQuery.data],
  )
  const bookings = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return (bookingsQuery.data ?? []).filter(
      (booking) =>
        !normalizedSearch ||
        booking.client.name.toLowerCase().includes(normalizedSearch) ||
        booking.client.email.toLowerCase().includes(normalizedSearch),
    )
  }, [bookingsQuery.data, search])

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
          Administration
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          All Bookings
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Review bookings, assignments, and service progress.
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
        <ErrorText
          error={statusMutation.error}
          fallback="Unable to update booking status"
        />
      ) : null}

      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-4">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Search client</span>
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
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Date</span>
          <input
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            onChange={(event) => setDate(event.target.value)}
            type="date"
            value={date}
          />
        </label>
        <Select
          label="Status"
          onChange={(event) => setStatus(event.target.value)}
          options={[{ label: 'All statuses', value: '' }, ...statusOptions]}
          value={status}
        />
        <Select
          label="Service"
          onChange={(event) => setServiceId(event.target.value)}
          options={[
            { label: 'All services', value: '' },
            ...(servicesQuery.data ?? []).map((service) => ({
              label: service.name,
              value: service.id,
            })),
          ]}
          value={serviceId}
        />
      </section>

      {bookingsQuery.isPending ? <LoadingText text="Loading bookings..." /> : null}
      {bookingsQuery.isError ? (
        <ErrorText error={bookingsQuery.error} fallback="Unable to load bookings" />
      ) : null}
      {bookingsQuery.data ? (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[980px] divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Booking</th>
                  <th className="px-4 py-3 font-semibold">Client</th>
                  <th className="px-4 py-3 font-semibold">Service</th>
                  <th className="px-4 py-3 font-semibold">Schedule</th>
                  <th className="px-4 py-3 font-semibold">Assignment</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((booking) => {
                  const slot = booking.daySlot.slot
                  const assignment = booking.assignment

                  return (
                    <tr className="align-top text-slate-700" key={booking.id}>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">
                        {booking.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{booking.client.name}</p>
                        <p className="mt-1 text-xs">{booking.client.email}</p>
                        <p className="mt-1 text-xs">{booking.client.phone || 'No phone'}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <p className="font-semibold text-slate-900">{slot.service.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{slot.label}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {booking.bike_number || 'No bike number'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {booking.bike_model || 'No bike model'}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <p>{formatDate(booking.daySlot.date)}</p>
                        {slot.start_time && slot.end_time ? (
                          <p className="mt-1 text-xs text-slate-500">
                            {slot.start_time} - {slot.end_time}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        {assignment ? (
                          <>
                            <p>{employeesById.get(assignment.employee_id) ?? 'Assigned employee'}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {assignment.vehicle_ref || 'No bike reference'}
                            </p>
                          </>
                        ) : (
                          <span className="text-xs text-slate-500">Unassigned</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <BookingStatusBadge status={booking.status} />
                      </td>
                      <td className="min-w-44 px-4 py-3">
                        <select
                          aria-label={`Update status for booking ${booking.id}`}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
                          disabled={isReadOnly || statusMutation.isPending}
                          onChange={(event) =>
                            statusMutation.mutate({
                              bookingId: booking.id,
                              nextStatus: event.target.value as BookingStatus,
                            })
                          }
                          value={booking.status}
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {bookings.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">
              No bookings found.
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  )
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
