import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useStatus } from '@/hooks/use-system'
import { useStopJob } from '@/hooks/use-jobs'
import { Square } from 'lucide-react'

function formatUptime(ms: number | null) {
  if (ms == null) return '—'
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h ${m}m ${s % 60}s`
  return `${m}m ${s % 60}s`
}

interface ProcessListProps {
  onSelectJob: (jobId: string) => void
  selectedJobId: string | null
}

export function ProcessList({ onSelectJob, selectedJobId }: ProcessListProps) {
  const { data: status } = useStatus()
  const stop = useStopJob()
  const processes = status?.runningJobs ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Processus actifs ({processes.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {processes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun processus en cours.</p>
        ) : (
          <div className="space-y-2">
            {processes.map(p => (
              <div
                key={p.jobId}
                className={`flex items-center justify-between rounded-md border p-3 cursor-pointer transition-colors ${
                  selectedJobId === p.jobId ? 'border-primary bg-accent' : 'hover:bg-muted'
                }`}
                onClick={() => onSelectJob(p.jobId)}
              >
                <div className="space-y-0.5">
                  <div className="font-medium text-sm">{p.jobId.slice(0, 8)}...</div>
                  <div className="text-xs text-muted-foreground">
                    PID {p.pid} &middot; Uptime {formatUptime(p.uptime)} &middot; Retries {p.retries}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">Actif</Badge>
                  <Button
                    variant="ghost" size="icon"
                    onClick={e => { e.stopPropagation(); stop.mutate(p.jobId) }}
                    title="Arrêter"
                  >
                    <Square className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
