import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import type { ReactElement } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { LoginPage } from '@/pages/login-page'
import { AppShell } from '@/components/layout/app-shell'
import { DashboardPage } from '@/pages/dashboard-page'
import { AddItemPage } from '@/pages/add-item-page'
import { InventoryListPage } from '@/pages/inventory-list-page'
import { ScannerPage } from '@/pages/scanner-page'
import { CategoriesPage } from '@/pages/categories-page'
import { ReportsPage } from '@/pages/reports-page'
import { SettingsPage } from '@/pages/settings-page'
import { StockOperationsPage } from '@/pages/stock-operations-page'
import { UsersPage } from '@/pages/users-page'
import { RolesPage } from '@/pages/roles-page'
import { hasPermission, type Permission } from '@/lib/permissions'

const isDesktopFileProtocol = typeof window !== 'undefined' && window.location.protocol === 'file:'
const RouterProvider = isDesktopFileProtocol ? HashRouter : BrowserRouter

const RequirePermission = ({ permission, children }: { permission: Permission; children: ReactElement }) => {
  const user = useAuthStore((state) => state.user)
  if (!hasPermission(user?.role, permission)) return <Navigate to="/" replace />
  return children
}

const RequireAdmin = ({ children }: { children: ReactElement }) => {
  const user = useAuthStore((state) => state.user)
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />
  return children
}

const ProtectedRoutes = () => {
  const token = useAuthStore((state) => state.token)
  if (!token) return <Navigate to="/login" replace />

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/add-item" element={<RequirePermission permission="Create"><AddItemPage /></RequirePermission>} />
        <Route path="/inventory" element={<RequirePermission permission="Read"><InventoryListPage /></RequirePermission>} />
        <Route path="/scanner" element={<RequirePermission permission="Create"><ScannerPage /></RequirePermission>} />
        <Route path="/stock-operations" element={<RequirePermission permission="Read"><StockOperationsPage /></RequirePermission>} />
        <Route path="/categories" element={<RequirePermission permission="Read"><CategoriesPage /></RequirePermission>} />
        <Route path="/reports" element={<RequirePermission permission="Read"><ReportsPage /></RequirePermission>} />
        <Route path="/users" element={<RequireAdmin><UsersPage /></RequireAdmin>} />
        <Route path="/roles" element={<RequireAdmin><RolesPage /></RequireAdmin>} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

export const AppRouter = () => (
  <RouterProvider>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  </RouterProvider>
)
