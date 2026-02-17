import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { CameraTestBtn } from './camera-test-btn'
import { StatusBadge } from '@/components/shared/status-badge'
import { useJobs } from '@/hooks/use-jobs'
import type { Camera } from '@/types'
import { Link } from 'react-router-dom'

export function CameraDetail({ camera }: { camera: Camera }) {
  const { data: jobs } = useJobs({ cameraId: camera.id })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{camera.name}</CardTitle>
          <Badge variant={camera.enabled ? 'default' : 'secondary'}>
            {camera.enabled ? 'Activée' : 'Désactivée'}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <span className="text-muted-foreground">Protocole : </span>
              <span className="uppercase font-medium">{camera.protocol}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Emplacement : </span>
              <span>{camera.location ?? '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Modèle : </span>
              <span>{camera.model ?? '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Tags : </span>
              {camera.tags?.length ? camera.tags.map(t => (
                <Badge key={t} variant="outline" className="mr-1">{t}</Badge>
              )) : '—'}
            </div>
          </div>

          <Separator />

          <div className="text-sm space-y-1">
            <p className="text-muted-foreground">Flux :</p>
            {Object.entries(camera.streams).map(([key, url]) => (
              <div key={key} className="flex gap-2">
                <Badge variant="outline">{key}</Badge>
                <code className="text-xs bg-muted px-2 py-0.5 rounded">{url}</code>
              </div>
            ))}
          </div>

          <CameraTestBtn cameraId={camera.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Jobs associés</CardTitle>
        </CardHeader>
        <CardContent>
          {!jobs || jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun job associé à cette caméra.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map(job => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <Link to="/jobs" className="hover:underline font-medium">{job.name}</Link>
                    </TableCell>
                    <TableCell className="text-xs uppercase">{job.action}</TableCell>
                    <TableCell className="text-xs">{job.triggerType}</TableCell>
                    <TableCell>
                      <StatusBadge status={job.enabled ? 'running' : 'stopped'} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
