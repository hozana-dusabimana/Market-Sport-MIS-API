import api from './api'

export interface Report {
  report_id?: number
  report_type: 'daily' | 'weekly' | 'monthly' | 'custom'
  start_date: string
  end_date: string
  generated_at?: string
  data?: any
}

export const reportService = {
  async getOccupancyReport(_startDate: string, _endDate: string): Promise<any> {
    // Backend provides spaces report with counts by status; date range not supported for spaces
    try {
      const { data } = await api.get('/reports/spaces')
      const payload = data?.data || data || {}
      const counts = payload.countsByStatus || {}
      return {
        occupied: counts.occupied || 0,
        available: counts.available || 0,
      }
    } catch (error) {
      console.error('Error fetching occupancy report:', error)
      throw error
    }
  },

  async getPaymentReport(startDate: string, endDate: string): Promise<any> {
    try {
      const { data } = await api.get('/reports/payments', {
        params: { date_from: startDate, date_to: endDate },
      })
      const payload = data?.data || data || {}
      const rows: Array<{ payment_date?: string; amount?: number; payment_method?: string }> = payload.rows || []

      // Aggregate trend by date (yyyy-MM-dd)
      const byDateMap: Record<string, number> = {}
      for (const r of rows) {
        const dateKey = (r.payment_date || '').substring(0, 10)
        if (!dateKey) continue
        byDateMap[dateKey] = (byDateMap[dateKey] || 0) + Number(r.amount || 0)
      }
      const trend = Object.entries(byDateMap)
        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
        .map(([date, amount]) => ({ date, amount }))

      // Aggregate by payment method
      const byMethodMap: Record<string, number> = {}
      for (const r of rows) {
        const method = r.payment_method || 'Unknown'
        byMethodMap[method] = (byMethodMap[method] || 0) + Number(r.amount || 0)
      }
      const by_method = Object.entries(byMethodMap).map(([method, amount]) => ({ method, amount }))

      return { data: trend, by_method }
    } catch (error) {
      console.error('Error fetching payment report:', error)
      throw error
    }
  },

  async getPerformanceReport(startDate: string, endDate: string): Promise<Report[]> {
    try {
      // Not implemented on backend; proxy to overview
      const { data } = await api.get('/reports/overview', {
        params: { date_from: startDate, date_to: endDate },
      })
      return data?.data || data
    } catch (error) {
      console.error('Error fetching performance report:', error)
      throw error
    }
  },

  async getDailyReport(date: string): Promise<Report> {
    try {
      // Not implemented; proxy to overview using a single day window
      const { data } = await api.get('/reports/overview', { params: { date_from: date, date_to: date } })
      return data?.data || data
    } catch (error) {
      console.error('Error fetching daily report:', error)
      throw error
    }
  },

  async getWeeklyReport(weekStart: string): Promise<Report> {
    try {
      // Not implemented; proxy to overview using week window
      const { data } = await api.get('/reports/overview', { params: { date_from: weekStart } })
      return data?.data || data
    } catch (error) {
      console.error('Error fetching weekly report:', error)
      throw error
    }
  },

  async getMonthlyReport(month: string, year: string): Promise<Report> {
    try {
      // Not implemented; proxy to overview for the month range (first day to last day)
      const m = String(month).padStart(2, '0')
      const from = `${year}-${m}-01`
      const to = `${year}-${m}-31`
      const { data } = await api.get('/reports/overview', { params: { date_from: from, date_to: to } })
      return data?.data || data
    } catch (error) {
      console.error('Error fetching monthly report:', error)
      throw error
    }
  },

  async exportReport(reportType: string, params: Record<string, any>): Promise<Blob> {
    try {
      // Not implemented; return empty blob for now to avoid UI crash
      return new Blob()
    } catch (error) {
      console.error('Error exporting report:', error)
      throw error
    }
  },
}
