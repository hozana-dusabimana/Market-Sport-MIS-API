// ============================================
// src/models/Report.model.js
// Reports are generated on-the-fly from existing tables
// No storage needed - pure SQL aggregation queries
// ============================================
import db from '../config/database.js';

class Report {
  // Get daily summary
  static async getDailySummary(date, zoneId = null) {
    let query = `
      SELECT 
        ? as report_date,
        z.zone_id,
        z.zone_name,
        COUNT(DISTINCT sp.space_id) as total_spaces,
        COUNT(DISTINCT CASE WHEN sa.allocation_id IS NOT NULL AND DATE(sa.start_date) = ? THEN sp.space_id END) as occupied_spaces,
        ROUND((COUNT(DISTINCT CASE WHEN sa.allocation_id IS NOT NULL AND DATE(sa.start_date) = ? THEN sp.space_id END) / NULLIF(COUNT(DISTINCT sp.space_id), 0)) * 100, 2) as occupancy_rate,
        COALESCE(SUM(CASE WHEN p.status = 'completed' AND DATE(p.payment_date) = ? THEN p.amount ELSE 0 END), 0) as total_revenue,
        COUNT(DISTINCT CASE WHEN DATE(p.payment_date) = ? THEN p.payment_id END) as total_payments
      FROM zones z
      JOIN spaces sp ON z.zone_id = sp.zone_id
      LEFT JOIN space_allocations sa ON sp.space_id = sa.space_id
      LEFT JOIN payments p ON sa.allocation_id = p.allocation_id
      WHERE 1=1
    `;
    
    const values = [date, date, date, date, date];

    if (zoneId) {
      query += ' AND z.zone_id = ?';
      values.push(zoneId);
    }

    query += ' GROUP BY z.zone_id HAVING (occupied_spaces > 0 OR total_payments > 0 OR total_revenue > 0) ORDER BY z.zone_name';

    const [rows] = await db.query(query, values);
    return rows;
  }

  // Get weekly summary
  static async getWeeklySummary(startDate, endDate, zoneId = null) {
    let query = `
      SELECT 
        ? as period_start,
        ? as period_end,
        z.zone_id,
        z.zone_name,
        COUNT(DISTINCT sp.space_id) as total_spaces,
        COUNT(DISTINCT CASE WHEN sa.allocation_id IS NOT NULL THEN sp.space_id END) as occupied_spaces,
        ROUND((COUNT(DISTINCT CASE WHEN sa.allocation_id IS NOT NULL THEN sp.space_id END) / COUNT(DISTINCT sp.space_id)) * 100, 2) as occupancy_rate,
        SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_revenue,
        COUNT(DISTINCT p.payment_id) as total_payments
      FROM zones z
      JOIN spaces sp ON z.zone_id = sp.zone_id
      LEFT JOIN space_allocations sa ON sp.space_id = sa.space_id AND sa.start_date BETWEEN ? AND ?
      LEFT JOIN payments p ON sa.allocation_id = p.allocation_id AND p.payment_date BETWEEN ? AND ?
      WHERE 1=1
    `;
    
    const values = [startDate, endDate, startDate, endDate, startDate, endDate];

    if (zoneId) {
      query += ' AND z.zone_id = ?';
      values.push(zoneId);
    }

    query += ' GROUP BY z.zone_id ORDER BY z.zone_name';

    const [rows] = await db.query(query, values);
    return rows;
  }

  // Get monthly summary
  static async getMonthlySummary(year, month, zoneId = null) {
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const monthEnd = new Date(year, month, 0).toISOString().split('T')[0];

    let query = `
      SELECT 
        ? as period_start,
        ? as period_end,
        z.zone_id,
        z.zone_name,
        COUNT(DISTINCT sp.space_id) as total_spaces,
        COUNT(DISTINCT CASE WHEN sa.allocation_id IS NOT NULL AND sa.start_date BETWEEN ? AND ? THEN sp.space_id END) as occupied_spaces,
        ROUND((COUNT(DISTINCT CASE WHEN sa.allocation_id IS NOT NULL AND sa.start_date BETWEEN ? AND ? THEN sp.space_id END) / NULLIF(COUNT(DISTINCT sp.space_id), 0)) * 100, 2) as occupancy_rate,
        COALESCE(SUM(CASE WHEN p.status = 'completed' AND p.payment_date BETWEEN ? AND ? THEN p.amount ELSE 0 END), 0) as total_revenue,
        COUNT(DISTINCT CASE WHEN p.payment_date BETWEEN ? AND ? THEN p.payment_id END) as total_payments,
        COUNT(DISTINCT CASE WHEN sa.start_date BETWEEN ? AND ? THEN s.seller_id END) as unique_sellers
      FROM zones z
      JOIN spaces sp ON z.zone_id = sp.zone_id
      LEFT JOIN space_allocations sa ON sp.space_id = sa.space_id
      LEFT JOIN sellers s ON sa.seller_id = s.seller_id
      LEFT JOIN payments p ON sa.allocation_id = p.allocation_id
      WHERE 1=1
    `;
    
    const values = [monthStart, monthEnd, monthStart, monthEnd, monthStart, monthEnd, monthStart, monthEnd, monthStart, monthEnd, monthStart, monthEnd];

    if (zoneId) {
      query += ' AND z.zone_id = ?';
      values.push(zoneId);
    }

    query += ' GROUP BY z.zone_id HAVING (occupied_spaces > 0 OR total_payments > 0 OR total_revenue > 0) ORDER BY z.zone_name';

    const [rows] = await db.query(query, values);
    return rows;
  }

