import db from '../config/database.js';
import { Zone, Space } from '../models/Zone.model.js';

class ZoneController {
  // Get all zones with filters
  async getAllZones(req, res) {
    try {
      const filters = {
        status: req.query.status,
        manager_id: req.query.manager_id,
        search: req.query.search
      };

      // Auto-scope to manager's zones when requester is a manager
      const managerId = req.user?.manager_id || req.user?.profile?.manager_id || req.user?.id;
      if (req.user?.user_type === 'manager' && managerId) {
        filters.manager_id = managerId;
      }

      const zones = await Zone.findAll(filters);

      res.json({
        success: true,
        data: zones,
        count: zones.length
      });
    } catch (error) {
      console.error('Get all zones error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch zones', error: error.message });
    }
  }

  // Get zone by ID
  async getZoneById(req, res) {
    try {
      const { id } = req.params;
      const zone = await Zone.findById(id);

      if (!zone) {
        return res.status(404).json({ success: false, message: 'Zone not found' });
      }

      // Enforce ownership for managers
      const managerId = req.user?.manager_id || req.user?.profile?.manager_id || req.user?.id;
      if (req.user?.user_type === 'manager' && managerId && zone.manager_id !== managerId) {
        return res.status(403).json({ success: false, message: 'Forbidden: zone not owned by manager' });
      }

      // Get spaces in zone
      const spaces = await Zone.getSpaces(id);
      const stats = await Zone.getStatistics(id);

      res.json({
        success: true,
        data: { ...zone, spaces, stats }
      });
    } catch (error) {
      console.error('Get zone by ID error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch zone', error: error.message });
    }
  }

  // Create zone
  async createZone(req, res) {
    try {
      const { zone_name, zone_code, description, total_spaces, status } = req.body;

      if (!zone_name || !zone_code) {
        return res.status(400).json({ success: false, message: 'Zone name and code are required' });
      }

      // Check if zone code already exists
      const existing = await Zone.findByCode(zone_code);
      if (existing) {
        return res.status(409).json({ success: false, message: 'Zone code already exists' });
      }

      // Manager derived from token (supports id, manager_id, or profile.manager_id)
      const managerId = req.user?.id || req.user?.manager_id || req.user?.profile?.manager_id;
      const zoneId = await Zone.create({
        zone_name,
        zone_code,
        description,
        manager_id: managerId,
        total_spaces: total_spaces || 0,
        status: status || 'active'
      });

      res.status(201).json({
        success: true,
        message: 'Zone created successfully',
        data: { zone_id: zoneId }
      });
    } catch (error) {
      console.error('Create zone error:', error);
      res.status(500).json({ success: false, message: 'Failed to create zone', error: error.message });
    }
  }

  // Update zone
  async updateZone(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const zone = await Zone.findById(id);
      if (!zone) {
        return res.status(404).json({ success: false, message: 'Zone not found' });
      }

      const updated = await Zone.update(id, updates);

      if (!updated) {
        return res.status(500).json({ success: false, message: 'Failed to update zone' });
      }

      res.json({ success: true, message: 'Zone updated successfully' });
    } catch (error) {
      console.error('Update zone error:', error);
      res.status(500).json({ success: false, message: 'Failed to update zone', error: error.message });
    }
  }

  // Delete zone
  async deleteZone(req, res) {
    try {
      const { id } = req.params;

      const deleted = await Zone.delete(id);

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Zone not found' });
      }

      res.json({ success: true, message: 'Zone deleted successfully' });
    } catch (error) {
      console.error('Delete zone error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete zone', error: error.message });
    }
  }

  // Get zone spaces
  async getZoneSpaces(req, res) {
    try {
      const { id } = req.params;
      // Verify zone ownership for managers before returning spaces
      const zone = await Zone.findById(id);
      if (!zone) {
        return res.status(404).json({ success: false, message: 'Zone not found' });
      }
      const managerId = req.user?.manager_id || req.user?.profile?.manager_id;
      if (req.user?.user_type === 'manager' && managerId && zone.manager_id !== managerId) {
        return res.status(403).json({ success: false, message: 'Forbidden: zone not owned by manager' });
      }
      const spaces = await Zone.getSpaces(id);

      res.json({
        success: true,
        data: spaces,
        count: spaces.length
      });
    } catch (error) {
      console.error('Get zone spaces error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch spaces', error: error.message });
    }
  }

  // Get zone statistics
  async getZoneStats(req, res) {
    try {
      const { id } = req.params;
      // Verify zone ownership for managers before returning statistics
      const zone = await Zone.findById(id);
      if (!zone) {
        return res.status(404).json({ success: false, message: 'Zone not found' });
      }
      const managerId = req.user?.manager_id || req.user?.profile?.manager_id || req.user?.id;
      if (req.user?.user_type === 'manager' && managerId && zone.manager_id !== managerId) {
        return res.status(403).json({ success: false, message: 'Forbidden: zone not owned by manager' });
      }

      const stats = await Zone.getStatistics(id);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get zone stats error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch statistics', error: error.message });
    }
  }
}

export default new ZoneController();
