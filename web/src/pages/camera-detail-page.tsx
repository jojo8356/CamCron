import { useParams, Link } from 'react-router-dom'
import { Header } from '@/components/layout/header'
import { CameraDetail } from '@/components/cameras/camera-detail'
import { useCamera } from '@/hooks/use-cameras'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function CameraDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: camera, isLoading } = useCamera(id ?? '')

  return (
    <>
      <Header title="Détail caméra" />
      <div className="p-4">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link to="/cameras"><ArrowLeft className="h-4 w-4 mr-1" /> Retour</Link>
        </Button>
        {isLoading && <p className="text-muted-foreground">Chargement...</p>}
        {camera && <CameraDetail camera={camera} />}
      </div>
    </>
  )
}
