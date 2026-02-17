import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useTestCamera } from '@/hooks/use-cameras'
import { Loader2, Wifi, WifiOff } from 'lucide-react'

export function CameraTestBtn({ cameraId }: { cameraId: string }) {
  const test = useTestCamera()
  const [result, setResult] = useState<'idle' | 'ok' | 'fail'>('idle')

  const handleTest = () => {
    setResult('idle')
    test.mutate(cameraId, {
      onSuccess: (data) => setResult(data.success ? 'ok' : 'fail'),
      onError: () => setResult('fail'),
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleTest} disabled={test.isPending}>
        {test.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
        <span className="ml-1">Tester</span>
      </Button>
      {result === 'ok' && <span className="text-sm text-green-600">Connexion OK</span>}
      {result === 'fail' && (
        <span className="flex items-center gap-1 text-sm text-destructive">
          <WifiOff className="h-3 w-3" /> Échec
        </span>
      )}
    </div>
  )
}
