import { Button } from '@/components/ui/button'
import { downloadFile } from '@/hooks/use-files'
import { Download, Trash2, Eye } from 'lucide-react'
import type { FileEntry } from '@/types'

interface FileActionsProps {
  entry: FileEntry
  onPreview: (entry: FileEntry) => void
  onDelete: (entry: FileEntry) => void
}

function canPreview(name: string) {
  return /\.(jpe?g|png|gif|webp|bmp|svg|mp4|webm|mkv|avi|mov|ts)$/i.test(name)
}

export function FileActions({ entry, onPreview, onDelete }: FileActionsProps) {
  if (entry.type === 'directory') return null

  return (
    <div className="flex gap-1">
      {canPreview(entry.name) && (
        <Button variant="ghost" size="icon" onClick={() => onPreview(entry)} title="Aperçu">
          <Eye className="h-4 w-4" />
        </Button>
      )}
      <Button variant="ghost" size="icon" onClick={() => downloadFile(entry.path)} title="Télécharger">
        <Download className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => onDelete(entry)} title="Supprimer">
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  )
}
