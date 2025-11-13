// ============================================
// src/models/Allocation.model.js
// ============================================
import db from '../config/database.js';

class Allocation {
  static async findAll(filters = {}) {
    let query = `
      SELECT 
        sa.*,
        s.full_name as seller_name,
        s.business_name,
        sp.space_number,
        sp.space_type,
        z.zone_name,
        z.zone_code,
        z.manager_id AS manager_id
      FROM space_allocations sa
      JOIN sellers s ON sa.seller_id = s.seller_id
      JOIN spaces sp ON sa.space_id = sp.space_id
      JOIN zones z ON sp.zone_id = z.zone_id
      WHERE 1=1
    `;
    const values = [];

    if (filters.seller_id) {
      query += ' AND sa.seller_id = ?';
      values.push(filters.seller_id);
    }

    if (filters.space_id) {
      query += ' AND sa.space_id = ?';
      values.push(filters.space_id);
    }

    if (filters.zone_id) {
      query += ' AND sp.zone_id = ?';
      values.push(filters.zone_id);
    }

    if (filters.created_by_manager_id) {
      // Strictly show allocations created by the manager
      query += ' AND sa.created_by_manager_id = ?';
      values.push(filters.created_by_manager_id);
    } else if (filters.manager_id) {
      // Fallback: scope by zone ownership
      query += ' AND z.manager_id = ?';
      values.push(filters.manager_id);
    }

    if (filters.status) {
      query += ' AND sa.status = ?';
      values.push(filters.status);
    }

    if (filters.allocation_type) {
      query += ' AND sa.allocation_type = ?';
      values.push(filters.allocation_type);
    }

    const limit = filters.limit || 100;
    const offset = filters.offset || 0;
    
    query += ' ORDER BY sa.start_date DESC LIMIT ? OFFSET ?';
    values.push(limit, offset);

    const [rows] = await db.query(query, values);
    return rows;
  }

  static async findById(allocationId) {
    const [rows] = await db.query(`
      SELECT 
        sa.*,
        s.full_name as seller_name,
        s.business_name,
        u.phone_number as seller_phone,
        u.email as seller_email,
        sp.space_number,
        sp.space_type,
        sp.daily_rate,
        sp.weekly_rate,
        sp.monthly_rate,
        z.zone_name,
        z.zone_code,
        z.manager_id AS manager_id
      FROM space_allocations sa
      JOIN sellers s ON sa.seller_id = s.seller_id
      JOIN users u ON s.user_id = u.user_id
      JOIN spaces sp ON sa.space_id = sp.space_id
      JOIN zones z ON sp.zone_id = z.zone_id
      WHERE sa.allocation_id = ?
    `, [allocationId]);
    return rows[0];
  }

  static async findActive(sellerId, spaceId) {
    const [rows] = await db.query(`
      SELECT 
        sa.*,
        s.full_name as seller_name,
        sp.space_number
      FROM space_allocations sa
      JOIN sellers s ON sa.seller_id = s.seller_id
      JOIN spaces sp ON sa.space_id = sp.space_id
      WHERE sa.seller_id = ? AND sa.space_id = ? AND sa.status = 'active'
      LIMIT 1
    `, [sellerId, spaceId]);
    return rows[0];
  }

