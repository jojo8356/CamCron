import { Button } from '@/components/ui/button'
import { useStartJob, useStopJob } from '@/hooks/use-jobs'
import { Play, Square, Copy, Loader2 } from 'lucide-react'
import type { Job } from '@/types'

interface JobActionsProps {
  job: Job
  running: boolean
  onDuplicate: (job: Job) => void
}

export function JobActions({ job, running, onDuplicate }: JobActionsProps) {
  const start = useStartJob()
  const stop = useStopJob()
  const loading = start.isPending || stop.isPending

  return (
    <div className="flex gap-1">
      {running ? (
        <Button variant="ghost" size="icon" onClick={() => stop.mutate(job.id)} disabled={loading} title="Arrêter">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4 text-destructive" />}
        </Button>
      ) : (
        <Button variant="ghost" size="icon" onClick={() => start.mutate(job.id)} disabled={loading} title="Démarrer">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 text-green-600" />}
        </Button>
      )}
      <Button variant="ghost" size="icon" onClick={() => onDuplicate(job)} title="Dupliquer">
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  )
}
