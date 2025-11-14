import db from '../config/database.js';
import { Payment } from '../models/Payment.model.js';
import lanariPaymentService from '../services/lanariPaymentService.js';
import NotificationService from '../services/notificationService.js';

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

      // Auto-scope to manager's market when requester is a manager
      const managerId = req.user?.manager_id || req.user?.profile?.manager_id;
      if (req.user?.user_type === 'manager' && managerId) {
        filters.manager_id = managerId;
      }

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

      // Enforce ownership for managers using payment.manager_id (from zone)
      const managerId = req.user?.manager_id || req.user?.profile?.manager_id;
      if (req.user?.user_type === 'manager' && managerId && payment.manager_id !== managerId) {
        return res.status(403).json({ success: false, message: 'Forbidden: payment not owned by manager' });
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

  // Create payment (Manual/Direct)
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

      // Validate manager ownership of allocation for managers
      if (req.user?.user_type === 'manager') {
        const managerId = req.user?.manager_id || req.user?.profile?.manager_id;
        if (!managerId) {
          return res.status(403).json({ success: false, message: 'Forbidden: manager id missing' });
        }
        const [allocRows] = await db.query(
          `SELECT z.manager_id
           FROM space_allocations sa
           JOIN spaces sp ON sa.space_id = sp.space_id
           JOIN zones z ON sp.zone_id = z.zone_id
           WHERE sa.allocation_id = ? AND sa.seller_id = ?
           LIMIT 1`,
          [allocation_id, seller_id]
        );
        const allocManagerId = allocRows?.[0]?.manager_id;
        if (!allocManagerId || allocManagerId !== managerId) {
          return res.status(403).json({ success: false, message: 'Forbidden: cannot create payment for another manager\'s allocation' });
        }
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

      // Get seller user_id for real-time updates
      const [sellerRows] = await db.query('SELECT user_id FROM sellers WHERE seller_id = ?', [seller_id]);
      const sellerUserId = sellerRows[0]?.user_id;

      // Auto-create notification
      await NotificationService.createPaymentNotification({
        payment_id: paymentId,
        allocation_id,
        seller_id,
        amount,
        status: 'completed'
      }, req.user?.user_id);

      // Real-time payment update
      if (sellerUserId) {
        const socketService = (await import('../services/socketService.js')).default;
        socketService.emitPaymentCreated(sellerUserId, {
          payment_id: paymentId,
          amount,
          status: 'completed',
          payment_method
        });
      }

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

  // Process payment via Lanari API
  async processLanariPayment(req, res) {
    try {
      const {
        allocation_id,
        seller_id,
        amount,
        customer_phone,
        payment_period_start,
        payment_period_end,
        notes
      } = req.body;

      // Validate required fields
      if (!allocation_id || !seller_id || !amount || !customer_phone) {
        return res.status(400).json({
          success: false,
          message: 'Allocation ID, Seller ID, Amount, and Customer Phone are required'
        });
      }

      // Verify allocation exists and belongs to seller
      const [allocation] = await db.query(
        'SELECT * FROM space_allocations WHERE allocation_id = ? AND seller_id = ?',
        [allocation_id, seller_id]
      );

      if (!allocation || allocation.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Allocation not found or does not belong to this seller'
        });
      }

      // For managers: enforce allocation ownership
      if (req.user?.user_type === 'manager') {
        const managerId = req.user?.manager_id || req.user?.profile?.manager_id;
        if (!managerId) {
          return res.status(403).json({ success: false, message: 'Forbidden: manager id missing' });
        }
        const [allocRows] = await db.query(
          `SELECT z.manager_id
           FROM space_allocations sa
           JOIN spaces sp ON sa.space_id = sp.space_id
           JOIN zones z ON sp.zone_id = z.zone_id
           WHERE sa.allocation_id = ? AND sa.seller_id = ?
           LIMIT 1`,
          [allocation_id, seller_id]
        );
        const allocManagerId = allocRows?.[0]?.manager_id;
        if (!allocManagerId || allocManagerId !== managerId) {
          return res.status(403).json({ success: false, message: 'Forbidden: cannot process payment for another manager\'s allocation' });
        }
      }

      // Format phone number for Lanari
      const formattedPhone = lanariPaymentService.formatPhoneNumber(customer_phone);

      // Call Lanari Payment API
      const lanariResponse = await lanariPaymentService.processPayment({
        amount: Math.round(amount),
        customer_phone: formattedPhone,
        description: `Market Spot Payment - Allocation #${allocation_id}`,
        currency: 'RWF',
        reference_id: `MKTS-${seller_id}-${allocation_id}-${Date.now()}`
      });

      // Check gateway response for immediate success
      const gatewaySuccess = lanariResponse.raw_response?.gateway_response?.data?.status === 'SUCCESSFUL';
      const paymentStatus = gatewaySuccess ? 'completed' : (lanariResponse.success ? 'pending' : 'failed');
      
      const paymentId = await Payment.create({
        allocation_id,
        seller_id,
        amount,
        payment_date: new Date(),
        payment_method: 'lanari_mobile_money',
        payment_reference: lanariResponse.reference_id,
        payment_period_start,
        payment_period_end,
        status: paymentStatus,
        processed_by: req.user?.user_id,
        mobile_money_number: formattedPhone,
        mobile_money_provider: 'lanari',
        transaction_id: lanariResponse.transaction_id,
        notes: notes || `Lanari Payment - ${lanariResponse.status}`
      });

      // Get seller user_id for real-time updates
      const [sellerRows] = await db.query('SELECT user_id FROM sellers WHERE seller_id = ?', [seller_id]);
      const sellerUserId = sellerRows[0]?.user_id;

      // Auto-create notification
      await NotificationService.createPaymentNotification({
        payment_id: paymentId,
        allocation_id,
        seller_id,
        amount,
        status: paymentStatus
      }, req.user?.user_id);

      // Real-time payment update
      if (sellerUserId) {
        const socketService = (await import('../services/socketService.js')).default;
        if (paymentStatus === 'completed') {
          socketService.emitPaymentCompleted(sellerUserId, {
            payment_id: paymentId,
            amount,
            status: 'completed',
            transaction_id: lanariResponse.transaction_id
          });
        } else if (paymentStatus === 'pending') {
          socketService.emitPaymentCreated(sellerUserId, {
            payment_id: paymentId,
            amount,
            status: 'pending',
            transaction_id: lanariResponse.transaction_id
          });
        } else {
          socketService.emitPaymentFailed(sellerUserId, {
            payment_id: paymentId,
            amount,
            error: lanariResponse.error || 'Payment failed'
          });
        }
      }

      res.status(201).json({
        success: true,
        message: paymentStatus === 'completed' ? 'Payment completed successfully' : 'Payment processed via Lanari',
        data: {
          payment_id: paymentId,
          transaction_id: lanariResponse.transaction_id,
          reference_id: lanariResponse.reference_id,
          status: paymentStatus,
          lanari_response: lanariResponse.raw_response
        }
      });
    } catch (error) {
      console.error('Lanari payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process Lanari payment',
        error: error.message
      });
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

      // Enforce ownership for managers via zone ownership
      const managerId = req.user?.manager_id || req.user?.profile?.manager_id;
      if (req.user?.user_type === 'manager' && managerId) {
        const [allocRows] = await db.query(
          `SELECT z.manager_id
           FROM space_allocations sa
           JOIN spaces sp ON sa.space_id = sp.space_id
           JOIN zones z ON sp.zone_id = z.zone_id
           WHERE sa.allocation_id = ?
           LIMIT 1`,
          [payment.allocation_id]
        );
        const allocManagerId = allocRows?.[0]?.manager_id;
        if (!allocManagerId || allocManagerId !== managerId) {
          return res.status(403).json({ success: false, message: 'Forbidden: payment not owned by manager' });
        }
      }

      const updated = await Payment.update(id, updates);

      if (!updated) {
        return res.status(500).json({ success: false, message: 'Failed to update payment' });
      }

      // Auto-create notification
      await NotificationService.updatePaymentNotification(id, updates, req.user?.user_id);

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

      // Enforce ownership for managers via zone ownership
      const payment = await Payment.findById(id);
      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }
      const managerId = req.user?.manager_id || req.user?.profile?.manager_id;
      if (req.user?.user_type === 'manager' && managerId && payment.manager_id !== managerId) {
        return res.status(403).json({ success: false, message: 'Forbidden: payment not owned by manager' });
      }

      const updated = await Payment.updateStatus(id, status);

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }

      // Get seller user_id for real-time updates
      const [sellerRows] = await db.query(`
        SELECT s.user_id FROM sellers s
        JOIN payments p ON s.seller_id = p.seller_id
        WHERE p.payment_id = ?
      `, [id]);
      const sellerUserId = sellerRows[0]?.user_id;

      // Auto-create notification
      await NotificationService.updatePaymentNotification(id, { status }, req.user?.user_id);

      // Real-time status update
      if (sellerUserId) {
        const socketService = (await import('../services/socketService.js')).default;
        if (status === 'completed') {
          socketService.emitPaymentCompleted(sellerUserId, {
            payment_id: id,
            status: 'completed'
          });
        } else if (status === 'failed') {
          socketService.emitPaymentFailed(sellerUserId, {
            payment_id: id,
            status: 'failed'
          });
        } else {
          socketService.emitPaymentUpdated(sellerUserId, {
            payment_id: id,
            status
          });
        }
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

  // Check payment status
  async checkPaymentStatus(req, res) {
    try {
      const { id } = req.params;
      const payment = await Payment.findById(id);

      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }

      res.json({
        success: true,
        data: {
          payment_id: id,
          status: payment.status,
          amount: payment.amount,
          transaction_id: payment.transaction_id,
          payment_date: payment.payment_date
        }
      });
    } catch (error) {
      console.error('Check payment status error:', error);
      res.status(500).json({ success: false, message: 'Failed to check payment status', error: error.message });
    }
  }

  // Confirm payment manually
  async confirmPayment(req, res) {
    try {
      const { id } = req.params;
      const payment = await Payment.findById(id);

      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }

      if (payment.status === 'completed') {
        return res.json({ success: true, message: 'Payment already confirmed' });
      }

      // Update payment status to completed
      const updated = await Payment.updateStatus(id, 'completed');

      if (!updated) {
        return res.status(500).json({ success: false, message: 'Failed to confirm payment' });
      }

      // Get seller user_id for real-time updates
      const [sellerRows] = await db.query(`
        SELECT s.user_id FROM sellers s
        JOIN payments p ON s.seller_id = p.seller_id
        WHERE p.payment_id = ?
      `, [id]);
      const sellerUserId = sellerRows[0]?.user_id;

      // Real-time notification
      if (sellerUserId) {
        const socketService = (await import('../services/socketService.js')).default;
        socketService.emitPaymentCompleted(sellerUserId, {
          payment_id: id,
          status: 'completed',
          amount: payment.amount
        });
      }

      res.json({
        success: true,
        message: 'Payment confirmed successfully',
        data: {
          payment_id: id,
          status: 'completed',
          amount: payment.amount
        }
      });
    } catch (error) {
      console.error('Confirm payment error:', error);
      res.status(500).json({ success: false, message: 'Failed to confirm payment', error: error.message });
    }
  }

  
}

export default new PaymentController();
