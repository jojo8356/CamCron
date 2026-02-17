import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { AppLayout } from '@/components/layout/app-layout'
import { useSocketStatus } from '@/hooks/use-socket'

import DashboardPage from '@/pages/dashboard'
import CamerasPage from '@/pages/cameras'
import CameraDetailPage from '@/pages/camera-detail-page'
import JobsPage from '@/pages/jobs'
import MonitoringPage from '@/pages/monitoring'
import FilesPage from '@/pages/files'
import SettingsPage from '@/pages/settings'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
})

function SocketBridge() {
  useSocketStatus()
  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <SocketBridge />
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="cameras" element={<CamerasPage />} />
              <Route path="cameras/:id" element={<CameraDetailPage />} />
              <Route path="jobs" element={<JobsPage />} />
              <Route path="monitoring" element={<MonitoringPage />} />
              <Route path="files" element={<FilesPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  )
}
