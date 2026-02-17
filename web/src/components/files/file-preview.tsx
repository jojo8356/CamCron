import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

interface FilePreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  path: string | null
  name: string
}

function isImage(name: string) {
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(name)
}

function isVideo(name: string) {
  return /\.(mp4|webm|mkv|avi|mov|ts)$/i.test(name)
}

export function FilePreview({ open, onOpenChange, path, name }: FilePreviewProps) {
  if (!path) return null
  const url = `/api/files/download?path=${encodeURIComponent(path)}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{name}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center">
          {isImage(name) && (
            <img src={url} alt={name} className="max-h-[70vh] rounded-md object-contain" />
          )}
          {isVideo(name) && (
            <video src={url} controls className="max-h-[70vh] w-full rounded-md">
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
          )}
          {!isImage(name) && !isVideo(name) && (
            <p className="text-muted-foreground">Aperçu non disponible pour ce type de fichier.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
