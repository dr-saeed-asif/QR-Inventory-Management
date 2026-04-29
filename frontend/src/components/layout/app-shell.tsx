import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  BarChart3,
  Boxes,
  FolderTree,
  LayoutDashboard,
  QrCode,
  Settings,
  ShieldCheck,
  Users,
  Warehouse,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { hasPermission, type Permission } from '@/lib/permissions'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, permission: null },
  // { to: '/add-item', label: 'Add Item' },
  { to: '/inventory', label: 'Inventory Lists', icon: Boxes, permission: 'Read' },
  { to: '/stock-operations', label: 'Stock Operations', icon: Warehouse, permission: 'Read' },
  { to: '/scanner', label: 'QR Scanner', icon: QrCode, permission: 'Create' },
  { to: '/categories', label: 'Categories', icon: FolderTree, permission: 'Read' },
  { to: '/reports', label: 'Reports', icon: BarChart3, permission: 'Read' },
  { to: '/users', label: 'Users', icon: Users, permission: null },
  { to: '/roles', label: 'Roles', icon: ShieldCheck, permission: null },
  { to: '/settings', label: 'Settings', icon: Settings, permission: null },
] as const satisfies Array<{ to: string; label: string; icon: (typeof LayoutDashboard); permission: Permission | null }>

export const AppShell = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const visibleLinks = links.filter((link) => {
    if (link.to === '/users' || link.to === '/roles') return user?.role === 'ADMIN'
    return link.permission ? hasPermission(user?.role, link.permission) : true
  })

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside
        className={cn(
          'h-screen overflow-y-auto border-r border-slate-200 bg-white/95 p-3 shadow-sm transition-all',
          collapsed ? 'w-20' : 'w-72',
        )}
      >
        <div className="sticky top-0 z-10 mb-4 flex items-center justify-between rounded-xl bg-white/95 py-1 backdrop-blur">
          {!collapsed ? <span className="px-1 text-lg font-semibold tracking-tight">Inventory Management</span> : null}
          <Button variant="outline" className="h-11 w-11 p-0" onClick={() => setCollapsed((s) => !s)}>
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        <nav className="space-y-2 pb-4">
          {visibleLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
                )
              }
              title={link.label}
            >
              {({ isActive }) => (
                <>
                  <link.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-slate-500')} />
                  {!collapsed ? (
                    <span className={cn('truncate', isActive ? 'text-white' : 'text-slate-700')}>{link.label}</span>
                  ) : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex h-screen flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur md:px-6">
          <div>
            <p className="text-sm text-slate-500">Welcome</p>
            <p className="font-semibold">{user?.name ?? 'User'}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              logout()
              navigate('/login')
            }}
          >
            Logout
          </Button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
