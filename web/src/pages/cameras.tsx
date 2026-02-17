import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { CameraList } from '@/components/cameras/camera-list'
import { CameraForm } from '@/components/cameras/camera-form'
import type { Camera } from '@/types'

export default function CamerasPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Camera | null>(null)

  return (
    <>
      <Header title="Caméras" />
      <div className="p-4">
        <CameraList
          onAdd={() => { setEditing(null); setFormOpen(true) }}
          onEdit={(cam) => { setEditing(cam); setFormOpen(true) }}
        />
        <CameraForm
          open={formOpen}
          onOpenChange={setFormOpen}
          camera={editing}
        />
      </div>
    </>
  )
}
