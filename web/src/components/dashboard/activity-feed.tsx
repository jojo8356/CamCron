import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import { api } from '@/lib/api'
import type { Job, JobExecution } from '@/types'

export function ActivityFeed() {
  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.get<Job[]>('/jobs'),
  })

  // Fetch history for the first 5 jobs that exist
  const jobIds = jobs?.slice(0, 5).map(j => j.id) ?? []

  const { data: executions } = useQuery({
    queryKey: ['recent-executions', jobIds],
    queryFn: async () => {
      const results = await Promise.all(
        jobIds.map(id => api.get<JobExecution[]>(`/jobs/${id}/history?limit=3`))
      )
      return results.flat().sort((a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      ).slice(0, 10)
    },
    enabled: jobIds.length > 0,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Activité récente</CardTitle>
      </CardHeader>
      <CardContent>
        {!executions || executions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune exécution récente.</p>
        ) : (
          <div className="space-y-2">
            {executions.map(ex => (
              <div key={ex.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{ex.jobId.slice(0, 8)}...</span>
                  <span className="ml-2 text-muted-foreground">
                    {new Date(ex.startedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
                <StatusBadge status={ex.status} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
