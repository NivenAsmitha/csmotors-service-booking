import api from '../../api/axios'

export type AuditLog = {
  id: string
  user_id?: string | null
  action: string
  entity: string
  entity_id?: string | null
  metadata?: unknown
  created_at: string
  user?: {
    id: string
    name: string
    email: string
    role: string
  } | null
}

export type AuditLogParams = {
  entity?: string
  action?: string
  user_id?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

export type AuditLogsResponse = {
  data: AuditLog[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export async function getAuditLogs(params?: AuditLogParams) {
  const response = await api.get<AuditLogsResponse>('/audit-logs', { params })
  return response.data
}

export async function getAuditLog(id: string) {
  const response = await api.get<AuditLog>(`/audit-logs/${id}`)
  return response.data
}
