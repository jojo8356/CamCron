import { useLocation, Link } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
  LayoutDashboard,
  Camera,
  CalendarClock,
  Activity,
  FolderOpen,
  Settings,
} from 'lucide-react'

const navItems = [
  { title: 'Tableau de bord', href: '/', icon: LayoutDashboard },
  { title: 'Caméras', href: '/cameras', icon: Camera },
  { title: 'Jobs', href: '/jobs', icon: CalendarClock },
  { title: 'Monitoring', href: '/monitoring', icon: Activity },
  { title: 'Fichiers', href: '/files', icon: FolderOpen },
  { title: 'Paramètres', href: '/settings', icon: Settings },
]

export function AppSidebar() {
  const { pathname } = useLocation()

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <Camera className="h-6 w-6" />
          CamCron
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(item => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={
                    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
                  }>
                    <Link to={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
