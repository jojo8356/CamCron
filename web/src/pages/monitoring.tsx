import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { ProcessList } from '@/components/monitoring/process-list'
import { LogViewer } from '@/components/monitoring/log-viewer'
import { ExecutionHistory } from '@/components/monitoring/execution-history'

export default function MonitoringPage() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)

  return (
    <>
      <Header title="Monitoring" />
      <div className="flex-1 space-y-4 p-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <ProcessList onSelectJob={setSelectedJobId} selectedJobId={selectedJobId} />
          <LogViewer jobId={selectedJobId} />
        </div>
        <ExecutionHistory />
      </div>
    </>
  )
}