  // Get occupancy report
  static async getOccupancyReport(startDate, endDate, zoneId = null) {
    let query = `
      SELECT 
        z.zone_id,
        z.zone_name,
        COUNT(DISTINCT sp.space_id) as total_spaces,
        SUM(CASE WHEN sp.status = 'available' THEN 1 ELSE 0 END) as available_spaces,
        SUM(CASE WHEN sp.status = 'occupied' THEN 1 ELSE 0 END) as occupied_spaces,
        SUM(CASE WHEN sp.status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_spaces,
        ROUND(SUM(CASE WHEN sp.status = 'occupied' THEN 1 ELSE 0 END) / COUNT(DISTINCT sp.space_id) * 100, 2) as occupancy_rate
      FROM zones z
      JOIN spaces sp ON z.zone_id = sp.zone_id
      WHERE 1=1
    `;

    const values = [];

    if (zoneId) {
      query += ' AND z.zone_id = ?';
      values.push(zoneId);
    }

    query += ' GROUP BY z.zone_id ORDER BY z.zone_name';

    const [rows] = await db.query(query, values);
    return rows;
  }

  // Get revenue/payment report
  static async getRevenueReport(startDate, endDate, zoneId = null) {
    let query = `
      SELECT 
        p.payment_method,
        p.status,
        COUNT(p.payment_id) as transaction_count,
        SUM(p.amount) as total_amount,
        AVG(p.amount) as average_amount,
        MIN(p.amount) as min_amount,
        MAX(p.amount) as max_amount
      FROM payments p
      JOIN space_allocations sa ON p.allocation_id = sa.allocation_id
      JOIN spaces sp ON sa.space_id = sp.space_id
      WHERE p.payment_date BETWEEN ? AND ?
    `;

    const values = [startDate, endDate];

    if (zoneId) {
      query += ' AND sp.zone_id = ?';
      values.push(zoneId);
    }

    query += ' GROUP BY p.payment_method, p.status ORDER BY total_amount DESC';

    const [rows] = await db.query(query, values);
    return rows;
  }

  // Get top sellers
  static async getTopSellers(startDate, endDate, limit = 10) {
    const [rows] = await db.query(`
      SELECT 
        s.seller_id,
        s.full_name,
        s.business_name,
        u.phone_number,
        u.email,
        COUNT(DISTINCT sa.allocation_id) as total_allocations,
        COUNT(DISTINCT p.payment_id) as total_payments,
        SUM(p.amount) as total_revenue,
        AVG(p.amount) as average_payment
      FROM sellers s
      LEFT JOIN users u ON s.user_id = u.user_id
      LEFT JOIN space_allocations sa ON s.seller_id = sa.seller_id AND sa.start_date BETWEEN ? AND ?
      LEFT JOIN payments p ON sa.allocation_id = p.allocation_id AND p.payment_date BETWEEN ? AND ?
      GROUP BY s.seller_id
      ORDER BY total_revenue DESC
      LIMIT ?
    `, [startDate, endDate, startDate, endDate, limit]);

    return rows;
  }

  // Get zone statistics
  static async getZoneStatistics(startDate, endDate) {
    const [rows] = await db.query(`
      SELECT 
        z.zone_id,
        z.zone_name,
        COUNT(DISTINCT sp.space_id) as total_spaces,
        SUM(CASE WHEN sp.status = 'available' THEN 1 ELSE 0 END) as available_spaces,
        SUM(CASE WHEN sp.status = 'occupied' THEN 1 ELSE 0 END) as occupied_spaces,
        COUNT(DISTINCT sa.allocation_id) as total_allocations,
        COUNT(DISTINCT s.seller_id) as unique_sellers,
        ROUND(SUM(CASE WHEN sp.status = 'occupied' THEN 1 ELSE 0 END) / COUNT(DISTINCT sp.space_id) * 100, 2) as occupancy_rate,
        SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_revenue
      FROM zones z
      LEFT JOIN spaces sp ON z.zone_id = sp.zone_id
      LEFT JOIN space_allocations sa ON sp.space_id = sa.space_id AND sa.start_date BETWEEN ? AND ?
      LEFT JOIN sellers s ON sa.seller_id = s.seller_id
      LEFT JOIN payments p ON sa.allocation_id = p.allocation_id AND p.payment_date BETWEEN ? AND ? AND p.status = 'completed'
      GROUP BY z.zone_id
      ORDER BY z.zone_name
    `, [startDate, endDate, startDate, endDate]);

    return rows;
  }

  // Get allocation summary
  static async getAllocationSummary(startDate, endDate) {
    const [rows] = await db.query(`
      SELECT 
        z.zone_id,
        z.zone_name,
        COUNT(DISTINCT sa.allocation_id) as total_allocations,
        COUNT(DISTINCT CASE WHEN sa.status = 'active' THEN sa.allocation_id END) as active_allocations,
        COUNT(DISTINCT CASE WHEN sa.status = 'pending' THEN sa.allocation_id END) as pending_allocations,
        COUNT(DISTINCT CASE WHEN sa.status = 'terminated' THEN sa.allocation_id END) as terminated_allocations,
        COUNT(DISTINCT sa.seller_id) as unique_sellers
      FROM space_allocations sa
      JOIN spaces sp ON sa.space_id = sp.space_id
      JOIN zones z ON sp.zone_id = z.zone_id
      WHERE sa.start_date BETWEEN ? AND ?
      GROUP BY z.zone_id
      ORDER BY z.zone_name
    `, [startDate, endDate]);

    return rows;
  }
}

export default Report;
