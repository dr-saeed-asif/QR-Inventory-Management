import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { inventoryService } from '@/services/inventory.service'

export const DashboardPage = () => {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    totalItems: 0,
    categories: 0,
    lowStockItems: 0,
    recentItems: 0,
  })

  useEffect(() => {
    inventoryService
      .summary()
      .then(setSummary)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card><p>Total Items</p><p className="text-2xl font-bold">{summary.totalItems}</p></Card>
      <Card><p>Categories</p><p className="text-2xl font-bold">{summary.categories}</p></Card>
      <Card><p>Low Stock Items</p><p className="text-2xl font-bold">{summary.lowStockItems}</p></Card>
      <Card><p>Recent Items</p><p className="text-2xl font-bold">{summary.recentItems}</p></Card>
    </div>
  )
}
