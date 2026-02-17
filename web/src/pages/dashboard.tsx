import { Header } from '@/components/layout/header'
import { KpiCards } from '@/components/dashboard/kpi-cards'
import { ActiveProcesses } from '@/components/dashboard/active-processes'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { useStatus } from '@/hooks/use-system'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function DashboardPage() {
  const { data: status } = useStatus()

  const chartData = [
    { name: 'Caméras', value: status?.cameras ?? 0 },
    { name: 'Jobs', value: status?.jobs ?? 0 },
    { name: 'Actifs', value: status?.activeProcesses ?? 0 },
  ]

  return (
    <>
      <Header title="Tableau de bord" />
      <div className="flex-1 space-y-4 p-4">
        <KpiCards data={status} />
        <div className="grid gap-4 lg:grid-cols-2">
          <ActiveProcesses processes={status?.runningJobs ?? []} />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vue d'ensemble</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" fill="oklch(0.646 0.222 41.116)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        <ActivityFeed />
      </div>
    </>
  )
}
