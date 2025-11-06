import api from './api'

export interface Payment {
  payment_id?: number
  allocation_id: number
  seller_id: number
  amount: number
  payment_method: 'mobile_money' | 'bank_transfer' | 'cash' | 'card'
  payment_reference?: string
  phone_number?: string
  transaction_id?: string
  payment_date: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  receipt_url?: string
  notes?: string
  created_at?: string
}

export const paymentService = {
  getAll: async (params?: { seller_id?: number; status?: string; start_date?: string; end_date?: string }) => {
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

  getSellerPayments: async (sellerId: number) => {
    const response = await api.get(`/payments/seller/${sellerId}`)
    return response.data
  },

  generateReceipt: async (paymentId: number) => {
    const response = await api.get(`/payments/${paymentId}/receipt`, { responseType: 'blob' })
    return response.data
  },
}


