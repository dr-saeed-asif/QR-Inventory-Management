import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom'
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

const isDesktopFileProtocol = typeof window !== 'undefined' && window.location.protocol === 'file:'
const RouterProvider = isDesktopFileProtocol ? HashRouter : BrowserRouter

const ProtectedRoutes = () => {
  const token = useAuthStore((state) => state.token)
  if (!token) return <Navigate to="/login" replace />

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/add-item" element={<AddItemPage />} />
        <Route path="/inventory" element={<InventoryListPage />} />
        <Route path="/scanner" element={<ScannerPage />} />
        <Route path="/stock-operations" element={<StockOperationsPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/reports" element={<ReportsPage />} />
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
