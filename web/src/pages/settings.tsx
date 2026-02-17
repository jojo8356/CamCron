import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useSettings, useUpdateSettings, useStatus, useHealth } from '@/hooks/use-system'
import { Save, Download, Upload, Server } from 'lucide-react'
import { toast } from 'sonner'

function formatUptime(ms: number) {
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${d}j ${h}h ${m}m`
}

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings()
  const { data: status } = useStatus()
  const { data: health } = useHealth()
  const updateSettings = useUpdateSettings()

  const [formData, setFormData] = useState<Record<string, string>>({})

  useEffect(() => {
    if (settings) {
      const flat: Record<string, string> = {}
      for (const [k, v] of Object.entries(settings)) {
        flat[k] = typeof v === 'string' ? v : JSON.stringify(v)
      }
      setFormData(flat)
    }
  }, [settings])

  const handleSave = () => {
    const parsed: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(formData)) {
      try { parsed[k] = JSON.parse(v) } catch { parsed[k] = v }
    }
    updateSettings.mutate(parsed, {
      onSuccess: () => toast.success('Paramètres enregistrés'),
      onError: () => toast.error('Erreur lors de la sauvegarde'),
    })
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'camcron-settings.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        updateSettings.mutate(data, {
          onSuccess: () => toast.success('Configuration importée'),
          onError: () => toast.error("Erreur lors de l'import"),
        })
      } catch {
        toast.error('Fichier JSON invalide')
      }
    }
    input.click()
  }

  return (
    <>
      <Header title="Paramètres" />
      <div className="flex-1 space-y-4 p-4">
        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="h-4 w-4" /> Informations système
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
              <div>
                <span className="text-muted-foreground">Statut : </span>
                <Badge variant="default">{health?.status ?? '—'}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Uptime : </span>
                <span>{status ? formatUptime(status.uptime) : '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">FFmpeg : </span>
                <span>{status?.ffmpegVersion ?? 'Non détecté'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Démarré : </span>
                <span>
                  {health?.startedAt
                    ? new Date(health.startedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
                    : '—'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Form */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Configuration globale</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1" /> Exporter
              </Button>
              <Button variant="outline" size="sm" onClick={handleImport}>
                <Upload className="h-4 w-4 mr-1" /> Importer
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : Object.keys(formData).length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun paramètre configuré.</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(formData).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <Label htmlFor={key} className="font-mono text-xs">{key}</Label>
                    <Input
                      id={key}
                      value={value}
                      onChange={e => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
                      className="font-mono text-sm"
                    />
                  </div>
                ))}
                <Separator />
                <Button onClick={handleSave} disabled={updateSettings.isPending}>
                  <Save className="h-4 w-4 mr-1" /> Enregistrer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
