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
  // Get all payments with optional filters
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
    try {
      const response = await api.get('/payments', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching payments:', error)
      throw error
    }
  },

  // Get payment by ID
  getById: async (id: number) => {
    try {
      const response = await api.get(`/payments/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching payment with ID ${id}:`, error)
      throw error
    }
  },

  // Create a new payment
  create: async (payment: Payment) => {
    try {
      const response = await api.post('/payments', payment)
      return response.data
    } catch (error) {
      console.error('Error creating payment:', error)
      throw error
    }
  },

  // Update payment details
  update: async (id: number, payment: Partial<Payment>) => {
    try {
      const response = await api.put(`/payments/${id}`, payment)
      return response.data
    } catch (error) {
      console.error(`Error updating payment with ID ${id}:`, error)
      throw error
    }
  },

  // Update payment status
  updateStatus: async (id: number, status: Payment['status']) => {
    try {
      const response = await api.patch(`/payments/${id}/status`, { status })
      return response.data
    } catch (error) {
      console.error(`Error updating status of payment with ID ${id}:`, error)
      throw error
    }
  },

  // Get total revenue
  getTotalRevenue: async (params?: { date_from?: string; date_to?: string }) => {
    try {
      const response = await api.get('/payments/revenue/total', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching total revenue:', error)
      throw error
    }
  },

  // Revenue by zone
  getRevenueByZone: async (params?: { date_from?: string; date_to?: string }) => {
    try {
      const response = await api.get('/payments/revenue/by-zone', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching revenue by zone:', error)
      throw error
    }
  },

  // Revenue by payment method
  getRevenueByMethod: async (params?: { date_from?: string; date_to?: string }) => {
    try {
      const response = await api.get('/payments/revenue/by-method', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching revenue by method:', error)
      throw error
    }
  },

  // Get payments for a specific seller
  getSellerPayments: async (sellerId: number, params?: { start_date?: string; end_date?: string }) => {
    try {
      const response = await api.get('/payments', { params: { seller_id: sellerId, ...params } })
      return response.data
    } catch (error) {
      console.error(`Error fetching payments for seller ID ${sellerId}:`, error)
      throw error
    }
  },

  // Generate receipt PDF
  generateReceipt: async (paymentId: number) => {
    try {
      const response = await api.get(`/payments/${paymentId}/receipt`, { responseType: 'blob' })
      return response.data
    } catch (error) {
      console.error(`Receipt generation not available for payment ID ${paymentId}:`, error)
      throw error
    }
  },

  // Initiate Lanari mobile money payment (USSD/push) -> returns pending/failed
  lanariProcess: async (payload: {
    allocation_id: number
    seller_id: number
    amount: number
    customer_phone: string
    payment_period_start?: string
    payment_period_end?: string
    notes?: string
  }) => {
    try {
      const response = await api.post('/payments/lanari/process', payload)
      return response.data
    } catch (error) {
      console.error('Error initiating Lanari payment:', error)
      throw error
    }
  },

  // Optional: auto mode (completes immediately if provider confirms)
  lanariProcessAuto: async (payload: {
    allocation_id: number
    seller_id: number
    amount: number
    customer_phone: string
    payment_period_start?: string
    payment_period_end?: string
    notes?: string
  }) => {
    try {
      const response = await api.post('/payments/lanari/process-auto', payload)
      return response.data
    } catch (error) {
      console.error('Error initiating Lanari auto payment:', error)
      throw error
    }
  },
}
