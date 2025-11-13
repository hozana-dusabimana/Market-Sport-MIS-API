import db from '../config/database.js';

class Space {
  // ✅ Get all spaces (filter by manager, zone, etc.)
  static async findAll(filters = {}) {
    let query = `
      SELECT s.*, z.zone_name, z.zone_code, z.manager_id as manager_id
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

    if (filters.manager_id) {
      query += ' AND s.manager_id = ?';
      values.push(filters.manager_id);
    }

    if (filters.search) {
      query += ' AND s.space_number LIKE ?';
      values.push(`%${filters.search}%`);
    }

    query += ' ORDER BY z.zone_name, s.space_number';

    const [rows] = await db.query(query, values);
    return rows;
  }

  // ✅ Find space by ID
  static async findById(spaceId) {
    const [rows] = await db.query(`
      SELECT s.*, z.zone_name, z.zone_code, z.manager_id
      FROM spaces s
      JOIN zones z ON s.zone_id = z.zone_id
      WHERE s.space_id = ?
    `, [spaceId]);
    return rows[0];
  }

  // ✅ Find available spaces
  static async findAvailable(filters = {}) {
    let query = `
      SELECT s.*, z.zone_name, z.zone_code, z.manager_id as manager_id
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

    if (filters.manager_id) {
      query += ' AND s.manager_id = ?';
      values.push(filters.manager_id);
    }

    query += ' ORDER BY z.zone_name, s.space_number';

    const [rows] = await db.query(query, values);
    return rows;
  }

  // ✅ Create new space (with manager_id)
 static async create(spaceData) {
  const {
    zone_id,
    manager_id,
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
    `INSERT INTO spaces (
      zone_id, manager_id, space_number, space_type, size_sqm,
      daily_rate, weekly_rate, monthly_rate, features, status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [zone_id, manager_id, space_number, space_type, size_sqm,
     daily_rate, weekly_rate, monthly_rate, features, status]
  );

  // Update zone total spaces count
  await db.query(
    'UPDATE zones SET total_spaces = total_spaces + 1 WHERE zone_id = ?',
    [zone_id]
  );

  return result.insertId;
}


  // ✅ Update space details
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

  // ✅ Update space status only
  static async updateStatus(spaceId, status) {
    const [result] = await db.query(
      'UPDATE spaces SET status = ? WHERE space_id = ?',
      [status, spaceId]
    );
    return result.affectedRows > 0;
  }

  // ✅ Delete a space and update zone total
  static async delete(spaceId) {
    const space = await this.findById(spaceId);

    const [result] = await db.query(
      'DELETE FROM spaces WHERE space_id = ?',
      [spaceId]
    );

    if (result.affectedRows > 0 && space) {
      await db.query(
        'UPDATE zones SET total_spaces = total_spaces - 1 WHERE zone_id = ?',
        [space.zone_id]
      );
    }

    return result.affectedRows > 0;
  }

  // ✅ Get current active allocation
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

  // ✅ Get allocation history
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

  // ✅ Check if space is available within a date range
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

export { Space };
export default Space;
