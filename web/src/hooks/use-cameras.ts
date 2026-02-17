import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Camera, CreateCameraDto, UpdateCameraDto, TestConnectionResult } from '@/types'

export function useCameras() {
  return useQuery({
    queryKey: ['cameras'],
    queryFn: () => api.get<Camera[]>('/cameras'),
  })
}

export function useCamera(id: string) {
  return useQuery({
    queryKey: ['cameras', id],
    queryFn: () => api.get<Camera>(`/cameras/${id}`),
    enabled: !!id,
  })
}

export function useCreateCamera() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCameraDto) => api.post<Camera>('/cameras', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cameras'] }),
  })
}

export function useUpdateCamera() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCameraDto }) =>
      api.patch<Camera>(`/cameras/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cameras'] }),
  })
}

export function useDeleteCamera() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<Camera>(`/cameras/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cameras'] }),
  })
}

export function useTestCamera() {
  return useMutation({
    mutationFn: (id: string) => api.post<TestConnectionResult>(`/cameras/${id}/test`),
  })
}
