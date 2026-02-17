import { useEffect, useRef, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getSocket } from '@/lib/socket'
import type { WsJobStarted, WsJobStopped, WsJobRetry, WsJobLog, WsStatusUpdate } from '@/types'

export function useSocketStatus() {
  const qc = useQueryClient()

  useEffect(() => {
    const socket = getSocket()

    const onStarted = (_data: WsJobStarted) => {
      qc.invalidateQueries({ queryKey: ['status'] })
      qc.invalidateQueries({ queryKey: ['jobs'] })
    }
    const onStopped = (_data: WsJobStopped) => {
      qc.invalidateQueries({ queryKey: ['status'] })
      qc.invalidateQueries({ queryKey: ['jobs'] })
    }
    const onRetry = (_data: WsJobRetry) => {
      qc.invalidateQueries({ queryKey: ['jobs'] })
    }
    const onUpdate = (_data: WsStatusUpdate) => {
      qc.invalidateQueries({ queryKey: ['status'] })
    }

    socket.on('job:started', onStarted)
    socket.on('job:stopped', onStopped)
    socket.on('job:retry', onRetry)
    socket.on('status:update', onUpdate)

    return () => {
      socket.off('job:started', onStarted)
      socket.off('job:stopped', onStopped)
      socket.off('job:retry', onRetry)
      socket.off('status:update', onUpdate)
    }
  }, [qc])
}

export function useJobLogs(jobId: string | null) {
  const [lines, setLines] = useState<string[]>([])
  const subscribedRef = useRef<string | null>(null)

  const clear = useCallback(() => setLines([]), [])

  useEffect(() => {
    if (!jobId) return

    const socket = getSocket()

    // Unsubscribe from previous job
    if (subscribedRef.current && subscribedRef.current !== jobId) {
      socket.emit('unsubscribe:logs', subscribedRef.current)
    }

    setLines([])
    socket.emit('subscribe:logs', jobId)
    subscribedRef.current = jobId

    const onLog = (data: WsJobLog) => {
      if (data.jobId === jobId) {
        setLines(prev => [...prev.slice(-999), data.line])
      }
    }

    socket.on('job:log', onLog)

    return () => {
      socket.off('job:log', onLog)
      socket.emit('unsubscribe:logs', jobId)
      subscribedRef.current = null
    }
  }, [jobId])

  return { lines, clear }
}
