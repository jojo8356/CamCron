import { useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useJobLogs as useJobLogsWs } from '@/hooks/use-socket'
import { useJobLogs as useJobLogsRest } from '@/hooks/use-jobs'
import { Eraser } from 'lucide-react'

interface LogViewerProps {
  jobId: string | null
}

export function LogViewer({ jobId }: LogViewerProps) {
  const { lines: wsLines, clear } = useJobLogsWs(jobId)
  const { data: restLogs } = useJobLogsRest(jobId ?? '', 200)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Combine REST logs (initial) with WS logs (streaming)
  const initialLines = restLogs?.lines ?? []
  const allLines = wsLines.length > 0 ? wsLines : initialLines

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [allLines.length])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">
          Logs {jobId ? `— ${jobId.slice(0, 8)}...` : ''}
        </CardTitle>
        {jobId && (
          <Button variant="ghost" size="sm" onClick={clear}>
            <Eraser className="h-4 w-4 mr-1" /> Effacer
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!jobId ? (
          <p className="text-sm text-muted-foreground">Sélectionnez un processus pour voir ses logs.</p>
        ) : (
          <ScrollArea className="h-80 rounded-md border bg-black p-3">
            <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
              {allLines.length === 0 ? 'En attente de logs...' : allLines.join('\n')}
            </pre>
            <div ref={bottomRef} />
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
