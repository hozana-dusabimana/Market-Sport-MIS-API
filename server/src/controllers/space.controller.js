import db from '../config/database.js';
import { Space } from '../models/Zone.model.js';

class SpaceController {
  // Get all spaces with filters
  async getAllSpaces(req, res) {
    try {
      const filters = {
        zone_id: req.query.zone_id,
        status: req.query.status,
        space_type: req.query.space_type,
        search: req.query.search
      };

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

  // Get space by ID
  async getSpaceById(req, res) {
    try {
      const { id } = req.params;
      const space = await Space.findById(id);

      if (!space) {
        return res.status(404).json({ success: false, message: 'Space not found' });
      }

      const currentAllocation = await Space.getCurrentAllocation(id);
      const history = await Space.getAllocationHistory(id);

      res.json({
        success: true,
        data: { ...space, currentAllocation, history }
      });
    } catch (error) {
      console.error('Get space by ID error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch space', error: error.message });
    }
  }

  // Get available spaces
  async getAvailableSpaces(req, res) {
    try {
      const filters = {
        zone_id: req.query.zone_id,
        space_type: req.query.space_type
      };

      const spaces = await Space.findAvailable(filters);

      res.json({
        success: true,
        data: spaces,
        count: spaces.length
      });
    } catch (error) {
      console.error('Get available spaces error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch available spaces', error: error.message });
    }
  }

  // Create space
  async createSpace(req, res) {
    try {
      let { zone_id, space_number, space_type, size_sqm, daily_rate, weekly_rate, monthly_rate, features, status } = req.body;

      // Map old field names to new field names for backward compatibility
      if (req.body.space_code) {
        space_number = req.body.space_code;
      }
      if (req.body.rent_amount) {
        daily_rate = req.body.rent_amount;
      }
      if (req.body.size) {
        // Handle both "35m²" and 35 formats
        size_sqm = typeof req.body.size === 'string' 
          ? parseInt(req.body.size) 
          : req.body.size;
      }

      if (!zone_id || !space_number || !space_type) {
        return res.status(400).json({ success: false, message: 'Zone ID, space number, and type are required' });
      }

      const spaceId = await Space.create({
        zone_id,
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

  // Update space
  async updateSpace(req, res) {
    try {
      const { id } = req.params;
      let updates = req.body;

      const space = await Space.findById(id);
      if (!space) {
        return res.status(404).json({ success: false, message: 'Space not found' });
      }

      // Map old field names to new field names for backward compatibility
      if (updates.space_code) {
        updates.space_number = updates.space_code;
        delete updates.space_code;
      }
      if (updates.rent_amount) {
        updates.daily_rate = updates.rent_amount;
        delete updates.rent_amount;
      }
      if (updates.size && typeof updates.size === 'string') {
        // Extract number from "35m²" format
        updates.size_sqm = parseInt(updates.size);
        delete updates.size;
      } else if (updates.size && typeof updates.size === 'number') {
        updates.size_sqm = updates.size;
        delete updates.size;
      }

      const updated = await Space.update(id, updates);

      if (!updated) {
        return res.status(500).json({ success: false, message: 'Failed to update space' });
      }

      res.json({ success: true, message: 'Space updated successfully' });
    } catch (error) {
      console.error('Update space error:', error);
      res.status(500).json({ success: false, message: 'Failed to update space', error: error.message });
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

      const updated = await Space.updateStatus(id, status);

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Space not found' });
      }

      res.json({ success: true, message: 'Space status updated successfully' });
    } catch (error) {
      console.error('Update space status error:', error);
      res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
    }
  }

  // Delete space
  async deleteSpace(req, res) {
    try {
      const { id } = req.params;

      const deleted = await Space.delete(id);

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Space not found' });
      }

      res.json({ success: true, message: 'Space deleted successfully' });
    } catch (error) {
      console.error('Delete space error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete space', error: error.message });
    }
  }

  // Get space allocation history
  async getAllocationHistory(req, res) {
    try {
      const { id } = req.params;
      const history = await Space.getAllocationHistory(id);

      res.json({
        success: true,
        data: history,
        count: history.length
      });
    } catch (error) {
      console.error('Get allocation history error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch allocation history', error: error.message });
    }
  }

  // Check space availability
  async checkAvailability(req, res) {
    try {
      const { id } = req.params;
      const isAvailable = await Space.checkAvailability(id);

      res.json({
        success: true,
        data: { space_id: id, available: isAvailable }
      });
    } catch (error) {
      console.error('Check availability error:', error);
      res.status(500).json({ success: false, message: 'Failed to check availability', error: error.message });
    }
  }
}

export default new SpaceController();
