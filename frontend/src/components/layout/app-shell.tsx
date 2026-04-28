import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const links = [
  { to: '/', label: 'Dashboard' },
  // { to: '/add-item', label: 'Add Item' },
  { to: '/inventory', label: 'Inventory Lists' },
  { to: '/stock-operations', label: 'Stock Operations' },
  { to: '/scanner', label: 'QR Scanner' },
  { to: '/categories', label: 'Categories' },
  { to: '/reports', label: 'Reports' },
  { to: '/settings', label: 'Settings' },
]

export const AppShell = () => {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={cn(
          'h-screen overflow-y-auto border-r bg-white p-3 transition-all',
          collapsed ? 'w-20' : 'w-64',
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          {!collapsed ? <span className="font-bold">Inventory Management</span> : null}
          <Button variant="outline" onClick={() => setCollapsed((s) => !s)}>
            {collapsed ? '>' : '<'}
          </Button>
        </div>
        <nav className="space-y-2">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'block rounded-md px-3 py-2 text-sm',
                location.pathname === link.to ? 'bg-slate-900 text-white' : 'hover:bg-slate-100',
              )}
            >
              {collapsed ? link.label[0] : link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex h-screen flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between border-b bg-white px-6 py-4">
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
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
