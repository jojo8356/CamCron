import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Job, JobWithRuntime, JobExecution, CreateJobDto, UpdateJobDto } from '@/types'

export function useJobs(filters?: { cameraId?: string; action?: string; enabled?: string }) {
  const params = new URLSearchParams()
  if (filters?.cameraId) params.set('cameraId', filters.cameraId)
  if (filters?.action) params.set('action', filters.action)
  if (filters?.enabled) params.set('enabled', filters.enabled)
  const qs = params.toString()
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => api.get<Job[]>(`/jobs${qs ? `?${qs}` : ''}`),
  })
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ['jobs', id],
    queryFn: () => api.get<JobWithRuntime>(`/jobs/${id}`),
    enabled: !!id,
  })
}

export function useCreateJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateJobDto) => api.post<Job>('/jobs', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  })
}

export function useUpdateJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateJobDto }) =>
      api.patch<Job>(`/jobs/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  })
}

export function useDeleteJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<Job>(`/jobs/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  })
}

export function useStartJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post<{ message: string }>(`/jobs/${id}/start`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  })
}

export function useStopJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post<{ message: string }>(`/jobs/${id}/stop`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  })
}

export function useJobLogs(id: string, limit = 100) {
  return useQuery({
    queryKey: ['jobs', id, 'logs'],
    queryFn: () => api.get<{ jobId: string; lines: string[] }>(`/jobs/${id}/logs?limit=${limit}`),
    enabled: !!id,
  })
}

export function useJobHistory(id: string, limit = 50) {
  return useQuery({
    queryKey: ['jobs', id, 'history'],
    queryFn: () => api.get<JobExecution[]>(`/jobs/${id}/history?limit=${limit}`),
    enabled: !!id,
  })
}
