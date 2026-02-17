import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { CameraTestBtn } from './camera-test-btn'
import { useCameras, useDeleteCamera } from '@/hooks/use-cameras'
import { Pencil, Trash2, Plus } from 'lucide-react'
import type { Camera } from '@/types'

interface CameraListProps {
  onEdit: (camera: Camera) => void
  onAdd: () => void
}

export function CameraList({ onEdit, onAdd }: CameraListProps) {
  const { data: cameras, isLoading } = useCameras()
  const deleteMut = useDeleteCamera()
  const [deleteTarget, setDeleteTarget] = useState<Camera | null>(null)

  if (isLoading) return <p className="text-muted-foreground p-4">Chargement...</p>

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{cameras?.length ?? 0} caméra(s)</p>
        <Button onClick={onAdd}><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Protocole</TableHead>
              <TableHead>Emplacement</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Test</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cameras?.map(cam => (
              <TableRow key={cam.id}>
                <TableCell>
                  <Link to={`/cameras/${cam.id}`} className="font-medium hover:underline">
                    {cam.name}
                  </Link>
                </TableCell>
                <TableCell className="uppercase text-xs">{cam.protocol}</TableCell>
                <TableCell className="text-muted-foreground">{cam.location ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={cam.enabled ? 'default' : 'secondary'}>
                    {cam.enabled ? 'Activée' : 'Désactivée'}
                  </Badge>
                </TableCell>
                <TableCell><CameraTestBtn cameraId={cam.id} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(cam)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(cam)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {cameras?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Aucune caméra configurée.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Supprimer la caméra"
        description={`Êtes-vous sûr de vouloir supprimer « ${deleteTarget?.name} » ? Cette action est irréversible.`}
        onConfirm={() => {
          if (deleteTarget) deleteMut.mutate(deleteTarget.id)
          setDeleteTarget(null)
        }}
        destructive
      />
    </>
  )
}
