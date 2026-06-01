import api from '../../api/axios'
import type {
  BookingClient,
  BookingStatus,
} from '../../types/booking'

export type AssignmentPayload = {
  employee_id: string
  vehicle_ref: string
  scheduled_time?: string
}

export type CreateAssignmentPayload = AssignmentPayload & {
  booking_id: string
}

export type AssignmentBoardItem = {
  booking_id: string
  status: BookingStatus
  client: BookingClient
  service_name: string
  slot_label: string
  start_time: string
  end_time: string
  date: string
  assignment: {
    id: string
    employee_id: string
    employee_name: string
    vehicle_ref?: string | null
    scheduled_time?: string | null
  } | null
}

export type EmployeeAssignment = {
  id: string
  booking_id: string
  employee_id: string
  vehicle_ref?: string | null
  scheduled_time?: string | null
  booking: {
    id: string
    status: BookingStatus
    notes?: string | null
    client: BookingClient
    daySlot: {
      date: string
      slot: {
        label: string
        start_time: string
        end_time: string
        service: {
          id: string
          name: string
        }
      }
    }
  }
}

export async function createAssignment(payload: CreateAssignmentPayload) {
  const response = await api.post<EmployeeAssignment>('/assignments', payload)
  return response.data
}

export async function updateAssignment(id: string, payload: AssignmentPayload) {
  const response = await api.patch<EmployeeAssignment>(
    `/assignments/${id}`,
    payload,
  )
  return response.data
}

export async function getAssignmentBoard(date: string) {
  const response = await api.get<AssignmentBoardItem[]>('/assignments/board', {
    params: { date },
  })
  return response.data
}

export async function getMyAssignments(date?: string) {
  const response = await api.get<EmployeeAssignment[]>('/assignments/my', {
    params: date ? { date } : undefined,
  })
  return response.data
}
