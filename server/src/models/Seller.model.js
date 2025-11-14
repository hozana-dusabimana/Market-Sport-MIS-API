import db from '../config/database.js';

class Seller {
  // Find seller by user ID
  static async findByUserId(userId) {
    const [rows] = await db.query(
      'SELECT * FROM sellers WHERE user_id = ?',
      [userId]
    );
    return rows[0];
  }

  // Find seller by ID
  static async findById(sellerId) {
    const [rows] = await db.query(
      'SELECT * FROM sellers WHERE seller_id = ?',
      [sellerId]
    );
    return rows[0];
  }

  // Check if ID number exists
  static async idNumberExists(idNumber) {
    const [rows] = await db.query(
      'SELECT seller_id FROM sellers WHERE id_number = ?',
      [idNumber]
    );
    return rows.length > 0;
  }

  // Create seller profile
  static async create(sellerData) {
    const {
      user_id,
      full_name,
      id_number,
      business_name,
      business_type,
      created_by_manager_id,
      tin_number,
      emergency_contact,
      address,
      registration_date,
      verification_status = 'pending'
    } = sellerData;

    const [result] = await db.query(
      `INSERT INTO sellers (
        user_id, full_name, id_number, business_name, business_type,
        created_by_manager_id, tin_number, emergency_contact, address, registration_date, verification_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        full_name,
        id_number,
        business_name,
        business_type,
        created_by_manager_id || null,
        tin_number,
        emergency_contact,
        address,
        registration_date,
        verification_status
      ]
    );
    // Best-effort: mirror created_by_manager_id into manager_id if such column exists
    if (created_by_manager_id) {
      try {
        await db.query('UPDATE sellers SET manager_id = ? WHERE seller_id = ?', [created_by_manager_id, result.insertId]);
      } catch (e) {
        // Column may not exist; ignore
      }
    }

    return result.insertId;
  }

  // Update seller profile
  static async update(sellerId, updates) {
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

    values.push(sellerId);
    const [result] = await db.query(
      `UPDATE sellers SET ${fields.join(', ')} WHERE seller_id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  // Update verification status
  static async updateVerificationStatus(sellerId, status) {
    const [result] = await db.query(
      'UPDATE sellers SET verification_status = ? WHERE seller_id = ?',
      [status, sellerId]
    );
    return result.affectedRows > 0;
  }

  // Get all sellers with filters
  static async findAll(filters = {}) {
    let query = `
      SELECT s.*, u.username, u.email, u.phone_number, u.status as account_status
      FROM sellers s
      JOIN users u ON s.user_id = u.user_id
      WHERE 1=1
    `;
    const values = [];

    if (filters.verification_status) {
      query += ' AND s.verification_status = ?';
      values.push(filters.verification_status);
    }

    if (filters.business_type) {
      query += ' AND s.business_type = ?';
      values.push(filters.business_type);
    }

    if (filters.created_by_manager_id) {
      query += ' AND s.created_by_manager_id = ?';
      values.push(filters.created_by_manager_id);
    }

    if (filters.search) {
      query += ' AND (s.full_name LIKE ? OR s.business_name LIKE ? OR s.id_number LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      values.push(searchTerm, searchTerm, searchTerm);
    }

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    
    query += ' ORDER BY s.registration_date DESC LIMIT ? OFFSET ?';
    values.push(limit, offset);

    const [rows] = await db.query(query, values);
    return rows;
  }

  // Get seller with user info
  static async findWithUser(sellerId) {
    const [rows] = await db.query(`
      SELECT 
        s.*,
        u.username,
        u.email,
        u.phone_number,
        u.status as account_status,
        u.profile_photo,
        u.created_at,
        u.last_login
      FROM sellers s
      JOIN users u ON s.user_id = u.user_id
      WHERE s.seller_id = ?
    `, [sellerId]);
    
    return rows[0];
  }

  // Get seller allocations
  static async getAllocations(sellerId) {
    const [rows] = await db.query(`
      SELECT 
        sa.*,
        sp.space_number,
        sp.space_type,
        z.zone_name,
        z.zone_code
      FROM space_allocations sa
      JOIN spaces sp ON sa.space_id = sp.space_id
      JOIN zones z ON sp.zone_id = z.zone_id
      WHERE sa.seller_id = ?
      ORDER BY sa.start_date DESC
    `, [sellerId]);
    
    return rows;
  }

  // Get seller payment history
  static async getPayments(sellerId) {
    const [rows] = await db.query(`
      SELECT 
        p.*,
        sa.allocation_type,
        sp.space_number,
        z.zone_name
      FROM payments p
      JOIN space_allocations sa ON p.allocation_id = sa.allocation_id
      JOIN spaces sp ON sa.space_id = sp.space_id
      JOIN zones z ON sp.zone_id = z.zone_id
      WHERE p.seller_id = ?
      ORDER BY p.payment_date DESC
    `, [sellerId]);
    
    return rows;
  }

  // Get seller statistics
  static async getStatistics(sellerId) {
    const [stats] = await db.query(`
      SELECT 
        COUNT(DISTINCT sa.allocation_id) as total_allocations,
        COUNT(DISTINCT CASE WHEN sa.status = 'active' THEN sa.allocation_id END) as active_allocations,
        COUNT(DISTINCT p.payment_id) as total_payments,
        COALESCE(SUM(p.amount), 0) as total_paid
      FROM sellers s
      LEFT JOIN space_allocations sa ON s.seller_id = sa.seller_id
      LEFT JOIN payments p ON s.seller_id = p.seller_id AND p.status = 'completed'
      WHERE s.seller_id = ?
      GROUP BY s.seller_id
    `, [sellerId]);
    
    return stats[0];
  }

  // Count sellers by verification status
  static async countByStatus() {
    const [rows] = await db.query(`
      SELECT 
        verification_status,
        COUNT(*) as count
      FROM sellers
      GROUP BY verification_status
    `);
    return rows;
  }

  // Delete seller
  static async delete(sellerId) {
    const [result] = await db.query(
      'DELETE FROM sellers WHERE seller_id = ?',
      [sellerId]
    );
    return result.affectedRows > 0;
  }
}

export default Seller;