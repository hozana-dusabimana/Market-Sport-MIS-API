// ============================================
// src/models/Zone.model.js
// ============================================
import db from '../config/database.js';

class Zone {
  static async findAll(filters = {}) {
    let query = `
      SELECT z.*, m.full_name as manager_name, u.username as manager_username
      FROM zones z
      LEFT JOIN managers m ON z.manager_id = m.manager_id
      LEFT JOIN users u ON m.user_id = u.user_id
      WHERE 1=1
    `;
    const values = [];

    if (filters.status) {
      query += ' AND z.status = ?';
      values.push(filters.status);
    }

    if (filters.manager_id) {
      query += ' AND z.manager_id = ?';
      values.push(filters.manager_id);
    }

    if (filters.search) {
      query += ' AND (z.zone_name LIKE ? OR z.zone_code LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      values.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY z.zone_name';

    const [rows] = await db.query(query, values);
    return rows;
  }

  static async findById(zoneId) {
    const [rows] = await db.query(`
      SELECT z.*, m.full_name as manager_name, u.username as manager_username
      FROM zones z
      LEFT JOIN managers m ON z.manager_id = m.manager_id
      LEFT JOIN users u ON m.user_id = u.user_id
      WHERE z.zone_id = ?
    `, [zoneId]);
    return rows[0];
  }

  static async findByCode(zoneCode) {
    const [rows] = await db.query(
      'SELECT * FROM zones WHERE zone_code = ?',
      [zoneCode]
    );
    return rows[0];
  }

  static async create(zoneData) {
    const {
      zone_name,
      zone_code,
      description,
      manager_id,
      total_spaces = 0,
      status = 'active'
    } = zoneData;

    const [result] = await db.query(
      `INSERT INTO zones (zone_name, zone_code, description, manager_id, total_spaces, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [zone_name, zone_code, description, manager_id, total_spaces, status]
    );

    return result.insertId;
  }

  static async update(zoneId, updates) {
    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) return false;

    values.push(zoneId);
    const [result] = await db.query(
      `UPDATE zones SET ${fields.join(', ')} WHERE zone_id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  static async delete(zoneId) {
    const [result] = await db.query(
      'DELETE FROM zones WHERE zone_id = ?',
      [zoneId]
    );
    return result.affectedRows > 0;
  }

  static async updateOccupancy(zoneId) {
    await db.query(`
      UPDATE zones z
      SET occupied_spaces = (
        SELECT COUNT(*) 
        FROM spaces s 
        WHERE s.zone_id = z.zone_id AND s.status = 'occupied'
      )
      WHERE z.zone_id = ?
    `, [zoneId]);
  }

  static async getSpaces(zoneId) {
    const [rows] = await db.query(
      'SELECT * FROM spaces WHERE zone_id = ? ORDER BY space_number',
      [zoneId]
    );
    return rows;
  }

  static async getStatistics(zoneId) {
    const [stats] = await db.query(`
      SELECT 
        z.total_spaces,
        z.occupied_spaces,
        COUNT(DISTINCT sa.allocation_id) as total_allocations,
        COUNT(DISTINCT sa.seller_id) as unique_sellers,
        COALESCE(SUM(p.amount), 0) as total_revenue
      FROM zones z
      LEFT JOIN spaces sp ON z.zone_id = sp.zone_id
      LEFT JOIN space_allocations sa ON sp.space_id = sa.space_id
      LEFT JOIN payments p ON sa.allocation_id = p.allocation_id AND p.status = 'completed'
      WHERE z.zone_id = ?
      GROUP BY z.zone_id
    `, [zoneId]);
    
    return stats[0];
  }
}

// ============================================
// src/models/Space.model.js
// ============================================
class Space {
  static async findAll(filters = {}) {
    let query = `
      SELECT s.*, z.zone_name, z.zone_code
      FROM spaces s
      JOIN zones z ON s.zone_id = z.zone_id
      WHERE 1=1
    `;
    const values = [];

    if (filters.zone_id) {
      query += ' AND s.zone_id = ?';
      values.push(filters.zone_id);
    }

    if (filters.status) {
      query += ' AND s.status = ?';
      values.push(filters.status);
    }

    if (filters.space_type) {
      query += ' AND s.space_type = ?';
      values.push(filters.space_type);
    }

    if (filters.search) {
      query += ' AND s.space_number LIKE ?';
      values.push(`%${filters.search}%`);
    }

    query += ' ORDER BY z.zone_name, s.space_number';

    const [rows] = await db.query(query, values);
    return rows;
  }

  static async findById(spaceId) {
    const [rows] = await db.query(`
      SELECT s.*, z.zone_name, z.zone_code, z.manager_id
      FROM spaces s
      JOIN zones z ON s.zone_id = z.zone_id
      WHERE s.space_id = ?
    `, [spaceId]);
    return rows[0];
  }

  static async findAvailable(filters = {}) {
    let query = `
      SELECT s.*, z.zone_name, z.zone_code
      FROM spaces s
      JOIN zones z ON s.zone_id = z.zone_id
      WHERE s.status = 'available'
    `;
    const values = [];

    if (filters.zone_id) {
      query += ' AND s.zone_id = ?';
      values.push(filters.zone_id);
    }

    if (filters.space_type) {
      query += ' AND s.space_type = ?';
      values.push(filters.space_type);
    }

    query += ' ORDER BY z.zone_name, s.space_number';

    const [rows] = await db.query(query, values);
    return rows;
  }

  static async create(spaceData) {
    const {
      zone_id,
      space_number,
      space_type,
      size_sqm,
      daily_rate,
      weekly_rate,
      monthly_rate,
      features,
      status = 'available'
    } = spaceData;

    const [result] = await db.query(
      `INSERT INTO spaces (zone_id, space_number, space_type, size_sqm, daily_rate, 
        weekly_rate, monthly_rate, features, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [zone_id, space_number, space_type, size_sqm, daily_rate, 
       weekly_rate, monthly_rate, features, status]
    );

    // Update zone total spaces
    await db.query(
      'UPDATE zones SET total_spaces = total_spaces + 1 WHERE zone_id = ?',
      [zone_id]
    );

    return result.insertId;
  }

  static async update(spaceId, updates) {
    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) return false;

    values.push(spaceId);
    const [result] = await db.query(
      `UPDATE spaces SET ${fields.join(', ')} WHERE space_id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  static async updateStatus(spaceId, status) {
    const [result] = await db.query(
      'UPDATE spaces SET status = ? WHERE space_id = ?',
      [status, spaceId]
    );
    return result.affectedRows > 0;
  }

  static async delete(spaceId) {
    // Get zone_id before deleting
    const space = await this.findById(spaceId);
    
    const [result] = await db.query(
      'DELETE FROM spaces WHERE space_id = ?',
      [spaceId]
    );

    if (result.affectedRows > 0 && space) {
      // Update zone total spaces
      await db.query(
        'UPDATE zones SET total_spaces = total_spaces - 1 WHERE zone_id = ?',
        [space.zone_id]
      );
    }

    return result.affectedRows > 0;
  }

  static async getCurrentAllocation(spaceId) {
    const [rows] = await db.query(`
      SELECT sa.*, s.full_name as seller_name, u.username as seller_username
      FROM space_allocations sa
      JOIN sellers s ON sa.seller_id = s.seller_id
      JOIN users u ON s.user_id = u.user_id
      WHERE sa.space_id = ? AND sa.status = 'active'
      ORDER BY sa.start_date DESC
      LIMIT 1
    `, [spaceId]);
    return rows[0];
  }

  static async getAllocationHistory(spaceId) {
    const [rows] = await db.query(`
      SELECT sa.*, s.full_name as seller_name, u.username as seller_username
      FROM space_allocations sa
      JOIN sellers s ON sa.seller_id = s.seller_id
      JOIN users u ON s.user_id = u.user_id
      WHERE sa.space_id = ?
      ORDER BY sa.start_date DESC
    `, [spaceId]);
    return rows;
  }

  static async checkAvailability(spaceId, startDate, endDate) {
    const [rows] = await db.query(`
      SELECT COUNT(*) as count
      FROM space_allocations
      WHERE space_id = ?
        AND status = 'active'
        AND (
          (start_date <= ? AND (end_date IS NULL OR end_date >= ?))
          OR
          (start_date <= ? AND (end_date IS NULL OR end_date >= ?))
        )
    `, [spaceId, endDate, startDate, startDate, endDate]);
    
    return rows[0].count === 0;
  }
}

export { Zone, Space };