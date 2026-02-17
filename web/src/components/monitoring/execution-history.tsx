import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/shared/status-badge'
import { useJobs, useJobHistory } from '@/hooks/use-jobs'

function formatDuration(start: string, end: string | null) {
  if (!end) return 'En cours'
  const ms = new Date(end).getTime() - new Date(start).getTime()
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return `${m}m ${s % 60}s`
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

export function ExecutionHistory() {
  const { data: jobs } = useJobs()
  const [selectedJob, setSelectedJob] = useState<string>('')
  const { data: history } = useJobHistory(selectedJob, 50)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Historique d'exécution</CardTitle>
        <Select value={selectedJob} onValueChange={setSelectedJob}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Choisir un job" /></SelectTrigger>
          <SelectContent>
            {jobs?.map(j => <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {!selectedJob ? (
          <p className="text-sm text-muted-foreground">Sélectionnez un job pour voir son historique.</p>
        ) : !history || history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune exécution enregistrée.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Durée</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Fichiers</TableHead>
                <TableHead>Taille</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map(ex => (
                <TableRow key={ex.id}>
                  <TableCell className="text-sm">
                    {new Date(ex.startedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                  </TableCell>
                  <TableCell className="text-sm">{formatDuration(ex.startedAt, ex.stoppedAt)}</TableCell>
                  <TableCell><StatusBadge status={ex.status} /></TableCell>
                  <TableCell className="text-sm">{ex.filesProduced}</TableCell>
                  <TableCell className="text-sm">{formatBytes(ex.bytesProduced)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
