import { useState } from 'react'
import { useQuery } from 'react-query'
import { reportService } from '../../services/reportService'
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

const ManagerReports = () => {
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [weekStart, setWeekStart] = useState(format(startOfWeek(new Date()), 'yyyy-MM-dd'))
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))

  // === Queries ===
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

  // === Safe Data Extraction ===
  const occupancyReport = occupancyReportData?.data || occupancyReportData || { occupied: 0, available: 0 }
  const paymentReport = paymentReportData?.data || paymentReportData || { data: [], by_method: [] }

  const isLoading = dailyLoading || weeklyLoading || monthlyLoading

  // === Export Function ===
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
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  // === Helper Function ===
  const safeNumber = (val: any) => Number(val) || 0

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <div className="flex space-x-2">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
            className="input w-auto"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <button
            onClick={() => handleExport(reportType)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Download size={18} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Date Selection */}
      <div className="card mb-6">
        <div className="flex items-center space-x-4">
          {reportType === 'daily' && (
            <div>
              <label className="label">Select Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
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
          {/* Occupancy Chart */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Occupancy Rate</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Occupied', value: safeNumber(occupancyReport?.occupied) },
                    { name: 'Available', value: safeNumber(occupancyReport?.available) },
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  dataKey="value"
                >
                  {[0, 1].map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Payment Trend Chart */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Payment Trends</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={Array.isArray(paymentReport) ? paymentReport : paymentReport?.data || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="amount" stroke="#0ea5e9" name="Amount ($)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue by Method */}
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

          {/* Summary Section */}
          {(dailyReport || weeklyReport || monthlyReport) && (
            <div className="card lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Report Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['daily', 'weekly', 'monthly'].map(
                  (type) =>
                    reportType === type &&
                    (() => {
                      const data =
                        type === 'daily'
                          ? dailyReport?.data
                          : type === 'weekly'
                          ? weeklyReport?.data
                          : monthlyReport?.data
                      if (!data) return null
                      return (
                        <>
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">Total Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">
                              ${safeNumber(data.total_revenue).toFixed(2)}
                            </p>
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

export default ManagerReports
