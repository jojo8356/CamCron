import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { FileActions } from './file-actions'
import { FilePreview } from './file-preview'
import { useFiles, useDeleteFile } from '@/hooks/use-files'
import { Folder, FileIcon } from 'lucide-react'
import type { FileEntry } from '@/types'

function formatSize(bytes: number) {
  if (bytes === 0) return '—'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

export function FileExplorer() {
  const [currentPath, setCurrentPath] = useState('')
  const { data: files, isLoading } = useFiles(currentPath)
  const deleteMut = useDeleteFile()
  const [deleteTarget, setDeleteTarget] = useState<FileEntry | null>(null)
  const [previewFile, setPreviewFile] = useState<FileEntry | null>(null)

  const segments = currentPath ? currentPath.split('/').filter(Boolean) : []

  const navigateTo = (path: string) => setCurrentPath(path)
  const navigateBreadcrumb = (index: number) => {
    if (index < 0) { setCurrentPath(''); return }
    setCurrentPath(segments.slice(0, index + 1).join('/'))
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Explorateur de fichiers</CardTitle>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink className="cursor-pointer" onClick={() => navigateBreadcrumb(-1)}>
                  Racine
                </BreadcrumbLink>
              </BreadcrumbItem>
              {segments.map((seg, i) => (
                <BreadcrumbItem key={i}>
                  <BreadcrumbSeparator />
                  <BreadcrumbLink className="cursor-pointer" onClick={() => navigateBreadcrumb(i)}>
                    {seg}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : !files || files.length === 0 ? (
            <p className="text-sm text-muted-foreground">Répertoire vide.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Taille</TableHead>
                  <TableHead>Modifié</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map(entry => (
                  <TableRow key={entry.path}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {entry.type === 'directory'
                          ? <Folder className="h-4 w-4 text-muted-foreground" />
                          : <FileIcon className="h-4 w-4 text-muted-foreground" />}
                        {entry.type === 'directory' ? (
                          <button
                            className="font-medium hover:underline text-left"
                            onClick={() => navigateTo(entry.path)}
                          >
                            {entry.name}
                          </button>
                        ) : (
                          <span className="font-medium">{entry.name}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entry.type === 'file' ? formatSize(entry.size) : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(entry.modifiedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <FileActions entry={entry} onPreview={setPreviewFile} onDelete={setDeleteTarget} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Supprimer"
        description={`Êtes-vous sûr de vouloir supprimer « ${deleteTarget?.name} » ?`}
        onConfirm={() => { if (deleteTarget) deleteMut.mutate(deleteTarget.path); setDeleteTarget(null) }}
        destructive
      />

      <FilePreview
        open={!!previewFile}
        onOpenChange={() => setPreviewFile(null)}
        path={previewFile?.path ?? null}
        name={previewFile?.name ?? ''}
      />
    </>
  )
}
