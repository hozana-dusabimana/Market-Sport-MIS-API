import db from '../config/database.js';
import { Payment } from '../models/Payment.model.js';

class PaymentController {
  // Get all payments with filters
  async getAllPayments(req, res) {
    try {
      const filters = {
        seller_id: req.query.seller_id,
        allocation_id: req.query.allocation_id,
        status: req.query.status,
        payment_method: req.query.payment_method,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        limit: req.query.limit ? parseInt(req.query.limit) : 100,
        offset: req.query.offset ? parseInt(req.query.offset) : 0
      };

      const payments = await Payment.findAll(filters);

      res.json({
        success: true,
        data: payments,
        count: payments.length
      });
    } catch (error) {
      console.error('Get all payments error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch payments', error: error.message });
    }
  }

  // Get payment by ID
  async getPaymentById(req, res) {
    try {
      const { id } = req.params;
      const payment = await Payment.findById(id);

      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }

      res.json({
        success: true,
        data: payment
      });
    } catch (error) {
      console.error('Get payment by ID error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch payment', error: error.message });
    }
  }

  // Create payment
  async createPayment(req, res) {
    try {
      const {
        allocation_id,
        seller_id,
        amount,
        payment_date,
        payment_method,
        payment_reference,
        payment_period_start,
        payment_period_end,
        mobile_money_number,
        mobile_money_provider,
        transaction_id,
        notes
      } = req.body;

      if (!allocation_id || !seller_id || !amount) {
        return res.status(400).json({
          success: false,
          message: 'Allocation ID, Seller ID, and Amount are required'
        });
      }

      const paymentId = await Payment.create({
        allocation_id,
        seller_id,
        amount,
        payment_date: payment_date || new Date(),
        payment_method,
        payment_reference,
        payment_period_start,
        payment_period_end,
        status: 'completed',
        processed_by: req.user?.user_id,
        mobile_money_number,
        mobile_money_provider,
        transaction_id,
        notes
      });

      res.status(201).json({
        success: true,
        message: 'Payment created successfully',
        data: { payment_id: paymentId }
      });
    } catch (error) {
      console.error('Create payment error:', error);
      res.status(500).json({ success: false, message: 'Failed to create payment', error: error.message });
    }
  }

  // Update payment
  async updatePayment(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const payment = await Payment.findById(id);
      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }

      const updated = await Payment.update(id, updates);

      if (!updated) {
        return res.status(500).json({ success: false, message: 'Failed to update payment' });
      }

      res.json({ success: true, message: 'Payment updated successfully' });
    } catch (error) {
      console.error('Update payment error:', error);
      res.status(500).json({ success: false, message: 'Failed to update payment', error: error.message });
    }
  }

  // Update payment status
  async updatePaymentStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ success: false, message: 'Status is required' });
      }

      const updated = await Payment.updateStatus(id, status);

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }

      res.json({ success: true, message: 'Payment status updated successfully' });
    } catch (error) {
      console.error('Update payment status error:', error);
      res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
    }
  }

  // Get total revenue
  async getTotalRevenue(req, res) {
    try {
      const filters = {
        date_from: req.query.date_from,
        date_to: req.query.date_to
      };

      const total = await Payment.getTotalRevenue(filters);

      res.json({
        success: true,
        data: { total_revenue: total }
      });
    } catch (error) {
      console.error('Get total revenue error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch revenue', error: error.message });
    }
  }

  // Get revenue by zone
  async getRevenueByZone(req, res) {
    try {
      const filters = {
        date_from: req.query.date_from,
        date_to: req.query.date_to
      };

      const revenue = await Payment.getRevenueByZone(filters);

      res.json({
        success: true,
        data: revenue,
        count: revenue.length
      });
    } catch (error) {
      console.error('Get revenue by zone error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch revenue by zone', error: error.message });
    }
  }

  // Get revenue by payment method
  async getRevenueByMethod(req, res) {
    try {
      const filters = {
        date_from: req.query.date_from,
        date_to: req.query.date_to
      };

      const revenue = await Payment.getRevenueByMethod(filters);

      res.json({
        success: true,
        data: revenue,
        count: revenue.length
      });
    } catch (error) {
      console.error('Get revenue by method error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch revenue by method', error: error.message });
    }
  }
}

export default new PaymentController();
