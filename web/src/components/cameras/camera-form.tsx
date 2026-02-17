import { useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useCreateCamera, useUpdateCamera } from '@/hooks/use-cameras'
import type { Camera, CreateCameraDto, Protocol } from '@/types'

const protocols: Protocol[] = ['rtsp', 'rtmp', 'http', 'onvif']

interface CameraFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  camera?: Camera | null
}

export function CameraForm({ open, onOpenChange, camera }: CameraFormProps) {
  const create = useCreateCamera()
  const update = useUpdateCamera()
  const isEdit = !!camera

  const [name, setName] = useState('')
  const [protocol, setProtocol] = useState<Protocol>('rtsp')
  const [mainStream, setMainStream] = useState('')
  const [subStream, setSubStream] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [tags, setTags] = useState('')
  const [location, setLocation] = useState('')
  const [model, setModel] = useState('')
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    if (camera) {
      setName(camera.name)
      setProtocol(camera.protocol)
      setMainStream(camera.streams?.main ?? '')
      setSubStream(camera.streams?.sub ?? '')
      setUsername(camera.username ?? '')
      setPassword(camera.password ?? '')
      setTags(camera.tags?.join(', ') ?? '')
      setLocation(camera.location ?? '')
      setModel(camera.model ?? '')
      setEnabled(camera.enabled)
    } else {
      setName(''); setProtocol('rtsp'); setMainStream(''); setSubStream('')
      setUsername(''); setPassword(''); setTags(''); setLocation(''); setModel(''); setEnabled(true)
    }
  }, [camera, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const streams: Record<string, string> = { main: mainStream }
    if (subStream) streams.sub = subStream

    const dto: CreateCameraDto = {
      name, protocol, streams, enabled,
      ...(username && { username }),
      ...(password && { password }),
      ...(tags && { tags: tags.split(',').map(t => t.trim()).filter(Boolean) }),
      ...(location && { location }),
      ...(model && { model }),
    }

    const mutation = isEdit
      ? update.mutateAsync({ id: camera!.id, data: dto })
      : create.mutateAsync(dto)

    mutation.then(() => onOpenChange(false))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier la caméra' : 'Ajouter une caméra'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Protocole</Label>
              <Select value={protocol} onValueChange={v => setProtocol(v as Protocol)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {protocols.map(p => <SelectItem key={p} value={p}>{p.toUpperCase()}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="main">Flux principal *</Label>
            <Input id="main" placeholder="rtsp://..." value={mainStream} onChange={e => setMainStream(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sub">Flux secondaire</Label>
            <Input id="sub" placeholder="rtsp://..." value={subStream} onChange={e => setSubStream(e.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="user">Utilisateur</Label>
              <Input id="user" value={username} onChange={e => setUsername(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pass">Mot de passe</Label>
              <Input id="pass" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location">Emplacement</Label>
              <Input id="location" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Modèle</Label>
              <Input id="model" value={model} onChange={e => setModel(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
            <Input id="tags" placeholder="extérieur, entrée" value={tags} onChange={e => setTags(e.target.value)} />
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={enabled} onCheckedChange={setEnabled} id="enabled" />
            <Label htmlFor="enabled">Activée</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={create.isPending || update.isPending}>
              {isEdit ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
