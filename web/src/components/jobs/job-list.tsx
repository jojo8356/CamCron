import { useState } from 'react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { JobActions } from './job-actions'
import { useJobs, useDeleteJob, useJob } from '@/hooks/use-jobs'
import { useCameras } from '@/hooks/use-cameras'
import { useStatus } from '@/hooks/use-system'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { Job, ActionType } from '@/types'

const actionLabels: Record<ActionType, string> = {
  record: 'Enregistrement',
  snapshot: 'Capture',
  timelapse: 'Timelapse',
  detect_motion: 'Détection',
  test_connection: 'Test',
  custom_command: 'Commande',
}

interface JobListProps {
  onAdd: () => void
  onEdit: (job: Job) => void
  onDuplicate: (job: Job) => void
}

export function JobList({ onAdd, onEdit, onDuplicate }: JobListProps) {
  const [filterCamera, setFilterCamera] = useState<string>('all')
  const [filterAction, setFilterAction] = useState<string>('all')

  const filters = {
    ...(filterCamera !== 'all' && { cameraId: filterCamera }),
    ...(filterAction !== 'all' && { action: filterAction }),
  }

  const { data: jobs, isLoading } = useJobs(Object.keys(filters).length ? filters : undefined)
  const { data: cameras } = useCameras()
  const { data: status } = useStatus()
  const deleteMut = useDeleteJob()
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null)

  const runningIds = new Set(status?.runningJobs?.map(p => p.jobId) ?? [])

  if (isLoading) return <p className="text-muted-foreground p-4">Chargement...</p>

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Select value={filterCamera} onValueChange={setFilterCamera}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Toutes les caméras" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les caméras</SelectItem>
            {cameras?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Toutes actions" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes actions</SelectItem>
            {Object.entries(actionLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <p className="text-sm text-muted-foreground">{jobs?.length ?? 0} job(s)</p>
        <Button onClick={onAdd}><Plus className="h-4 w-4 mr-1" /> Créer</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Caméra</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Prochain</TableHead>
              <TableHead>Contrôle</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs?.map(job => (
              <JobRow
                key={job.id}
                job={job}
                cameraName={cameras?.find(c => c.id === job.cameraId)?.name}
                running={runningIds.has(job.id)}
                onEdit={onEdit}
                onDuplicate={onDuplicate}
                onDelete={setDeleteTarget}
              />
            ))}
            {jobs?.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Aucun job configuré.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Supprimer le job"
        description={`Êtes-vous sûr de vouloir supprimer « ${deleteTarget?.name} » ?`}
        onConfirm={() => { if (deleteTarget) deleteMut.mutate(deleteTarget.id); setDeleteTarget(null) }}
        destructive
      />
    </>
  )
}

function JobRow({ job, cameraName, running, onEdit, onDuplicate, onDelete }: {
  job: Job; cameraName?: string; running: boolean
  onEdit: (j: Job) => void; onDuplicate: (j: Job) => void; onDelete: (j: Job) => void
}) {
  // Fetch runtime info for next occurrence
  const { data: detail } = useJob(job.id)

  return (
    <TableRow>
      <TableCell className="font-medium">{job.name}</TableCell>
      <TableCell className="text-muted-foreground">{cameraName ?? job.cameraId.slice(0, 8)}</TableCell>
      <TableCell><Badge variant="outline">{actionLabels[job.action] ?? job.action}</Badge></TableCell>
      <TableCell className="text-xs">{job.triggerType}</TableCell>
      <TableCell>
        <Badge variant={running ? 'default' : job.enabled ? 'secondary' : 'outline'}>
          {running ? 'Actif' : job.enabled ? 'Planifié' : 'Désactivé'}
        </Badge>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {detail?.nextOccurrence
          ? new Date(detail.nextOccurrence).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
          : '—'}
      </TableCell>
      <TableCell>
        <JobActions job={job} running={running} onDuplicate={onDuplicate} />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(job)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(job)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
