import db from '../config/database.js';
import { Notification } from '../models/Notification.model.js';

class NotificationController {
  // Get all notifications with filters
  async getAllNotifications(req, res) {
    try {
      const filters = {
        user_id: req.query.user_id,
        seller_id: req.query.seller_id,
        status: req.query.status,
        notification_type: req.query.notification_type,
        limit: req.query.limit ? parseInt(req.query.limit) : 100,
        offset: req.query.offset ? parseInt(req.query.offset) : 0
      };

      // Auto-scope to manager's sellers when requester is a manager
      const managerId = req.user?.manager_id || req.user?.profile?.manager_id || req.user?.id;
      if (req.user?.user_type === 'manager' && managerId) {
        filters.manager_id = managerId;
      }

      const notifications = await Notification.findAll(filters);

      res.json({
        success: true,
        data: notifications,
        count: notifications.length
      });
    } catch (error) {
      console.error('Get all notifications error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: error.message });
    }
  }

  // Get notification by ID
  async getNotificationById(req, res) {
    try {
      const { id } = req.params;
      const notification = await Notification.findById(id);

      if (!notification) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      // Enforce ownership for managers: either the notification is for their seller, or addressed to themselves
      if (req.user?.user_type === 'manager') {
        const managerId = req.user?.manager_id || req.user?.profile?.manager_id || req.user?.id;
        const currentUserId = req.user?.user_id || req.user?.id;
        if (!managerId) {
          return res.status(403).json({ success: false, message: 'Forbidden: manager id missing' });
        }
        if (notification.seller_id) {
          const [rows] = await db.query('SELECT manager_id FROM sellers WHERE seller_id = ? LIMIT 1', [notification.seller_id]);
          const sellerManagerId = rows?.[0]?.manager_id;
          if (!sellerManagerId || sellerManagerId !== managerId) {
            return res.status(403).json({ success: false, message: 'Forbidden: notification not owned by manager' });
          }
        } else if (notification.user_id && notification.user_id !== currentUserId) {
          return res.status(403).json({ success: false, message: 'Forbidden: notification not owned by manager' });
        }
      }

      res.json({
        success: true,
        data: notification
      });
    } catch (error) {
      console.error('Get notification by ID error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch notification', error: error.message });
    }
  }

  // Get user notifications
  async getUserNotifications(req, res) {
    try {
      const userId = req.user?.user_id || req.query.user_id;
      
      if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required' });
      }

      const filters = {
        status: req.query.status,
        notification_type: req.query.notification_type,
        limit: req.query.limit ? parseInt(req.query.limit) : 50,
        offset: req.query.offset ? parseInt(req.query.offset) : 0
      };

      const notifications = await Notification.getUserNotifications(userId, filters);
      const unreadCount = await Notification.getUnreadCount(userId);

      res.json({
        success: true,
        data: notifications,
        count: notifications.length,
        unread_count: unreadCount
      });
    } catch (error) {
      console.error('Get user notifications error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: error.message });
    }
  }

  // Create notification
  async createNotification(req, res) {
    try {
      const {
        user_id,
        seller_id,
        title,
        message,
        notification_type,
        related_id,
        action_url
      } = req.body;

      if (!user_id || !title || !message) {
        return res.status(400).json({
          success: false,
          message: 'User ID, title, and message are required'
        });
      }

      // For managers: can only create notifications for their own sellers, and only address self when not tied to a seller
      if (req.user?.user_type === 'manager') {
        const managerId = req.user?.manager_id || req.user?.profile?.manager_id || req.user?.id;
        const currentUserId = req.user?.user_id || req.user?.id;
        if (!managerId) {
          return res.status(403).json({ success: false, message: 'Forbidden: manager id missing' });
        }
        if (seller_id) {
          const [rows] = await db.query('SELECT manager_id FROM sellers WHERE seller_id = ? LIMIT 1', [seller_id]);
          const sellerManagerId = rows?.[0]?.manager_id;
          if (!sellerManagerId || sellerManagerId !== managerId) {
            return res.status(403).json({ success: false, message: 'Forbidden: cannot notify another manager\'s seller' });
          }
        } else if (user_id !== currentUserId) {
          return res.status(403).json({ success: false, message: 'Forbidden: managers can only create self-addressed notifications when not tied to a seller' });
        }
      }

      const notificationId = await Notification.create({
        user_id,
        seller_id,
        title,
        message,
        notification_type: notification_type || 'system',
        related_id,
        action_url,
        status: 'unread'
      });

      res.status(201).json({
        success: true,
        message: 'Notification created successfully',
        data: { notification_id: notificationId }
      });
    } catch (error) {
      console.error('Create notification error:', error);
      res.status(500).json({ success: false, message: 'Failed to create notification', error: error.message });
    }
  }