  static async create(allocationData) {
    const {
      seller_id,
      space_id,
      manager_id,
      allocation_date,
      start_date,
      end_date,
      allocation_type,
      approved_by,
      notes,
      status = 'active'
    } = allocationData;

    const created_by_manager_id = manager_id || allocationData.created_by_manager_id || null;

    const [result] = await db.query(
      `INSERT INTO space_allocations 
       (seller_id, space_id, created_by_manager_id, allocation_date, start_date, end_date, 
        allocation_type, status, approved_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [seller_id, space_id, created_by_manager_id, allocation_date, start_date, end_date,
       allocation_type, status, approved_by, notes]
    );

    // Update space status to occupied
    await db.query(
      'UPDATE spaces SET status = ? WHERE space_id = ?',
      ['occupied', space_id]
    );

    // Update zone occupied count
    await db.query(`
      UPDATE zones z
      JOIN spaces sp ON z.zone_id = sp.zone_id
      SET z.occupied_spaces = (
        SELECT COUNT(*) FROM spaces WHERE zone_id = z.zone_id AND status = 'occupied'
      )
      WHERE sp.space_id = ?
    `, [space_id]);

    return result.insertId;
  }

  static async update(allocationId, updates) {
    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) return false;

    values.push(allocationId);
    const [result] = await db.query(
      `UPDATE space_allocations SET ${fields.join(', ')} WHERE allocation_id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  static async updateStatus(allocationId, status) {
    const allocation = await this.findById(allocationId);
    
    const [result] = await db.query(
      'UPDATE space_allocations SET status = ? WHERE allocation_id = ?',
      [status, allocationId]
    );

    // If cancelling or expiring, update space status
    if ((status === 'cancelled' || status === 'expired') && allocation) {
      await db.query(
        'UPDATE spaces SET status = ? WHERE space_id = ?',
        ['available', allocation.space_id]
      );

      // Update zone occupied count
      await db.query(`
        UPDATE zones z
        JOIN spaces sp ON z.zone_id = sp.zone_id
        SET z.occupied_spaces = (
          SELECT COUNT(*) FROM spaces WHERE zone_id = z.zone_id AND status = 'occupied'
        )
        WHERE sp.space_id = ?
      `, [allocation.space_id]);
    }

    return result.affectedRows > 0;
  }

  static async delete(allocationId) {
    const allocation = await this.findById(allocationId);
    
    const [result] = await db.query(
      'DELETE FROM space_allocations WHERE allocation_id = ?',
      [allocationId]
    );

    if (result.affectedRows > 0 && allocation) {
      await db.query(
        'UPDATE spaces SET status = ? WHERE space_id = ?',
        ['available', allocation.space_id]
      );
    }

    return result.affectedRows > 0;
  }

  static async getPayments(allocationId) {
    const [rows] = await db.query(
      'SELECT * FROM payments WHERE allocation_id = ? ORDER BY payment_date DESC',
      [allocationId]
    );
    return rows;
  }

  static async checkExpired() {
    await db.query(`
      UPDATE space_allocations
      SET status = 'expired'
      WHERE status = 'active' 
        AND end_date IS NOT NULL 
        AND end_date < CURDATE()
    `);

    // Update space statuses for expired allocations
    await db.query(`
      UPDATE spaces sp
      SET sp.status = 'available'
      WHERE sp.space_id IN (
        SELECT space_id FROM space_allocations 
        WHERE status = 'expired' AND space_id = sp.space_id
      )
      AND NOT EXISTS (
        SELECT 1 FROM space_allocations 
        WHERE space_id = sp.space_id AND status = 'active'
      )
    `);
  }

  static async getActiveBySpace(spaceId) {
    const [rows] = await db.query(
      'SELECT * FROM space_allocations WHERE space_id = ? AND status = ? ORDER BY start_date DESC LIMIT 1',
      [spaceId, 'active']
    );
    return rows[0];
  }

  static async getActiveBySeller(sellerId) {
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
      WHERE sa.seller_id = ? AND sa.status = 'active'
      ORDER BY sa.start_date DESC
    `, [sellerId]);
    return rows;
  }
}

// ============================================
// src/models/Payment.model.js
// ============================================
class Payment {
  static async findAll(filters = {}) {
    let query = `
      SELECT 
        p.*,
        s.full_name as seller_name,
        s.business_name,
        sp.space_number,
        z.zone_name,
        sa.allocation_type,
        z.manager_id as manager_id
      FROM payments p
      JOIN sellers s ON p.seller_id = s.seller_id
      JOIN space_allocations sa ON p.allocation_id = sa.allocation_id
      JOIN spaces sp ON sa.space_id = sp.space_id
      JOIN zones z ON sp.zone_id = z.zone_id
      WHERE 1=1
    `;
    const values = [];

    if (filters.seller_id) {
      query += ' AND p.seller_id = ?';
      values.push(filters.seller_id);
    }

    if (filters.allocation_id) {
      query += ' AND p.allocation_id = ?';
      values.push(filters.allocation_id);
    }

    if (filters.status) {
      query += ' AND sa.status = ?';
      values.push(filters.status);
    }

    if (filters.zone_id) {
      query += ' AND sp.zone_id = ?';
      values.push(filters.zone_id);
    }

    if (filters.created_by_manager_id) {
      // Strict scoping: only allocations created by this manager
      query += ' AND sa.created_by_manager_id = ?';
      values.push(filters.created_by_manager_id);
    } else if (filters.manager_id) {
      // Fallback: scope by zone ownership
      query += ' AND z.manager_id = ?';
      values.push(filters.manager_id);
    }

    if (filters.date_from) {
      query += ' AND DATE(p.payment_date) >= ?';
      values.push(filters.date_from);
    }

    if (filters.date_to) {
      query += ' AND DATE(p.payment_date) <= ?';
      values.push(filters.date_to);
    }

    const limit = filters.limit || 100;
    const offset = filters.offset || 0;
    
    query += ' ORDER BY p.payment_date DESC LIMIT ? OFFSET ?';
    values.push(limit, offset);

    const [rows] = await db.query(query, values);
    return rows;
  }

  static async findById(paymentId) {
    const [rows] = await db.query(`
      SELECT 
        p.*,
        s.full_name as seller_name,
        s.business_name,
        u.phone_number as seller_phone,
        sp.space_number,
        sp.space_type,
        z.zone_name,
        z.zone_code,
        sa.allocation_type,
        z.manager_id as manager_id
      FROM payments p
      JOIN sellers s ON p.seller_id = s.seller_id
      JOIN users u ON s.user_id = u.user_id
      JOIN space_allocations sa ON p.allocation_id = sa.allocation_id
      JOIN spaces sp ON sa.space_id = sp.space_id
      JOIN zones z ON sp.zone_id = z.zone_id
      WHERE p.payment_id = ?
    `, [paymentId]);
    return rows[0];
  }

  static async create(paymentData) {
    const {
      allocation_id,
      seller_id,
      amount,
      payment_date,
      payment_method,
      payment_reference,
      payment_period_start,
      payment_period_end,
      status = 'completed',
      processed_by,
      mobile_money_number,
      mobile_money_provider,
      transaction_id,
      notes
    } = paymentData;

    const [result] = await db.query(
      `INSERT INTO payments 
       (allocation_id, seller_id, amount, payment_date, payment_method,
        payment_reference, payment_period_start, payment_period_end, status,
        processed_by, mobile_money_number, mobile_money_provider, 
        transaction_id, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [allocation_id, seller_id, amount, payment_date, payment_method,
       payment_reference, payment_period_start, payment_period_end, status,
       processed_by, mobile_money_number, mobile_money_provider,
       transaction_id, notes]
    );

    return result.insertId;
  }

  static async update(paymentId, updates) {
    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) return false;

    values.push(paymentId);
    const [result] = await db.query(
      `UPDATE payments SET ${fields.join(', ')} WHERE payment_id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  static async updateStatus(paymentId, status) {
    const [result] = await db.query(
      'UPDATE payments SET status = ? WHERE payment_id = ?',
      [status, paymentId]
    );
    return result.affectedRows > 0;
  }

  static async getTotalRevenue(filters = {}) {
    let query = `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM payments
      WHERE status = 'completed'
    `;
    const values = [];

    if (filters.date_from) {
      query += ' AND DATE(payment_date) >= ?';
      values.push(filters.date_from);
    }

    if (filters.date_to) {
      query += ' AND DATE(payment_date) <= ?';
      values.push(filters.date_to);
    }

    const [rows] = await db.query(query, values);
    return rows[0].total;
  }

  static async getRevenueByZone(filters = {}) {
    let query = `
      SELECT 
        z.zone_name,
        z.zone_code,
        COUNT(DISTINCT p.payment_id) as payment_count,
        COALESCE(SUM(p.amount), 0) as total_revenue
      FROM payments p
      JOIN space_allocations sa ON p.allocation_id = sa.allocation_id
      JOIN spaces sp ON sa.space_id = sp.space_id
      JOIN zones z ON sp.zone_id = z.zone_id
      WHERE p.status = 'completed'
    `;
    const values = [];

    if (filters.date_from) {
      query += ' AND DATE(p.payment_date) >= ?';
      values.push(filters.date_from);
    }

    if (filters.date_to) {
      query += ' AND DATE(p.payment_date) <= ?';
      values.push(filters.date_to);
    }

    query += ' GROUP BY z.zone_id ORDER BY total_revenue DESC';

    const [rows] = await db.query(query, values);
    return rows;
  }

  static async getRevenueByMethod(filters = {}) {
    let query = `
      SELECT 
        payment_method,
        COUNT(*) as payment_count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM payments
      WHERE status = 'completed'
    `;
    const values = [];

    if (filters.date_from) {
      query += ' AND DATE(payment_date) >= ?';
      values.push(filters.date_from);
    }

    if (filters.date_to) {
      query += ' AND DATE(payment_date) <= ?';
      values.push(filters.date_to);
    }

    query += ' GROUP BY payment_method';

    const [rows] = await db.query(query, values);
    return rows;
  }

  static async getSellerPaymentHistory(sellerId) {
    const [rows] = await db.query(`
      SELECT 
        p.*,
        sp.space_number,
        z.zone_name,
        sa.allocation_type
      FROM payments p
      JOIN space_allocations sa ON p.allocation_id = sa.allocation_id
      JOIN spaces sp ON sa.space_id = sp.space_id
      JOIN zones z ON sp.zone_id = z.zone_id
      WHERE p.seller_id = ?
      ORDER BY p.payment_date DESC
    `, [sellerId]);
    return rows;
  }
}

export { Allocation, Payment };