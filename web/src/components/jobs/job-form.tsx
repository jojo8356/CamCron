import { useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CronEditor } from './cron-editor'
import { PeriodSelector } from './period-selector'
import { useCameras } from '@/hooks/use-cameras'
import { useCreateJob, useUpdateJob } from '@/hooks/use-jobs'
import type { Job, CreateJobDto, ActionType, TriggerType } from '@/types'

const actionTypes: { value: ActionType; label: string }[] = [
  { value: 'record', label: 'Enregistrement' },
  { value: 'snapshot', label: 'Capture' },
  { value: 'timelapse', label: 'Timelapse' },
  { value: 'detect_motion', label: 'Détection mouvement' },
  { value: 'test_connection', label: 'Test connexion' },
  { value: 'custom_command', label: 'Commande perso' },
]

const triggerTypes: { value: TriggerType; label: string }[] = [
  { value: 'continuous', label: 'Continu' },
  { value: 'oneshot', label: 'Ponctuel' },
  { value: 'fixed_duration', label: 'Durée fixe' },
]

interface JobFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  job?: Job | null
}

export function JobForm({ open, onOpenChange, job }: JobFormProps) {
  const { data: cameras } = useCameras()
  const create = useCreateJob()
  const update = useUpdateJob()
  const isEdit = !!job

  const [name, setName] = useState('')
  const [cameraId, setCameraId] = useState('')
  const [streamKey, setStreamKey] = useState('main')
  const [action, setAction] = useState<ActionType>('record')
  const [triggerType, setTriggerType] = useState<TriggerType>('continuous')
  const [cron, setCron] = useState('0 * * * *')
  const [cronStop, setCronStop] = useState('')
  const [duration, setDuration] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [periodRecurrent, setPeriodRecurrent] = useState(false)
  const [outputDir, setOutputDir] = useState('./data/{cameraName}/{date}')
  const [filePattern, setFilePattern] = useState('{cameraName}_{timestamp}')
  const [outputFormat, setOutputFormat] = useState('mp4')
  const [codec, setCodec] = useState('copy')
  const [resolution, setResolution] = useState('')
  const [quality, setQuality] = useState('')
  const [segmentDuration, setSegmentDuration] = useState('')
  const [customCommand, setCustomCommand] = useState('')
  const [maxRetries, setMaxRetries] = useState('3')
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    if (job) {
      setName(job.name); setCameraId(job.cameraId); setStreamKey(job.streamKey)
      setAction(job.action); setTriggerType(job.triggerType); setCron(job.cron)
      setCronStop(job.cronStop ?? ''); setDuration(job.duration?.toString() ?? '')
      setPeriodStart(job.periodStart ?? ''); setPeriodEnd(job.periodEnd ?? '')
      setPeriodRecurrent(job.periodRecurrent); setOutputDir(job.outputDir)
      setFilePattern(job.filePattern); setOutputFormat(job.outputFormat)
      setCodec(job.codec ?? 'copy'); setResolution(job.resolution ?? '')
      setQuality(job.quality?.toString() ?? '')
      setSegmentDuration(job.segmentDuration?.toString() ?? '')
      setCustomCommand(job.customCommand ?? ''); setMaxRetries(job.maxRetries.toString())
      setEnabled(job.enabled)
    } else {
      setName(''); setCameraId(cameras?.[0]?.id ?? ''); setStreamKey('main')
      setAction('record'); setTriggerType('continuous'); setCron('0 * * * *')
      setCronStop(''); setDuration(''); setPeriodStart(''); setPeriodEnd('')
      setPeriodRecurrent(false); setOutputDir('./data/{cameraName}/{date}')
      setFilePattern('{cameraName}_{timestamp}'); setOutputFormat('mp4')
      setCodec('copy'); setResolution(''); setQuality(''); setSegmentDuration('')
      setCustomCommand(''); setMaxRetries('3'); setEnabled(true)
    }
  }, [job, open, cameras])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const dto: CreateJobDto = {
      name, cameraId, streamKey, action, triggerType, cron, outputDir,
      filePattern, outputFormat, enabled,
      ...(cronStop && { cronStop }),
      ...(duration && { duration: Number(duration) }),
      ...(periodStart && { periodStart }),
      ...(periodEnd && { periodEnd }),
      ...(periodRecurrent && { periodRecurrent }),
      ...(codec && { codec }),
      ...(resolution && { resolution }),
      ...(quality && { quality: Number(quality) }),
      ...(segmentDuration && { segmentDuration: Number(segmentDuration) }),
      ...(customCommand && { customCommand }),
      maxRetries: Number(maxRetries),
    }

    const mutation = isEdit
      ? update.mutateAsync({ id: job!.id, data: dto })
      : create.mutateAsync(dto)

    mutation.then(() => onOpenChange(false))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier le job' : 'Créer un job'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Base */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Caméra *</Label>
              <Select value={cameraId} onValueChange={setCameraId}>
                <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>
                  {cameras?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Action *</Label>
              <Select value={action} onValueChange={v => setAction(v as ActionType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {actionTypes.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type de déclenchement</Label>
              <Select value={triggerType} onValueChange={v => setTriggerType(v as TriggerType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {triggerTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Flux</Label>
              <Input value={streamKey} onChange={e => setStreamKey(e.target.value)} />
            </div>
          </div>

          {/* Tabs: Schedule / Output / Advanced */}
          <Tabs defaultValue="schedule">
            <TabsList className="w-full">
              <TabsTrigger value="schedule" className="flex-1">Planification</TabsTrigger>
              <TabsTrigger value="output" className="flex-1">Sortie</TabsTrigger>
              <TabsTrigger value="advanced" className="flex-1">Avancé</TabsTrigger>
            </TabsList>

            <TabsContent value="schedule" className="space-y-4 pt-2">
              <CronEditor value={cron} onChange={setCron} />
              {triggerType === 'continuous' && (
                <div className="space-y-2">
                  <Label>Cron d'arrêt (optionnel)</Label>
                  <Input value={cronStop} onChange={e => setCronStop(e.target.value)} placeholder="0 18 * * 1-5" className="font-mono text-sm" />
                </div>
              )}
              {triggerType === 'fixed_duration' && (
                <div className="space-y-2">
                  <Label>Durée (secondes)</Label>
                  <Input type="number" min="1" value={duration} onChange={e => setDuration(e.target.value)} />
                </div>
              )}
              <PeriodSelector
                periodStart={periodStart} periodEnd={periodEnd} periodRecurrent={periodRecurrent}
                onStartChange={setPeriodStart} onEndChange={setPeriodEnd} onRecurrentChange={setPeriodRecurrent}
              />
            </TabsContent>

            <TabsContent value="output" className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Répertoire de sortie *</Label>
                <Input value={outputDir} onChange={e => setOutputDir(e.target.value)} className="font-mono text-sm" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Pattern de fichier</Label>
                  <Input value={filePattern} onChange={e => setFilePattern(e.target.value)} className="font-mono text-sm" />
                </div>
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Input value={outputFormat} onChange={e => setOutputFormat(e.target.value)} />
                </div>
              </div>
              {segmentDuration !== undefined && (
                <div className="space-y-2">
                  <Label>Durée de segment (secondes)</Label>
                  <Input type="number" value={segmentDuration} onChange={e => setSegmentDuration(e.target.value)} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 pt-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Codec</Label>
                  <Input value={codec} onChange={e => setCodec(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Résolution</Label>
                  <Input value={resolution} onChange={e => setResolution(e.target.value)} placeholder="1920x1080" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Qualité (CRF)</Label>
                  <Input type="number" value={quality} onChange={e => setQuality(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Max retries</Label>
                  <Input type="number" value={maxRetries} onChange={e => setMaxRetries(e.target.value)} />
                </div>
              </div>
              {action === 'custom_command' && (
                <div className="space-y-2">
                  <Label>Commande personnalisée</Label>
                  <Textarea value={customCommand} onChange={e => setCustomCommand(e.target.value)} className="font-mono text-sm" rows={3} />
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex items-center gap-2">
            <Switch checked={enabled} onCheckedChange={setEnabled} id="job-enabled" />
            <Label htmlFor="job-enabled">Activé</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={create.isPending || update.isPending}>
              {isEdit ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
