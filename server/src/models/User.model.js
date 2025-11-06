const db = require('../config/database');

class User {
  // Find user by username or email
  static async findByUsername(username) {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, username]
    );
    return rows[0];
  }

  // Find user by ID
  static async findById(userId) {
    const [rows] = await db.query(
      'SELECT user_id, username, email, phone_number, user_type, status, profile_photo, created_at, last_login FROM users WHERE user_id = ?',
      [userId]
    );
    return rows[0];
  }

  // Find user by email
  static async findByEmail(email) {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  }

  // Check if username or email exists
  static async exists(username, email) {
    const [rows] = await db.query(
      'SELECT user_id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    return rows.length > 0;
  }

  // Create new user
  static async create(userData) {
    const {
      username,
      email,
      password_hash,
      phone_number,
      user_type,
      status = 'active'
    } = userData;

    const [result] = await db.query(
      `INSERT INTO users (username, email, password_hash, phone_number, user_type, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, email, password_hash, phone_number, user_type, status]
    );

    return result.insertId;
  }

  // Update user
  static async update(userId, updates) {
    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) {
      return false;
    }

    values.push(userId);
    const [result] = await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  // Update password
  static async updatePassword(userId, password_hash) {
    const [result] = await db.query(
      'UPDATE users SET password_hash = ? WHERE user_id = ?',
      [password_hash, userId]
    );
    return result.affectedRows > 0;
  }

  // Update last login
  static async updateLastLogin(userId) {
    await db.query(
      'UPDATE users SET last_login = NOW() WHERE user_id = ?',
      [userId]
    );
  }

  // Get user with profile
  static async findWithProfile(userId) {
    const user = await this.findById(userId);
    if (!user) return null;

    const profileTable = user.user_type === 'admin' ? 'admins' :
                        user.user_type === 'manager' ? 'managers' : 'sellers';
    
    const [profiles] = await db.query(
      `SELECT * FROM ${profileTable} WHERE user_id = ?`,
      [userId]
    );

    return {
      ...user,
      profile: profiles[0] || {}
    };
  }

  // Update user status
  static async updateStatus(userId, status) {
    const [result] = await db.query(
      'UPDATE users SET status = ? WHERE user_id = ?',
      [status, userId]
    );
    return result.affectedRows > 0;
  }

  // Get all users (with pagination)
  static async findAll(filters = {}) {
    let query = 'SELECT user_id, username, email, phone_number, user_type, status, created_at, last_login FROM users WHERE 1=1';
    const values = [];

    if (filters.user_type) {
      query += ' AND user_type = ?';
      values.push(filters.user_type);
    }

    if (filters.status) {
      query += ' AND status = ?';
      values.push(filters.status);
    }

    if (filters.search) {
      query += ' AND (username LIKE ? OR email LIKE ? OR phone_number LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      values.push(searchTerm, searchTerm, searchTerm);
    }

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    values.push(limit, offset);

    const [rows] = await db.query(query, values);
    return rows;
  }

  // Delete user
  static async delete(userId) {
    const [result] = await db.query(
      'DELETE FROM users WHERE user_id = ?',
      [userId]
    );
    return result.affectedRows > 0;
  }

  // Count users by type
  static async countByType(user_type) {
    const [rows] = await db.query(
      'SELECT COUNT(*) as count FROM users WHERE user_type = ?',
      [user_type]
    );
    return rows[0].count;
  }

  // Get user statistics
  static async getStatistics() {
    const [stats] = await db.query(`
      SELECT 
        user_type,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive
      FROM users
      GROUP BY user_type
    `);
    return stats;
  }
}

module.exports = User;