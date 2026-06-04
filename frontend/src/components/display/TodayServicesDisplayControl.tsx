import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, MonitorCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  getTodayServicesDisplaySetting,
  updateTodayServicesDisplaySetting,
} from '../../features/display/display.api'
import { useAuthStore } from '../../stores/auth.store'
import { getApiErrorMessage } from '../../utils/api-error'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

export function TodayServicesDisplayControl() {
  const currentUser = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const canToggle = currentUser?.role === 'admin' || currentUser?.role === 'it_support'
  const settingQuery = useQuery({
    queryKey: ['today-services-display-setting'],
    queryFn: getTodayServicesDisplaySetting,
  })
  const toggleMutation = useMutation({
    mutationFn: updateTodayServicesDisplaySetting,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['today-services-display-setting'],
      })
    },
  })
  const enabled = settingQuery.data?.enabled ?? true

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="rounded-xl bg-brand-50 p-2 text-brand-700">
            <MonitorCheck aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-950">
                Today Services Display
              </h2>
              <Badge variant={enabled ? 'success' : 'warning'}>
                {enabled ? 'ON' : 'OFF'}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Show or hide assigned services on the display screen.
            </p>
            {settingQuery.isError ? (
              <p className="mt-2 text-sm text-red-600">
                {getApiErrorMessage(settingQuery.error, 'Unable to load display setting')}
              </p>
            ) : null}
            {toggleMutation.isError ? (
              <p className="mt-2 text-sm text-red-600">
                {getApiErrorMessage(toggleMutation.error, 'Unable to update display setting')}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            target="_blank"
            to="/display/today-services"
          >
            <ExternalLink aria-hidden="true" className="size-4" />
            Open Display Screen
          </Link>
          {canToggle ? (
            <Button
              disabled={settingQuery.isPending}
              loading={toggleMutation.isPending}
              onClick={() => toggleMutation.mutate(!enabled)}
              variant={enabled ? 'warning' : 'primary'}
            >
              {enabled ? 'Turn OFF' : 'Turn ON'}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  )
}
