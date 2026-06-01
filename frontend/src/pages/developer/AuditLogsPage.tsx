import { useQuery } from '@tanstack/react-query'
import { Eye, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import {
  getAuditLog,
  getAuditLogs,
  type AuditLogParams,
} from '../../features/audit/audit.api'
import { getApiErrorMessage } from '../../utils/api-error'

const limitOptions = [10, 20, 50, 100].map((limit) => ({
  label: `${limit} per page`,
  value: String(limit),
}))

export function AuditLogsPage() {
  const [entity, setEntity] = useState('')
  const [action, setAction] = useState('')
  const [userId, setUserId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [limit, setLimit] = useState(20)
  const [page, setPage] = useState(1)
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null)
  const params = useMemo<AuditLogParams>(
    () => ({
      ...(entity.trim() ? { entity: entity.trim() } : {}),
      ...(action.trim() ? { action: action.trim() } : {}),
      ...(userId.trim() ? { user_id: userId.trim() } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      page,
      limit,
    }),
    [action, entity, from, limit, page, to, userId],
  )
  const logsQuery = useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => getAuditLogs(params),
  })
  const detailQuery = useQuery({
    queryKey: ['audit-log', selectedLogId],
    queryFn: () => getAuditLog(selectedLogId!),
    enabled: Boolean(selectedLogId),
  })
  const response = logsQuery.data

  function updateFilter(callback: () => void) {
    callback()
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
          Developer access
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Audit Logs
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Inspect read-only records of business operations and account changes.
        </p>
      </section>

      <p className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-800">
        Developer read-only. Sensitive metadata is removed by the backend before
        audit records are stored.
      </p>

      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-3">
        <TextFilter
          label="Entity"
          onChange={(value) => updateFilter(() => setEntity(value))}
          placeholder="booking"
          value={entity}
        />
        <TextFilter
          label="Action"
          onChange={(value) => updateFilter(() => setAction(value))}
          placeholder="BOOKING_CREATED"
          value={action}
        />
        <TextFilter
          label="User ID"
          onChange={(value) => updateFilter(() => setUserId(value))}
          placeholder="User UUID"
          value={userId}
        />
        <DateFilter
          label="From"
          onChange={(value) => updateFilter(() => setFrom(value))}
          value={from}
        />
        <DateFilter
          label="To"
          onChange={(value) => updateFilter(() => setTo(value))}
          value={to}
        />
        <Select
          label="Page size"
          onChange={(event) =>
            updateFilter(() => setLimit(Number(event.target.value)))
          }
          options={limitOptions}
          value={String(limit)}
        />
      </section>

      {logsQuery.isPending ? (
        <p className="text-sm text-slate-500">Loading audit logs...</p>
      ) : null}
      {logsQuery.isError ? (
        <ErrorText error={logsQuery.error} fallback="Unable to load audit logs" />
      ) : null}
      {response ? (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Entity</th>
                  <th className="px-4 py-3 font-semibold">Entity ID</th>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Metadata</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {response.data.map((log) => (
                  <tr className="align-top text-slate-700" key={log.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-xs">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge variant="info">{log.action}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge>{log.entity}</Badge>
                    </td>
                    <td className="max-w-40 truncate px-4 py-3 font-mono text-xs">
                      {log.entity_id ?? 'None'}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">
                        {log.user?.name ?? 'System'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {log.user?.email ?? 'No user'}
                      </p>
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-slate-500">
                      {metadataPreview(log.metadata)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Button
                        className="px-3 py-2"
                        onClick={() => setSelectedLogId(log.id)}
                        variant="secondary"
                      >
                        <Eye aria-hidden="true" className="size-4" />
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {response.data.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">
              No audit logs match the selected filters.
            </p>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
            <p className="text-xs text-slate-500">
              Page {response.page} of {Math.max(response.total_pages, 1)} |{' '}
              {response.total} total logs
            </p>
            <div className="flex gap-2">
              <Button
                className="px-3 py-2"
                disabled={response.page <= 1}
                onClick={() => setPage((currentPage) => currentPage - 1)}
                variant="secondary"
              >
                Previous
              </Button>
              <Button
                className="px-3 py-2"
                disabled={response.page >= response.total_pages}
                onClick={() => setPage((currentPage) => currentPage + 1)}
                variant="secondary"
              >
                Next
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <AuditLogModal
        error={detailQuery.error}
        isError={detailQuery.isError}
        isLoading={detailQuery.isPending}
        log={detailQuery.data}
        onClose={() => setSelectedLogId(null)}
        open={Boolean(selectedLogId)}
      />
    </div>
  )
}

type AuditLogModalProps = {
  error: unknown
  isError: boolean
  isLoading: boolean
  log?: Awaited<ReturnType<typeof getAuditLog>>
  onClose: () => void
  open: boolean
}

function AuditLogModal({
  error,
  isError,
  isLoading,
  log,
  onClose,
  open,
}: AuditLogModalProps) {
  return (
    <Modal isOpen={open} onClose={onClose} title="Audit log details" width="lg">
      {isLoading ? <p className="text-sm text-slate-500">Loading details...</p> : null}
      {isError ? <ErrorText error={error} fallback="Unable to load audit log" /> : null}
      {log ? (
        <dl className="space-y-4 text-sm">
          <Detail label="ID" value={log.id} />
          <Detail label="Created" value={formatDateTime(log.created_at)} />
          <Detail
            label="User"
            value={
              log.user
                ? `${log.user.name} (${log.user.email}) - ${log.user.role}`
                : 'System'
            }
          />
          <div className="flex flex-wrap gap-2">
            <Badge variant="info">{log.action}</Badge>
            <Badge>{log.entity}</Badge>
          </div>
          <Detail label="Entity ID" value={log.entity_id ?? 'None'} />
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Metadata
            </dt>
            <dd>
              <pre className="mt-2 max-h-80 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                {formatMetadata(log.metadata)}
              </pre>
            </dd>
          </div>
        </dl>
      ) : null}
    </Modal>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-all text-slate-800">{value}</dd>
    </div>
  )
}

function TextFilter({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string
  onChange: (value: string) => void
  placeholder: string
  value: string
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <span className="relative mt-2 block">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-3 size-5 text-slate-400"
        />
        <input
          className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          value={value}
        />
      </span>
    </label>
  )
}

function DateFilter({
  label,
  onChange,
  value,
}: {
  label: string
  onChange: (value: string) => void
  value: string
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
        onChange={(event) => onChange(event.target.value)}
        type="date"
        value={value}
      />
    </label>
  )
}

function ErrorText({ error, fallback }: { error: unknown; fallback: string }) {
  return (
    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {getApiErrorMessage(error, fallback)}
    </p>
  )
}

function metadataPreview(metadata: unknown) {
  const formattedMetadata = JSON.stringify(sanitizeMetadata(metadata ?? {}))
  return formattedMetadata.length > 100
    ? `${formattedMetadata.slice(0, 100)}...`
    : formattedMetadata
}

function formatMetadata(metadata: unknown) {
  return JSON.stringify(sanitizeMetadata(metadata ?? {}), null, 2)
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString()
}

function sanitizeMetadata(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeMetadata)
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !isSensitiveKey(key))
        .map(([key, nestedValue]) => [key, sanitizeMetadata(nestedValue)]),
    )
  }

  return value
}

function isSensitiveKey(key: string) {
  const normalizedKey = key.toLowerCase()
  const sensitiveKeys = [
    'password',
    'password_hash',
    'token',
    'secret',
    'authorization',
  ]

  return sensitiveKeys.some((sensitiveKey) => normalizedKey.includes(sensitiveKey))
}
