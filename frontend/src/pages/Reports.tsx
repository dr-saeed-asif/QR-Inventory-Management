import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { inventoryService } from '@/services/inventory.service'
import type { MoversReport, MovementTrendReport, ProfitLossReport } from '@/services/inventory.service'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { currency } from '@/lib/utils'
import { useAuthStore } from '@/store/auth-store'
import { hasPermission } from '@/lib/permissions'

export const ReportsPage = () => {
  const { toast } = useToast()
  const user = useAuthStore((state) => state.user)
  const canExport = hasPermission(user?.role, 'reports.export', user?.permissions)
  const [loading, setLoading] = useState(false)
  const [days, setDays] = useState(30)
  const [reportLoading, setReportLoading] = useState(false)
  const [trend, setTrend] = useState<MovementTrendReport | null>(null)
  const [movers, setMovers] = useState<MoversReport | null>(null)
  const [profitLoss, setProfitLoss] = useState<ProfitLossReport | null>(null)

  const loadAnalytics = async (windowDays: number) => {
    setReportLoading(true)
    try {
      const [trendData, moversData, profitLossData] = await Promise.all([
        inventoryService.movementTrendReport(windowDays),
        inventoryService.moversReport(windowDays),
        inventoryService.profitLossReport(windowDays),
      ])
      setTrend(trendData)
      setMovers(moversData)
      setProfitLoss(profitLossData)
    } catch (error) {
      toast({ title: 'Report load failed', description: error instanceof Error ? error.message : 'Please try again.', variant: 'error' })
    } finally {
      setReportLoading(false)
    }
  }

  useEffect(() => {
    void loadAnalytics(days)
  }, [days])

  const exportCsv = async () => {
    setLoading(true)
    try {
      const blob = await inventoryService.exportCsvFromApi()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'inventory-report.csv'
      anchor.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  const exportExcel = async () => {
    setLoading(true)
    try {
      const blob = await inventoryService.exportExcelFromApi()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'inventory-report.xlsx'
      anchor.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  const exportQrs = async () => {
    const response = await inventoryService.list({ page: 1, pageSize: 50 })
    for (const item of response.data) {
      const dataUrl = await QRCode.toDataURL(item.qrValue)
      const anchor = document.createElement('a')
      anchor.href = dataUrl
      anchor.download = `${item.sku}.png`
      anchor.click()
    }
  }

  const trendSparkline = useMemo(() => {
    if (!trend?.series.length) return ''
    const values = trend.series.map((row) => row.total)
    const max = Math.max(...values, 1)
    return values.map((value) => '▁▂▃▄▅▆▇█'[Math.min(7, Math.floor((value / max) * 7))]).join('')
  }, [trend])

  return <div className="space-y-6"><Card className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Reports</h2><div className="flex flex-wrap items-center gap-2"><label className="text-sm text-slate-600" htmlFor="days-window">Window</label><select id="days-window" value={days} onChange={(event) => setDays(Number(event.target.value))} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option><option value={180}>Last 180 days</option></select><Button variant="outline" onClick={() => void loadAnalytics(days)} disabled={reportLoading}>{reportLoading ? 'Refreshing...' : 'Refresh'}</Button></div></div>{canExport ? <div className="flex flex-wrap gap-2"><Button onClick={exportCsv} disabled={loading}>{loading ? 'Exporting...' : 'Export Inventory CSV'}</Button><Button variant="outline" onClick={exportExcel} disabled={loading}>Export Inventory Excel</Button><Button variant="outline" onClick={exportQrs}>Export QR Codes</Button></div> : null}</Card><Card className="space-y-3"><h3 className="text-base font-semibold">Stock Movement Trend</h3><p className="text-sm text-slate-600">{trend?.series.length ?? 0} day(s) with movement in selected window.</p><p className="font-mono text-lg tracking-wide text-slate-700">{trendSparkline || 'No movement data yet'}</p><p className="text-sm text-slate-600">Profit: {currency(profitLoss?.grossProfit ?? 0)}</p><p className="text-sm text-slate-600">Fast movers: {movers?.fastMoving.length ?? 0}</p></Card></div>
}