  // Update notification
  async updateNotification(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const notification = await Notification.findById(id);
      if (!notification) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      // Ownership enforcement for managers
      if (req.user?.user_type === 'manager') {
        const managerId = req.user?.manager_id || req.user?.profile?.manager_id || req.user?.id;
        const currentUserId = req.user?.user_id || req.user?.id;
        if (!managerId) {
          return res.status(403).json({ success: false, message: 'Forbidden: manager id missing' });
        }
        if (notification.seller_id) {
          const [rows] = await db.query('SELECT manager_id FROM sellers WHERE seller_id = ? LIMIT 1', [notification.seller_id]);
          const sellerManagerId = rows?.[0]?.manager_id;
          if (!sellerManagerId || sellerManagerId !== managerId) {
            return res.status(403).json({ success: false, message: 'Forbidden: notification not owned by manager' });
          }
        } else if (notification.user_id && notification.user_id !== currentUserId) {
          return res.status(403).json({ success: false, message: 'Forbidden: notification not owned by manager' });
        }
      }

      const updated = await Notification.update(id, updates);

      if (!updated) {
        return res.status(500).json({ success: false, message: 'Failed to update notification' });
      }

      res.json({ success: true, message: 'Notification updated successfully' });
    } catch (error) {
      console.error('Update notification error:', error);
      res.status(500).json({ success: false, message: 'Failed to update notification', error: error.message });
    }
  }

  // Update notification status
  async updateNotificationStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ success: false, message: 'Status is required' });
      }

      // Ownership enforcement for managers
      const notification = await Notification.findById(id);
      if (!notification) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }
      if (req.user?.user_type === 'manager') {
        const managerId = req.user?.manager_id || req.user?.profile?.manager_id || req.user?.id;
        const currentUserId = req.user?.user_id || req.user?.id;
        if (!managerId) {
          return res.status(403).json({ success: false, message: 'Forbidden: manager id missing' });
        }
        if (notification.seller_id) {
          const [rows] = await db.query('SELECT manager_id FROM sellers WHERE seller_id = ? LIMIT 1', [notification.seller_id]);
          const sellerManagerId = rows?.[0]?.manager_id;
          if (!sellerManagerId || sellerManagerId !== managerId) {
            return res.status(403).json({ success: false, message: 'Forbidden: notification not owned by manager' });
          }
        } else if (notification.user_id && notification.user_id !== currentUserId) {
          return res.status(403).json({ success: false, message: 'Forbidden: notification not owned by manager' });
        }
      }

      const updated = await Notification.updateStatus(id, status);

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      res.json({ success: true, message: 'Notification status updated successfully' });
    } catch (error) {
      console.error('Update notification status error:', error);
      res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
    }
  }

  // Mark as read
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      // Ownership enforcement for managers
      const notification = await Notification.findById(id);
      if (!notification) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }
      if (req.user?.user_type === 'manager') {
        const managerId = req.user?.manager_id || req.user?.profile?.manager_id || req.user?.id;
        const currentUserId = req.user?.user_id || req.user?.id;
        if (!managerId) {
          return res.status(403).json({ success: false, message: 'Forbidden: manager id missing' });
        }
        if (notification.seller_id) {
          const [rows] = await db.query('SELECT manager_id FROM sellers WHERE seller_id = ? LIMIT 1', [notification.seller_id]);
          const sellerManagerId = rows?.[0]?.manager_id;
          if (!sellerManagerId || sellerManagerId !== managerId) {
            return res.status(403).json({ success: false, message: 'Forbidden: notification not owned by manager' });
          }
        } else if (notification.user_id && notification.user_id !== currentUserId) {
          return res.status(403).json({ success: false, message: 'Forbidden: notification not owned by manager' });
        }
      }
      const updated = await Notification.markAsRead(id);

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({ success: false, message: 'Failed to mark as read', error: error.message });
    }
  }

  // Mark multiple as read
  async markMultipleAsRead(req, res) {
    try {
      const { notification_ids } = req.body;

      if (!notification_ids || !Array.isArray(notification_ids)) {
        return res.status(400).json({
          success: false,
          message: 'notification_ids array is required'
        });
      }

      // Optional: For managers, filter to only those they own
      if (req.user?.user_type === 'manager') {
        const managerId = req.user?.manager_id || req.user?.profile?.manager_id || req.user?.id;
        if (!managerId) {
          return res.status(403).json({ success: false, message: 'Forbidden: manager id missing' });
        }
        // Reduce to notifications owned by manager (seller owned or self-addressed)
        const placeholders = notification_ids.map(() => '?').join(',');
        const [rows] = await db.query(
          `SELECT n.notification_id, n.user_id, n.seller_id, s.manager_id
           FROM notifications n
           LEFT JOIN sellers s ON n.seller_id = s.seller_id
           WHERE n.notification_id IN (${placeholders})`,
          notification_ids
        );
        const currentUserId = req.user?.user_id || req.user?.id;
        const allowed = rows.filter(r => (r.seller_id ? r.manager_id === managerId : r.user_id === currentUserId)).map(r => r.notification_id);
        if (allowed.length === 0) {
          return res.json({ success: true, message: 'No notifications eligible to mark as read', count: 0 });
        }
        const count = await Notification.markMultipleAsRead(allowed);
        return res.json({ success: true, message: `${count} notification(s) marked as read`, count });
      }

      const count = await Notification.markMultipleAsRead(notification_ids);

      res.json({
        success: true,
        message: `${count} notification(s) marked as read`,
        count
      });
    } catch (error) {
      console.error('Mark multiple as read error:', error);
      res.status(500).json({ success: false, message: 'Failed to mark as read', error: error.message });
    }
  }

  // Delete notification
  async deleteNotification(req, res) {
    try {
      const { id } = req.params;

      // Ownership enforcement for managers
      const notification = await Notification.findById(id);
      if (!notification) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }
      if (req.user?.user_type === 'manager') {
        const managerId = req.user?.manager_id || req.user?.profile?.manager_id || req.user?.id;
        const currentUserId = req.user?.user_id || req.user?.id;
        if (!managerId) {
          return res.status(403).json({ success: false, message: 'Forbidden: manager id missing' });
        }
        if (notification.seller_id) {
          const [rows] = await db.query('SELECT manager_id FROM sellers WHERE seller_id = ? LIMIT 1', [notification.seller_id]);
          const sellerManagerId = rows?.[0]?.manager_id;
          if (!sellerManagerId || sellerManagerId !== managerId) {
            return res.status(403).json({ success: false, message: 'Forbidden: notification not owned by manager' });
          }
        } else if (notification.user_id && notification.user_id !== currentUserId) {
          return res.status(403).json({ success: false, message: 'Forbidden: notification not owned by manager' });
        }
      }

      const deleted = await Notification.delete(id);

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      res.json({ success: true, message: 'Notification deleted successfully' });
    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete notification', error: error.message });
    }
  }

  // Get unread count
  async getUnreadCount(req, res) {
    try {
      const userId = req.user?.user_id || req.query.user_id;

      if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required' });
      }

      const count = await Notification.getUnreadCount(userId);

      res.json({
        success: true,
        data: { user_id: userId, unread_count: count }
      });
    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch unread count', error: error.message });
    }
  }
}

export default new NotificationController();

