import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ProcessStatus } from '@/types'

function formatUptime(ms: number | null) {
  if (ms == null) return '—'
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m ${s % 60}s`
}

export function ActiveProcesses({ processes }: { processes: ProcessStatus[] }) {
  if (processes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Processus actifs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Aucun processus en cours.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Processus actifs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {processes.map(p => (
            <div key={p.jobId} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <span className="font-medium text-sm">{p.jobId.slice(0, 8)}...</span>
                <span className="ml-2 text-xs text-muted-foreground">PID {p.pid}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{formatUptime(p.uptime)}</span>
                <Badge variant={p.running ? 'default' : 'destructive'}>
                  {p.running ? 'Actif' : 'Arrêté'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
