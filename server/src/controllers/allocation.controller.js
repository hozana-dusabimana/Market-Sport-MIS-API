import db from '../config/database.js';
import { Allocation } from '../models/Payment.model.js';
import Space from '../models/Space.model.js';

class AllocationController {
  // Get all allocations with filters
  async getAllAllocations(req, res) {
    try {
      const filters = {
        seller_id: req.query.seller_id,
        space_id: req.query.space_id,
        zone_id: req.query.zone_id,
        status: req.query.status,
        allocation_type: req.query.allocation_type,
        limit: req.query.limit ? parseInt(req.query.limit) : 100,
        offset: req.query.offset ? parseInt(req.query.offset) : 0
      };

      // Auto-scope: managers see only allocations they created
      const managerId = req.user?.manager_id || req.user?.profile?.manager_id || req.user?.id;
      if (req.user?.user_type === 'manager' && managerId) {
        filters.created_by_manager_id = managerId;
      }

      const allocations = await Allocation.findAll(filters);

      res.json({
        success: true,
        data: allocations,
        count: allocations.length
      });
    } catch (error) {
      console.error('Get all allocations error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch allocations', error: error.message });
    }
  }

  // Get allocation by ID
  async getAllocationById(req, res) {
    try {
      const { id } = req.params;
      const allocation = await Allocation.findById(id);

      if (!allocation) {
        return res.status(404).json({ success: false, message: 'Allocation not found' });
      }

      // Enforce ownership for managers (created-by-only)
      const managerId = req.user?.manager_id || req.user?.profile?.manager_id || req.user?.id;
      if (req.user?.user_type === 'manager' && managerId && allocation.created_by_manager_id !== managerId) {
        return res.status(403).json({ success: false, message: 'Forbidden: allocation not owned by manager' });
      }

      const payments = await Allocation.getPayments(id);

      res.json({
        success: true,
        data: { ...allocation, payments }
      });
    } catch (error) {
      console.error('Get allocation by ID error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch allocation', error: error.message });
    }
  }

  // Create allocation
  async createAllocation(req, res) {
    try {
      const {
        seller_id,
        space_id,
        allocation_date,
        start_date,
        end_date,
        allocation_type,
        notes
      } = req.body;

      // Validate required fields
      if (!seller_id || !space_id) {
        return res.status(400).json({ success: false, message: 'Seller ID and Space ID are required' });
      }

      if (!req.user || (!req.user.user_id && !req.user.userId)) {
        return res.status(401).json({ success: false, message: 'User authentication required' });
      }

      // Get user_id from either user_id or userId (both formats supported)
      const approvedBy = req.user.user_id || req.user.userId;
      // Determine managerId (for manager users)
      const managerId = req.user?.manager_id || req.user?.profile?.manager_id || req.user?.id || null;

      // Check for existing active allocation for this seller-space combination
      const existingAllocation = await Allocation.findActive(seller_id, space_id);
      if (existingAllocation) {
        return res.status(409).json({ 
          success: false, 
          message: 'An active allocation already exists for this seller-space combination',
          data: { existing_allocation_id: existingAllocation.allocation_id }
        });
      }

      // For managers: ensure the space belongs to a zone owned by the manager
      if (req.user?.user_type === 'manager') {
        const managerId = req.user?.manager_id || req.user?.profile?.manager_id || req.user?.id || null;
        if (!managerId) {
          return res.status(403).json({ success: false, message: 'Forbidden: manager id missing' });
        }
        const space = await Space.findById(space_id);
        if (!space) {
          return res.status(404).json({ success: false, message: 'Space not found' });
        }
        if (space.manager_id !== managerId) {
          return res.status(403).json({ success: false, message: 'Forbidden: cannot allocate space in another manager\'s zone' });
        }
      }

      // approved_by is always the logged-in user
      const allocationId = await Allocation.create({
        seller_id,
        space_id,
        allocation_date: allocation_date || new Date(),
        start_date,
        end_date,
        allocation_type,
        approved_by: approvedBy,
        manager_id: null,
        created_by_manager_id: req.user?.user_type === 'manager' ? managerId : null,
        notes: notes || null,
        status: 'active'
      });

      res.status(201).json({
        success: true,
        message: 'Allocation created successfully',
        data: { allocation_id: allocationId }
      });
    } catch (error) {
      console.error('Create allocation error:', error);
      res.status(500).json({ success: false, message: 'Failed to create allocation', error: error.message });
    }
  }

  // Update allocation
  async updateAllocation(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const allocation = await Allocation.findById(id);
      if (!allocation) {
        return res.status(404).json({ success: false, message: 'Allocation not found' });
      }

      // Enforce ownership for managers
      const managerId = req.user?.manager_id || req.user?.profile?.manager_id;
      if (req.user?.user_type === 'manager' && managerId && allocation.created_by_manager_id !== managerId) {
        return res.status(403).json({ success: false, message: 'Forbidden: allocation not owned by manager' });
      }

      const updated = await Allocation.update(id, updates);

      if (!updated) {
        return res.status(500).json({ success: false, message: 'Failed to update allocation' });
      }

      res.json({ success: true, message: 'Allocation updated successfully' });
    } catch (error) {
      console.error('Update allocation error:', error);
      res.status(500).json({ success: false, message: 'Failed to update allocation', error: error.message });
    }
  }

  // Update allocation status
  async updateAllocationStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ success: false, message: 'Status is required' });
      }

      // Enforce ownership for managers
      const allocation = await Allocation.findById(id);
      if (!allocation) {
        return res.status(404).json({ success: false, message: 'Allocation not found' });
      }
      const managerId = req.user?.manager_id || req.user?.profile?.manager_id;
      if (req.user?.user_type === 'manager' && managerId && allocation.manager_id !== managerId) {
        return res.status(403).json({ success: false, message: 'Forbidden: allocation not owned by manager' });
      }
      const updated = await Allocation.updateStatus(id, status);

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Allocation not found' });
      }

      res.json({ success: true, message: 'Allocation status updated successfully' });
    } catch (error) {
      console.error('Update allocation status error:', error);
      res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
    }
  }

  // Delete allocation
  async deleteAllocation(req, res) {
    try {
      const { id } = req.params;
      // Enforce ownership for managers
      const allocation = await Allocation.findById(id);
      if (!allocation) {
        return res.status(404).json({ success: false, message: 'Allocation not found' });
      }
      const managerId = req.user?.manager_id || req.user?.profile?.manager_id;
      if (req.user?.user_type === 'manager' && managerId && allocation.manager_id !== managerId) {
        return res.status(403).json({ success: false, message: 'Forbidden: allocation not owned by manager' });
      }

      const deleted = await Allocation.delete(id);

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Allocation not found' });
      }

      res.json({ success: true, message: 'Allocation deleted successfully' });
    } catch (error) {
      console.error('Delete allocation error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete allocation', error: error.message });
    }
  }

  // Get payments for allocation
  async getPayments(req, res) {
    try {
      const { id } = req.params;
      // Enforce ownership for managers
      const allocation = await Allocation.findById(id);
      if (!allocation) {
        return res.status(404).json({ success: false, message: 'Allocation not found' });
      }
      const managerId = req.user?.manager_id || req.user?.profile?.manager_id;
      if (req.user?.user_type === 'manager' && managerId && allocation.manager_id !== managerId) {
        return res.status(403).json({ success: false, message: 'Forbidden: allocation not owned by manager' });
      }
      const payments = await Allocation.getPayments(id);

      res.json({
        success: true,
        data: payments,
        count: payments.length
      });
    } catch (error) {
      console.error('Get payments error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch payments', error: error.message });
    }
  }

  // Check expired allocations
  async checkExpired(req, res) {
    try {
      await Allocation.checkExpired();

      res.json({
        success: true,
        message: 'Checked and updated expired allocations'
      });
    } catch (error) {
      console.error('Check expired error:', error);
      res.status(500).json({ success: false, message: 'Failed to check expired allocations', error: error.message });
    }
  }
}

export default new AllocationController();
