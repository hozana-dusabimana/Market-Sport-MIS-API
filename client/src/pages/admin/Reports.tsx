import { useState } from 'react'
import { useQuery } from 'react-query'
import { reportService } from '../../services/reportService'
import { userService } from '../../services/userService'
import { sellerService } from '../../services/sellerService'
import { paymentService } from '../../services/paymentService'
import { allocationService } from '../../services/allocationService'
import { Download } from 'lucide-react'
import { format, subDays, startOfWeek } from 'date-fns'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const Reports = () => {
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [weekStart, setWeekStart] = useState(format(startOfWeek(new Date()), 'yyyy-MM-dd'))
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))

  const { data: dailyReport, isLoading: dailyLoading } = useQuery(
    ['daily-report', date],
    () => reportService.getDailyReport(date),
    { enabled: reportType === 'daily', retry: false }
  )

  const { data: weeklyReport, isLoading: weeklyLoading } = useQuery(
    ['weekly-report', weekStart],
    () => reportService.getWeeklyReport(weekStart),
    { enabled: reportType === 'weekly', retry: false }
  )

  const { data: monthlyReport, isLoading: monthlyLoading } = useQuery(
    ['monthly-report', month],
    () => {
      const [year, monthNum] = month.split('-')
      return reportService.getMonthlyReport(monthNum, year)
    },
    { enabled: reportType === 'monthly', retry: false }
  )

  const { data: occupancyReportData } = useQuery(
    ['occupancy-report', reportType],
    () =>
      reportService.getOccupancyReport(
        format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        format(new Date(), 'yyyy-MM-dd')
      ),
    { retry: false }
  )

  const { data: paymentReportData } = useQuery(
    ['payment-report', reportType],
    () =>
      reportService.getPaymentReport(
        format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        format(new Date(), 'yyyy-MM-dd')
      ),
    { retry: false }
  )

  // Extract data from backend responses
  const occupancyReport = occupancyReportData?.data || occupancyReportData || { occupied: 0, available: 0 }
  const paymentReport = paymentReportData?.data || paymentReportData || { data: [], by_method: [] }

  const { data: userStatsData } = useQuery('user-statistics', () => userService.getStatistics(), { retry: false })
  const { data: sellerCountsData } = useQuery('seller-status-count', () => sellerService.getCountByStatus(), { retry: false })
  const dateFrom = format(subDays(new Date(), 30), 'yyyy-MM-dd')
  const dateTo = format(new Date(), 'yyyy-MM-dd')
  const { data: revenueByZoneData } = useQuery(
    ['revenue-by-zone', dateFrom, dateTo],
    () => paymentService.getRevenueByZone({ date_from: dateFrom, date_to: dateTo }),
    { retry: false }
  )
  const { data: allocationsData } = useQuery('allocations', () => allocationService.getAll(), { retry: false })

  // New detailed reports using backend report controller
  const { data: revenueReportData } = useQuery(
    ['admin-revenue-report', dateFrom, dateTo],
    () => reportService.getRevenueReport(dateFrom, dateTo),
    { retry: false }
  )

  const { data: sellerReportData } = useQuery(
    ['admin-seller-report', dateFrom, dateTo],
    () => reportService.getSellerReport(dateFrom, dateTo, 10),
    { retry: false }
  )

  const { data: zoneStatisticsData } = useQuery(
    ['admin-zone-statistics', dateFrom, dateTo],
    () => reportService.getZoneStatistics(dateFrom, dateTo),
    { retry: false }
  )

  const { data: allocationSummaryData } = useQuery(
    ['admin-allocation-summary', dateFrom, dateTo],
    () => reportService.getAllocationSummary(dateFrom, dateTo),
    { retry: false }
  )

  const isLoading = dailyLoading || weeklyLoading || monthlyLoading

  const handleExport = async (type: string) => {
    try {
      const params =
        reportType === 'daily'
          ? { date }
          : reportType === 'weekly'
          ? { week_start: weekStart }
          : { month: month.split('-')[1], year: month.split('-')[0] }

      const blob = await reportService.exportReport(type, params)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-report-${Date.now()}.pdf`
      a.click()
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
  const safeNumber = (val: unknown) => Number(val || 0) || 0
  const toNumber = (v: unknown) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  }
  const asArray = <T,>(v: unknown): T[] => {
    if (Array.isArray(v)) return v as T[]
    const d = (v as { data?: unknown })?.data
    return Array.isArray(d) ? (d as T[]) : []
  }
  const userStats = (userStatsData?.data || userStatsData || {}) as Record<string, unknown>
  const sellerCounts = (sellerCountsData?.data || sellerCountsData || {}) as Record<string, unknown>
  const revenueByZone = asArray<{ zone_name?: string; total_amount?: number; total?: number }>(revenueByZoneData)
  const allocationsList = asArray<{ status?: string }>(allocationsData)
  const userTypeSeries = ['admin', 'manager', 'seller'].map((t) => ({ type: t, count: toNumber(userStats[`total_${t}s`]) }))
  const activeInactiveSeries = ['active', 'inactive', 'suspended'].map((s) => ({ status: s, count: toNumber(userStats[`${s}_users`]) }))
  const sellerStatusSeries = Object.entries(sellerCounts).map(([status, val]) => ({ status, count: toNumber(val) }))
  const revenueZoneSeries = revenueByZone.map((r) => ({ zone: String(r.zone_name || 'Unknown'), amount: toNumber(r.total_amount ?? r.total) }))
  const allocationStatusCounts = (() => {
    const m: Record<string, number> = {}
    for (const a of allocationsList) {
      const k = String(a.status || 'unknown')
      m[k] = (m[k] || 0) + 1
    }
    return Object.entries(m).map(([status, count]) => ({ status, count }))
  })()

  // Normalize new report payloads from backend
  const revenueReportRaw: any = revenueReportData?.data || revenueReportData || {}
  const revenueSummary = revenueReportRaw?.summary || {}
  const revenueBreakdown: any[] = Array.isArray(revenueReportRaw?.breakdown) ? revenueReportRaw.breakdown : []

  const sellerReportRaw: any = sellerReportData?.data || sellerReportData || {}
  const topSellers: any[] = Array.isArray(sellerReportRaw?.sellers) ? sellerReportRaw.sellers : []
  const sellerReportSummary = sellerReportRaw?.summary || {}

  const zoneStatsRaw: any = zoneStatisticsData?.data || zoneStatisticsData || {}
  const zoneStatsZones: any[] = Array.isArray(zoneStatsRaw?.zones) ? zoneStatsRaw.zones : []
  const zoneStatsSummary = zoneStatsRaw?.summary || {}

  const allocationSummaryRaw: any = allocationSummaryData?.data || allocationSummaryData || {}
  const allocationSummaryZones: any[] = Array.isArray(allocationSummaryRaw?.zones) ? allocationSummaryRaw.zones : []
  const allocationSummaryTotals = allocationSummaryRaw?.summary || {}

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <div className="flex space-x-2">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as 'daily' | 'weekly' | 'monthly')}
            className="input w-auto"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <button
            onClick={() => handleExport(reportType)}
            className="btn-primary flex items-center space-x-2"
          >
            <Download size={18} />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="mb-6 card">
        <div className="flex items-center space-x-4">
          {reportType === 'daily' && (
            <div>
              <label className="label">Select Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input"
              />
            </div>
          )}
          {reportType === 'weekly' && (
            <div>
              <label className="label">Week Start</label>
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="input"
              />
            </div>
          )}
          {reportType === 'monthly' && (
            <div>
              <label className="label">Month</label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="input"
              />
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading report...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Occupancy Rate</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Occupied', value: occupancyReport?.occupied || occupancyReport?.data?.occupied || 0 },
                    { name: 'Available', value: occupancyReport?.available || occupancyReport?.data?.available || 0 },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[0, 1].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Payment Trends</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={Array.isArray(paymentReport) ? paymentReport : (paymentReport?.data || [])}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="amount" stroke="#0ea5e9" name="Amount ($)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Revenue by Payment Method</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={paymentReport?.by_method || paymentReport?.data?.by_method || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="method" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="amount" fill="#0ea5e9" name="Amount ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Revenue by Zone</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueZoneSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="zone" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="amount" fill="#10b981" name="Amount ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Seller Status Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sellerStatusSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8b5cf6" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Allocations by Status</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={allocationStatusCounts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#f59e0b" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Users Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-gray-900">{userTypeSeries.find(u => u.type === 'admin')?.count || 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Managers</p>
                <p className="text-2xl font-bold text-gray-900">{userTypeSeries.find(u => u.type === 'manager')?.count || 0}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Sellers</p>
                <p className="text-2xl font-bold text-gray-900">{userTypeSeries.find(u => u.type === 'seller')?.count || 0}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-emerald-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{activeInactiveSeries.find(s => s.status === 'active')?.count || 0}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Inactive Users</p>
                <p className="text-2xl font-bold text-gray-900">{activeInactiveSeries.find(s => s.status === 'inactive')?.count || 0}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Suspended Users</p>
                <p className="text-2xl font-bold text-gray-900">{activeInactiveSeries.find(s => s.status === 'suspended')?.count || 0}</p>
              </div>
            </div>
          </div>

          {/* Revenue summary from backend revenue report */}
          {revenueBreakdown.length > 0 && (
            <div className="card lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Revenue Report (Last 30 Days)</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${safeNumber(revenueSummary.total_revenue).toFixed(2)}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">{safeNumber(revenueSummary.total_transactions)}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Average Transaction</p>
                  <p className="text-2xl font-bold text-gray-900">${safeNumber(revenueSummary.average_transaction).toFixed(2)}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="py-2 pr-4">Payment Method</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4 text-right">Transactions</th>
                      <th className="py-2 pr-4 text-right">Total Amount</th>
                      <th className="py-2 pr-4 text-right">Average</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueBreakdown.map((row, idx) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="py-2 pr-4 capitalize">{String(row.payment_method || 'Unknown').replace('_', ' ')}</td>
                        <td className="py-2 pr-4 capitalize">{String(row.status || 'unknown')}</td>
                        <td className="py-2 pr-4 text-right">{safeNumber(row.transaction_count)}</td>
                        <td className="py-2 pr-4 text-right">${safeNumber(row.total_amount).toFixed(2)}</td>
                        <td className="py-2 pr-4 text-right">${safeNumber(row.average_amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top sellers report */}
          {topSellers.length > 0 && (
            <div className="card lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Top Sellers (Last 30 Days)</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Sellers</p>
                  <p className="text-2xl font-bold text-gray-900">{safeNumber(sellerReportSummary.total_sellers)}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${safeNumber(sellerReportSummary.total_revenue).toFixed(2)}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Allocations</p>
                  <p className="text-2xl font-bold text-gray-900">{safeNumber(sellerReportSummary.total_allocations)}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Avg Revenue / Seller</p>
                  <p className="text-2xl font-bold text-gray-900">${safeNumber(sellerReportSummary.average_revenue_per_seller).toFixed(2)}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="py-2 pr-4">Seller</th>
                      <th className="py-2 pr-4">Business</th>
                      <th className="py-2 pr-4">Phone</th>
                      <th className="py-2 pr-4">Email</th>
                      <th className="py-2 pr-4 text-right">Allocations</th>
                      <th className="py-2 pr-4 text-right">Payments</th>
                      <th className="py-2 pr-4 text-right">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSellers.map((s) => (
                      <tr key={s.seller_id} className="border-b last:border-0">
                        <td className="py-2 pr-4">{s.full_name || 'N/A'}</td>
                        <td className="py-2 pr-4">{s.business_name || 'N/A'}</td>
                        <td className="py-2 pr-4">{s.phone_number || '-'}</td>
                        <td className="py-2 pr-4">{s.email || '-'}</td>
                        <td className="py-2 pr-4 text-right">{safeNumber(s.total_allocations)}</td>
                        <td className="py-2 pr-4 text-right">{safeNumber(s.total_payments)}</td>
                        <td className="py-2 pr-4 text-right">${safeNumber(s.total_revenue).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Zone statistics report */}
          {zoneStatsZones.length > 0 && (
            <div className="card lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Zone Statistics (Last 30 Days)</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Zones</p>
                  <p className="text-2xl font-bold text-gray-900">{safeNumber(zoneStatsSummary.total_zones)}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${safeNumber(zoneStatsSummary.total_revenue).toFixed(2)}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Allocations</p>
                  <p className="text-2xl font-bold text-gray-900">{safeNumber(zoneStatsSummary.total_allocations)}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Unique Sellers</p>
                  <p className="text-2xl font-bold text-gray-900">{safeNumber(zoneStatsSummary.total_unique_sellers)}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="py-2 pr-4">Zone</th>
                      <th className="py-2 pr-4 text-right">Total Spaces</th>
                      <th className="py-2 pr-4 text-right">Available</th>
                      <th className="py-2 pr-4 text-right">Occupied</th>
                      <th className="py-2 pr-4 text-right">Allocations</th>
                      <th className="py-2 pr-4 text-right">Unique Sellers</th>
                      <th className="py-2 pr-4 text-right">Occupancy Rate</th>
                      <th className="py-2 pr-4 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zoneStatsZones.map((z) => (
                      <tr key={z.zone_id} className="border-b last:border-0">
                        <td className="py-2 pr-4">{z.zone_name}</td>
                        <td className="py-2 pr-4 text-right">{safeNumber(z.total_spaces)}</td>
                        <td className="py-2 pr-4 text-right">{safeNumber(z.available_spaces)}</td>
                        <td className="py-2 pr-4 text-right">{safeNumber(z.occupied_spaces)}</td>
                        <td className="py-2 pr-4 text-right">{safeNumber(z.total_allocations)}</td>
                        <td className="py-2 pr-4 text-right">{safeNumber(z.unique_sellers)}</td>
                        <td className="py-2 pr-4 text-right">{safeNumber(z.occupancy_rate).toFixed(2)}%</td>
                        <td className="py-2 pr-4 text-right">${safeNumber(z.total_revenue).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Allocation summary report */}
          {allocationSummaryZones.length > 0 && (
            <div className="card lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Allocation Summary (Last 30 Days)</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Zones</p>
                  <p className="text-2xl font-bold text-gray-900">{safeNumber(allocationSummaryTotals.total_zones)}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Allocations</p>
                  <p className="text-2xl font-bold text-gray-900">{safeNumber(allocationSummaryTotals.total_allocations)}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">{safeNumber(allocationSummaryTotals.active_allocations)}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{safeNumber(allocationSummaryTotals.pending_allocations)}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Terminated</p>
                  <p className="text-2xl font-bold text-gray-900">{safeNumber(allocationSummaryTotals.terminated_allocations)}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="py-2 pr-4">Zone</th>
                      <th className="py-2 pr-4 text-right">Total Allocations</th>
                      <th className="py-2 pr-4 text-right">Active</th>
                      <th className="py-2 pr-4 text-right">Pending</th>
                      <th className="py-2 pr-4 text-right">Terminated</th>
                      <th className="py-2 pr-4 text-right">Unique Sellers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allocationSummaryZones.map((z) => (
                      <tr key={z.zone_id} className="border-b last:border-0">
                        <td className="py-2 pr-4">{z.zone_name}</td>
                        <td className="py-2 pr-4 text-right">{safeNumber(z.total_allocations)}</td>
                        <td className="py-2 pr-4 text-right">{safeNumber(z.active_allocations)}</td>
                        <td className="py-2 pr-4 text-right">{safeNumber(z.pending_allocations)}</td>
                        <td className="py-2 pr-4 text-right">{safeNumber(z.terminated_allocations)}</td>
                        <td className="py-2 pr-4 text-right">{safeNumber(z.unique_sellers)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(dailyReport || weeklyReport || monthlyReport) && (
            <div className="card lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Report Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['daily', 'weekly', 'monthly'].map(
                  (type) =>
                    reportType === type &&
                    (() => {
                      type SummaryData = { total_revenue?: number; total_payments?: number; active_allocations?: number }
                      const raw: unknown =
                        type === 'daily' ? dailyReport : type === 'weekly' ? weeklyReport : monthlyReport
                      const container = raw as { data?: SummaryData }
                      const data: SummaryData | undefined = container?.data ?? (raw as SummaryData | undefined)
                      if (!data) return null
                      return (
                        <>
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">Total Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">${safeNumber(data.total_revenue).toFixed(2)}</p>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">Total Payments</p>
                            <p className="text-2xl font-bold text-gray-900">{safeNumber(data.total_payments)}</p>
                          </div>
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">Active Allocations</p>
                            <p className="text-2xl font-bold text-gray-900">{safeNumber(data.active_allocations)}</p>
                          </div>
                        </>
                      )
                    })()
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Reports


