import db from '../config/database.js';
import { Zone } from '../models/Zone.model.js';
import Space from '../models/Space.model.js';

class SpaceController {
  // Get all spaces
  async getAllSpaces(req, res) {
    try {
      const filters = {
        zone_id: req.query.zone_id,
        status: req.query.status,
        space_type: req.query.space_type,
        search: req.query.search
      };

      const managerId = req.user?.manager_id || req.user?.profile?.manager_id || req.user?.id;
      if (req.user?.user_type === 'manager' && managerId) {
        filters.created_by_manager_id = managerId;
      }

      const spaces = await Space.findAll(filters);

      res.json({
        success: true,
        data: spaces,
        count: spaces.length
      });
    } catch (error) {
      console.error('Get all spaces error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch spaces', error: error.message });
    }
  }

  // Create new space
  async createSpace(req, res) {
    try {
      let { zone_id, space_number, space_type, size_sqm, daily_rate, weekly_rate, monthly_rate, features, status } = req.body;

      // Validate
      if (!zone_id || !space_number || !space_type) {
        return res.status(400).json({ success: false, message: 'Zone ID, space number, and type are required' });
      }

      // Get manager_id from token
      const managerId = req.user?.manager_id || req.user?.profile?.manager_id || req.user?.id;

      // Check zone ownership
      const zone = await Zone.findById(zone_id);
      if (!zone) {
        return res.status(404).json({ success: false, message: 'Zone not found' });
      }

      if (req.user?.user_type === 'manager' && zone.manager_id !== managerId) {
        return res.status(403).json({ success: false, message: 'Forbidden: cannot create space in another manager\'s zone' });
      }

      // Create space (record creator; let DB trigger set manager_id from zone)
      const spaceId = await Space.create({
        zone_id,
        manager_id: null,
        created_by_manager_id: req.user?.user_type === 'manager' ? managerId : null,
        space_number,
        space_type,
        size_sqm: size_sqm || null,
        daily_rate: daily_rate || 0,
        weekly_rate: weekly_rate || null,
        monthly_rate: monthly_rate || null,
        features: features || null,
        status: status || 'available'
      });


      res.status(201).json({
        success: true,
        message: 'Space created successfully',
        data: { space_id: spaceId }
      });
    } catch (error) {
      console.error('Create space error:', error);
      res.status(500).json({ success: false, message: 'Failed to create space', error: error.message });
    }
  }

  // Get available spaces
  async getAvailableSpaces(req, res) {
    try {
      const filters = {
        zone_id: req.query.zone_id,
        space_type: req.query.space_type
      };

      const managerId = req.user?.manager_id || req.user?.profile?.manager_id || req.user?.id;
      if (req.user?.user_type === 'manager' && managerId) {
        filters.created_by_manager_id = managerId;
      }

      const spaces = await Space.findAvailable(filters);
      res.json({ success: true, data: spaces, count: spaces.length });
    } catch (error) {
      console.error('Get available spaces error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch available spaces', error: error.message });
    }
  }

  // Get space by ID
  async getSpaceById(req, res) {
    try {
      const { id } = req.params;
      const space = await Space.findById(id);
      if (!space) return res.status(404).json({ success: false, message: 'Space not found' });

      const managerId = req.user?.manager_id || req.user?.profile?.manager_id || req.user?.id;
      if (req.user?.user_type === 'manager' && space.created_by_manager_id !== managerId) {
        return res.status(403).json({ success: false, message: 'Forbidden: space not owned by manager' });
      }

      res.json({ success: true, data: space });
    } catch (error) {
      console.error('Get space by ID error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch space', error: error.message });
    }
  }

  // Update space
  async updateSpace(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const space = await Space.findById(id);
      if (!space) return res.status(404).json({ success: false, message: 'Space not found' });

      const managerId = req.user?.manager_id || req.user?.id;
      if (req.user?.user_type === 'manager' && space.manager_id !== managerId) {
        return res.status(403).json({ success: false, message: 'Forbidden: space not owned by manager' });
      }

      const updated = await Space.update(id, updates);
      if (!updated) return res.status(500).json({ success: false, message: 'Failed to update space' });

      res.json({ success: true, message: 'Space updated successfully' });
    } catch (error) {
      console.error('Update space error:', error);
      res.status(500).json({ success: false, message: 'Failed to update space', error: error.message });
    }
  }

  // Delete space
  async deleteSpace(req, res) {
    try {
      const { id } = req.params;
      const space = await Space.findById(id);
      if (!space) return res.status(404).json({ success: false, message: 'Space not found' });

      const managerId = req.user?.manager_id || req.user?.profile?.manager_id || req.user?.id;
      if (req.user?.user_type === 'manager' && space.created_by_manager_id !== managerId) {
        return res.status(403).json({ success: false, message: 'Forbidden: space not owned by manager' });
      }

      await Space.delete(id);
      res.json({ success: true, message: 'Space deleted successfully' });
    } catch (error) {
      console.error('Delete space error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete space', error: error.message });
    }
  }

  // Update space status
  async updateSpaceStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ success: false, message: 'Status is required' });
      }

      const space = await Space.findById(id);
      if (!space) return res.status(404).json({ success: false, message: 'Space not found' });

      const managerId = req.user?.manager_id || req.user?.profile?.manager_id || req.user?.id;
      if (req.user?.user_type === 'manager' && space.created_by_manager_id !== managerId) {
        return res.status(403).json({ success: false, message: 'Forbidden: space not owned by manager' });
      }

      const updated = await Space.updateStatus(id, status);
      if (!updated) return res.status(404).json({ success: false, message: 'Space not found' });

      res.json({ success: true, message: 'Space status updated successfully' });
    } catch (error) {
      console.error('Update space status error:', error);
      res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
    }
  }

  // Get space allocation history
  async getAllocationHistory(req, res) {
    try {
      const { id } = req.params;
      const space = await Space.findById(id);
      if (!space) return res.status(404).json({ success: false, message: 'Space not found' });

      const managerId = req.user?.manager_id || req.user?.profile?.manager_id || req.user?.id;
      if (req.user?.user_type === 'manager' && space.created_by_manager_id !== managerId) {
        return res.status(403).json({ success: false, message: 'Forbidden: space not owned by manager' });
      }

      const history = await Space.getAllocationHistory(id);
      res.json({ success: true, data: history, count: history.length });
    } catch (error) {
      console.error('Get allocation history error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch allocation history', error: error.message });
    }
  }

  // Check space availability
  async checkAvailability(req, res) {
    try {
      const { id } = req.params;
      const space = await Space.findById(id);
      if (!space) return res.status(404).json({ success: false, message: 'Space not found' });

      const managerId = req.user?.manager_id || req.user?.profile?.manager_id || req.user?.id;
      if (req.user?.user_type === 'manager' && space.created_by_manager_id !== managerId) {
        return res.status(403).json({ success: false, message: 'Forbidden: space not owned by manager' });
      }

      const available = await Space.checkAvailability(id);
      res.json({ success: true, data: { space_id: id, available } });
    } catch (error) {
      console.error('Check availability error:', error);
      res.status(500).json({ success: false, message: 'Failed to check availability', error: error.message });
    }
  }
}

export default new SpaceController();
