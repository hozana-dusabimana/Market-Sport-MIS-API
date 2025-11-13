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
  async getOccupancyReport(startDate: string, endDate: string): Promise<Report[]> {
    try {
      const { data } = await api.get('/reports/occupancy', {
        params: { start_date: startDate, end_date: endDate },
      })
      return data
    } catch (error) {
      console.error('Error fetching occupancy report:', error)
      throw error
    }
  },

  async getPaymentReport(startDate: string, endDate: string): Promise<Report[]> {
    try {
      const { data } = await api.get('/reports/payments', {
        params: { start_date: startDate, end_date: endDate },
      })
      return data
    } catch (error) {
      console.error('Error fetching payment report:', error)
      throw error
    }
  },

  async getPerformanceReport(startDate: string, endDate: string): Promise<Report[]> {
    try {
      const { data } = await api.get('/reports/performance', {
        params: { start_date: startDate, end_date: endDate },
      })
      return data
    } catch (error) {
      console.error('Error fetching performance report:', error)
      throw error
    }
  },

  async getDailyReport(date: string): Promise<Report> {
    try {
      const { data } = await api.get('/reports/daily', { params: { date } })
      return data
    } catch (error) {
      console.error('Error fetching daily report:', error)
      throw error
    }
  },

  async getWeeklyReport(weekStart: string): Promise<Report> {
    try {
      const { data } = await api.get('/reports/weekly', { params: { week_start: weekStart } })
      return data
    } catch (error) {
      console.error('Error fetching weekly report:', error)
      throw error
    }
  },

  async getMonthlyReport(month: string, year: string): Promise<Report> {
    try {
      const { data } = await api.get('/reports/monthly', { params: { month, year } })
      return data
    } catch (error) {
      console.error('Error fetching monthly report:', error)
      throw error
    }
  },

  async exportReport(reportType: string, params: Record<string, any>): Promise<Blob> {
    try {
      const { data } = await api.get(`/reports/export/${reportType}`, {
        params,
        responseType: 'blob',
      })
      return data
    } catch (error) {
      console.error('Error exporting report:', error)
      throw error
    }
  },
}
