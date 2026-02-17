import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, CalendarClock, Activity, Clock } from 'lucide-react'
import type { StatusResponse } from '@/types'

function formatUptime(ms: number) {
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (d > 0) return `${d}j ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

const kpis = [
  { key: 'cameras' as const, label: 'Caméras', icon: Camera },
  { key: 'jobs' as const, label: 'Jobs configurés', icon: CalendarClock },
  { key: 'activeProcesses' as const, label: 'Processus actifs', icon: Activity },
] as const

export function KpiCards({ data }: { data: StatusResponse | undefined }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map(k => (
        <Card key={k.key}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{k.label}</CardTitle>
            <k.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.[k.key] ?? '—'}</div>
          </CardContent>
        </Card>
      ))}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Uptime</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data ? formatUptime(data.uptime) : '—'}</div>
        </CardContent>
      </Card>
    </div>
  )
}
