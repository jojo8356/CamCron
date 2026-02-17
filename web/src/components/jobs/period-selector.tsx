import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface PeriodSelectorProps {
  periodStart: string
  periodEnd: string
  periodRecurrent: boolean
  onStartChange: (v: string) => void
  onEndChange: (v: string) => void
  onRecurrentChange: (v: boolean) => void
}

export function PeriodSelector({
  periodStart, periodEnd, periodRecurrent,
  onStartChange, onEndChange, onRecurrentChange,
}: PeriodSelectorProps) {
  return (
    <div className="space-y-3 rounded-md border p-3">
      <Label className="text-sm font-medium">Période calendaire (optionnel)</Label>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Début</Label>
          <Input
            type="date"
            value={periodStart}
            onChange={e => onStartChange(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Fin</Label>
          <Input
            type="date"
            value={periodEnd}
            onChange={e => onEndChange(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={periodRecurrent} onCheckedChange={onRecurrentChange} id="recurrent" />
        <Label htmlFor="recurrent" className="text-sm">Récurrent chaque année</Label>
      </div>
    </div>
  )
}
