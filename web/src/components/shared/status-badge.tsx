import { Badge } from '@/components/ui/badge'
import type { JobStatus } from '@/types'

const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  running: 'default',
  completed: 'secondary',
  stopped: 'outline',
  error: 'destructive',
  killed: 'destructive',
}

const labels: Record<string, string> = {
  running: 'En cours',
  completed: 'Terminé',
  stopped: 'Arrêté',
  error: 'Erreur',
  killed: 'Tué',
}

export function StatusBadge({ status }: { status: JobStatus | string }) {
  return (
    <Badge variant={variants[status] ?? 'outline'}>
      {labels[status] ?? status}
    </Badge>
  )
}
