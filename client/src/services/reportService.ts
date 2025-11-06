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
  getOccupancyReport: async (startDate: string, endDate: string) => {
    const response = await api.get('/reports/occupancy', {
      params: { start_date: startDate, end_date: endDate },
    })
    return response.data
  },

  getPaymentReport: async (startDate: string, endDate: string) => {
    const response = await api.get('/reports/payments', {
      params: { start_date: startDate, end_date: endDate },
    })
    return response.data
  },

  getPerformanceReport: async (startDate: string, endDate: string) => {
    const response = await api.get('/reports/performance', {
      params: { start_date: startDate, end_date: endDate },
    })
    return response.data
  },

  getDailyReport: async (date: string) => {
    const response = await api.get('/reports/daily', { params: { date } })
    return response.data
  },

  getWeeklyReport: async (weekStart: string) => {
    const response = await api.get('/reports/weekly', { params: { week_start: weekStart } })
    return response.data
  },

  getMonthlyReport: async (month: string, year: string) => {
    const response = await api.get('/reports/monthly', { params: { month, year } })
    return response.data
  },

  exportReport: async (reportType: string, params: any) => {
    const response = await api.get(`/reports/export/${reportType}`, {
      params,
      responseType: 'blob',
    })
    return response.data
  },
}


