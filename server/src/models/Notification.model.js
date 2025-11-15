import db from '../config/database.js';

class Notification {
  static async findAll(filters = {}) {
    let query = `
      SELECT n.*
      FROM notifications n
      LEFT JOIN sellers s ON n.seller_id = s.seller_id
      WHERE 1=1
    `;
    const values = [];

    if (filters.user_id) {
      query += ' AND n.user_id = ?';
      values.push(filters.user_id);
    }

    if (filters.seller_id) {
      query += ' AND n.seller_id = ?';
      values.push(filters.seller_id);
    }

    if (filters.status) {
      query += ' AND n.status = ?';
      values.push(filters.status);
    }

    if (filters.notification_type) {
      query += ' AND n.notification_type = ?';
      values.push(filters.notification_type);
    }

    if (filters.manager_id) {
      // Only notifications tied to sellers owned by this manager.
      // Some databases may not have a dedicated manager_id column on sellers,
      // but do track created_by_manager_id. Scope using that stable field.
      query += ' AND s.created_by_manager_id = ?';
      values.push(filters.manager_id);
    }

    const limit = filters.limit || 100;
    const offset = filters.offset || 0;
    
    query += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';
    values.push(limit, offset);

    const [rows] = await db.query(query, values);
    return rows;
  }

  static async findById(notificationId) {
    const [rows] = await db.query(
      'SELECT * FROM notifications WHERE notification_id = ?',
      [notificationId]
    );
    return rows[0];
  }

  static async create(notificationData) {
    const {
      user_id,
      seller_id,
      title,
      message,
      notification_type = 'system',
      related_id,
      action_url,
      status = 'unread'
    } = notificationData;

    if (!user_id || !title || !message) {
      throw new Error('user_id, title, and message are required');
    }

    const [result] = await db.query(
      `INSERT INTO notifications 
       (user_id, seller_id, title, message, notification_type, related_id, action_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, seller_id, title, message, notification_type, related_id, action_url, status]
    );

    return result.insertId;
  }

  static async update(notificationId, updates) {
    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) return false;

    values.push(notificationId);
    const [result] = await db.query(
      `UPDATE notifications SET ${fields.join(', ')} WHERE notification_id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  static async updateStatus(notificationId, status) {
    const [result] = await db.query(
      'UPDATE notifications SET status = ?, read_at = ? WHERE notification_id = ?',
      [status, status === 'read' ? new Date() : null, notificationId]
    );
    return result.affectedRows > 0;
  }

  static async markAsRead(notificationId) {
    const [result] = await db.query(
      'UPDATE notifications SET status = ?, read_at = CURRENT_TIMESTAMP WHERE notification_id = ?',
      ['read', notificationId]
    );
    return result.affectedRows > 0;
  }

  static async markMultipleAsRead(notificationIds) {
    const placeholders = notificationIds.map(() => '?').join(',');
    const [result] = await db.query(
      `UPDATE notifications SET status = ?, read_at = CURRENT_TIMESTAMP WHERE notification_id IN (${placeholders})`,
      ['read', ...notificationIds]
    );
    return result.affectedRows;
  }

  static async delete(notificationId) {
    const [result] = await db.query(
      'DELETE FROM notifications WHERE notification_id = ?',
      [notificationId]
    );
    return result.affectedRows > 0;
  }

  static async getUnreadCount(userId) {
    const [rows] = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND status = ?',
      [userId, 'unread']
    );
    return rows[0].count;
  }

  static async getUserNotifications(userId, filters = {}) {
    let query = `
      SELECT *
      FROM notifications
      WHERE user_id = ?
    `;
    const values = [userId];

    if (filters.status) {
      query += ' AND status = ?';
      values.push(filters.status);
    }

    if (filters.notification_type) {
      query += ' AND notification_type = ?';
      values.push(filters.notification_type);
    }

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    values.push(limit, offset);

    const [rows] = await db.query(query, values);
    return rows;
  }

  static async deleteOld(daysOld = 30) {
    const [result] = await db.query(
      `DELETE FROM notifications 
       WHERE status = 'read' 
       AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [daysOld]
    );
    return result.affectedRows;
  }
}

export { Notification };

