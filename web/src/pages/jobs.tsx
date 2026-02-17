import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { JobList } from '@/components/jobs/job-list'
import { JobForm } from '@/components/jobs/job-form'
import type { Job } from '@/types'

export default function JobsPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Job | null>(null)

  const openCreate = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (job: Job) => { setEditing(job); setFormOpen(true) }
  const openDuplicate = (job: Job) => {
    // Pre-fill with existing job data but clear id so form creates a new one
    const copy = { ...job, id: undefined, name: `${job.name} (copie)` } as unknown as Job
    setEditing(copy)
    setFormOpen(true)
  }

  return (
    <>
      <Header title="Jobs" />
      <div className="p-4">
        <JobList onAdd={openCreate} onEdit={openEdit} onDuplicate={openDuplicate} />
        <JobForm
          open={formOpen}
          onOpenChange={setFormOpen}
          job={editing}
        />
      </div>
    </>
  )
}
