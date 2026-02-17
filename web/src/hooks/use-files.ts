import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { FileEntry } from '@/types'

export function useFiles(path: string) {
  return useQuery({
    queryKey: ['files', path],
    queryFn: () => api.get<FileEntry[]>(`/files?path=${encodeURIComponent(path)}`),
  })
}

export function useDeleteFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (path: string) => api.delete<{ message: string }>(`/files?path=${encodeURIComponent(path)}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files'] }),
  })
}

export function downloadFile(path: string) {
  const url = `/api/files/download?path=${encodeURIComponent(path)}`
  const a = document.createElement('a')
  a.href = url
  a.download = ''
  document.body.appendChild(a)
  a.click()
  a.remove()
}
