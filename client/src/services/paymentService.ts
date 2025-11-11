import api from './api'

export interface Payment {
  payment_id?: number
  allocation_id: number
  seller_id: number
  amount: number
  payment_method: 'mobile_money' | 'bank_transfer' | 'cash' | 'card'
  payment_reference?: string
  payment_period_start?: string
  payment_period_end?: string
  mobile_money_number?: string
  mobile_money_provider?: string
  transaction_id?: string
  payment_date: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  processed_by?: number
  notes?: string
  created_at?: string
}

export const paymentService = {
  getAll: async (params?: { 
    seller_id?: number
    allocation_id?: number
    status?: string
    payment_method?: string
    date_from?: string
    date_to?: string
    limit?: number
    offset?: number
  }) => {
    const response = await api.get('/payments', { params })
    return response.data
  },

  getById: async (id: number) => {
    const response = await api.get(`/payments/${id}`)
    return response.data
  },

  create: async (payment: Payment) => {
    const response = await api.post('/payments', payment)
    return response.data
  },

  update: async (id: number, payment: Partial<Payment>) => {
    const response = await api.put(`/payments/${id}`, payment)
    return response.data
  },

  updateStatus: async (id: number, status: string) => {
    const response = await api.patch(`/payments/${id}/status`, { status })
    return response.data
  },

  getTotalRevenue: async (params?: { date_from?: string; date_to?: string }) => {
    const response = await api.get('/payments/revenue/total', { params })
    return response.data
  },

  getRevenueByZone: async (params?: { date_from?: string; date_to?: string }) => {
    const response = await api.get('/payments/revenue/by-zone', { params })
    return response.data
  },

  getRevenueByMethod: async (params?: { date_from?: string; date_to?: string }) => {
    const response = await api.get('/payments/revenue/by-method', { params })
    return response.data
  },

  getSellerPayments: async (sellerId: number, params?: { start_date?: string; end_date?: string }) => {
    const response = await api.get('/payments', { 
      params: { seller_id: sellerId, ...params } 
    })
    return response.data
  },

  generateReceipt: async (paymentId: number) => {
    // Note: This endpoint might not exist in backend, but keeping for compatibility
    try {
      const response = await api.get(`/payments/${paymentId}/receipt`, { responseType: 'blob' })
      return response.data
    } catch (error) {
      console.error('Receipt generation not available')
      throw error
    }
  },
}


