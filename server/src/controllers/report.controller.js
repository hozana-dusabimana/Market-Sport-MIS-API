import { Allocation, Payment } from '../models/Payment.model.js';
import Space from '../models/Space.model.js';

class ReportController {
  // GET /reports/overview?date_from&date_to
  async getOverview(req, res) {
    try {
      const { date_from, date_to } = req.query;

      const requesterIsManager = req.user?.user_type === 'manager';
      const managerIdFromUser = req.user?.manager_id || req.user?.profile?.manager_id || req.user?.id;
      const managerScope = requesterIsManager ? managerIdFromUser : (req.query.manager_id || null);

      // Payments
      const paymentFilters = {
        date_from: date_from || null,
        date_to: date_to || null,
      };
      if (managerScope) paymentFilters.created_by_manager_id = managerScope;
      const payments = await Payment.findAll(paymentFilters);
      const total_revenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

      // Allocations
      const allocationFilters = {};
      if (managerScope) allocationFilters.created_by_manager_id = managerScope;
      const allocations = await Allocation.findAll(allocationFilters);

      // Spaces
      const spaceFilters = {};
      if (managerScope) spaceFilters.created_by_manager_id = managerScope;
      const spaces = await Space.findAll(spaceFilters);

      const data = {
        totals: {
          revenue: total_revenue,
          payments: payments.length,
          allocations: allocations.length,
          spaces: spaces.length,
        }
      };

      res.json({ success: true, data });
    } catch (error) {
      console.error('Reports overview error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch overview report', error: error.message });
    }
  }

  // GET /reports/payments?date_from&date_to
  async getPaymentsReport(req, res) {
    try {
      const { date_from, date_to } = req.query;
      const requesterIsManager = req.user?.user_type === 'manager';
      const managerIdFromUser = req.user?.manager_id || req.user?.profile?.manager_id || req.user?.id;
      const managerScope = requesterIsManager ? managerIdFromUser : (req.query.manager_id || null);

      const filters = {
        date_from: date_from || null,
        date_to: date_to || null,
      };
      if (managerScope) filters.created_by_manager_id = managerScope;

      const payments = await Payment.findAll(filters);
      const total = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

      res.json({ success: true, data: { total, count: payments.length, rows: payments } });
    } catch (error) {
      console.error('Payments report error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch payments report', error: error.message });
    }
  }

  // GET /reports/allocations?status&allocation_type
  async getAllocationsReport(req, res) {
    try {
      const { status, allocation_type } = req.query;
      const requesterIsManager = req.user?.user_type === 'manager';
      const managerIdFromUser = req.user?.manager_id || req.user?.profile?.manager_id || req.user?.id;
      const managerScope = requesterIsManager ? managerIdFromUser : (req.query.manager_id || null);

      const filters = {
        status: status || null,
        allocation_type: allocation_type || null,
        limit: 1000,
        offset: 0,
      };
      if (managerScope) filters.created_by_manager_id = managerScope;

      const allocations = await Allocation.findAll(filters);
      const countsByStatus = allocations.reduce((acc, a) => {
        const k = a.status || 'unknown';
        acc[k] = (acc[k] || 0) + 1;
        return acc;
      }, {});

      res.json({ success: true, data: { count: allocations.length, countsByStatus, rows: allocations } });
    } catch (error) {
      console.error('Allocations report error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch allocations report', error: error.message });
    }
  }

  // GET /reports/spaces?status&space_type
  async getSpacesReport(req, res) {
    try {
      const { status, space_type } = req.query;
      const requesterIsManager = req.user?.user_type === 'manager';
      const managerIdFromUser = req.user?.manager_id || req.user?.profile?.manager_id || req.user?.id;
      const managerScope = requesterIsManager ? managerIdFromUser : (req.query.manager_id || null);

      const filters = {
        status: status || null,
        space_type: space_type || null,
      };
      if (managerScope) filters.created_by_manager_id = managerScope;

      const spaces = await Space.findAll(filters);
      const countsByStatus = spaces.reduce((acc, s) => {
        const k = s.status || 'unknown';
        acc[k] = (acc[k] || 0) + 1;
        return acc;
      }, {});

      res.json({ success: true, data: { count: spaces.length, countsByStatus, rows: spaces } });
    } catch (error) {
      console.error('Spaces report error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch spaces report', error: error.message });
    }
  }
}

export default new ReportController();

