import Report from '../models/Report.model.js';

const reportController = {
  async generateDailyReport(req, res) {
    try {
      const { date, zone_id } = req.query;
      
      if (!date) {
        return res.status(400).json({ 
          success: false, 
          message: 'date parameter is required (format: YYYY-MM-DD)' 
        });
      }

      const selectedData = await Report.getDailySummary(date, zone_id);
      
      if (selectedData.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No data found for the specified date'
        });
      }

      const totalOccupancy = selectedData.length > 0 
        ? (selectedData.reduce((sum, z) => sum + (parseFloat(z.occupancy_rate) || 0), 0) / selectedData.length).toFixed(2)
        : 0;
      
      const totalRevenue = selectedData.reduce((sum, z) => sum + (parseFloat(z.total_revenue) || 0), 0);

      res.json({
        success: true,
        message: 'Daily report generated successfully',
        data: {
          report_type: 'daily',
          report_date: date,
          zones: selectedData,
          summary: {
            total_zones: selectedData.length,
            average_occupancy_rate: parseFloat(totalOccupancy),
            total_revenue: totalRevenue,
            total_payments: selectedData.reduce((sum, z) => sum + (z.total_payments || 0), 0),
            total_occupied_spaces: selectedData.reduce((sum, z) => sum + (z.occupied_spaces || 0), 0),
            total_spaces: selectedData.reduce((sum, z) => sum + (z.total_spaces || 0), 0)
          }
        }
      });
    } catch (error) {
      console.error('Error generating daily report:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to generate daily report', 
        error: error.message 
      });
    }
  },

  async generateWeeklyReport(req, res) {
    try {
      const { start_date, end_date, zone_id } = req.query;
      
      if (!start_date || !end_date) {
        return res.status(400).json({ 
          success: false, 
          message: 'start_date and end_date parameters are required' 
        });
      }

      const selectedData = await Report.getWeeklySummary(start_date, end_date, zone_id);
      
      if (selectedData.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No data found for the specified date range'
        });
      }

      const totalOccupancy = selectedData.length > 0 
        ? (selectedData.reduce((sum, z) => sum + (parseFloat(z.occupancy_rate) || 0), 0) / selectedData.length).toFixed(2)
        : 0;
      
      const totalRevenue = selectedData.reduce((sum, z) => sum + (parseFloat(z.total_revenue) || 0), 0);

      res.json({
        success: true,
        message: 'Weekly report generated successfully',
        data: {
          report_type: 'weekly',
          period_start: start_date,
          period_end: end_date,
          zones: selectedData,
          summary: {
            total_zones: selectedData.length,
            average_occupancy_rate: parseFloat(totalOccupancy),
            total_revenue: totalRevenue,
            total_payments: selectedData.reduce((sum, z) => sum + (z.total_payments || 0), 0),
            total_occupied_spaces: selectedData.reduce((sum, z) => sum + (z.occupied_spaces || 0), 0),
            total_spaces: selectedData.reduce((sum, z) => sum + (z.total_spaces || 0), 0)
          }
        }
      });
    } catch (error) {
      console.error('Error generating weekly report:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to generate weekly report', 
        error: error.message 
      });
    }
  },

  async generateMonthlyReport(req, res) {
    try {
      const { year, month, zone_id } = req.query;
      
      if (!year || !month) {
        return res.status(400).json({ 
          success: false, 
          message: 'year and month parameters are required' 
        });
      }

      const selectedData = await Report.getMonthlySummary(parseInt(year), parseInt(month), zone_id);
      
      if (selectedData.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No data found for the specified month'
        });
      }

      const totalOccupancy = selectedData.length > 0 
        ? (selectedData.reduce((sum, z) => sum + (parseFloat(z.occupancy_rate) || 0), 0) / selectedData.length).toFixed(2)
        : 0;
      
      const totalRevenue = selectedData.reduce((sum, z) => sum + (parseFloat(z.total_revenue) || 0), 0);

      res.json({
        success: true,
        message: 'Monthly report generated successfully',
        data: {
          report_type: 'monthly',
          year: parseInt(year),
          month: parseInt(month),
          zones: selectedData,
          summary: {
            total_zones: selectedData.length,
            average_occupancy_rate: parseFloat(totalOccupancy),
            total_revenue: totalRevenue,
            total_payments: selectedData.reduce((sum, z) => sum + (z.total_payments || 0), 0),
            total_sellers: selectedData.reduce((sum, z) => sum + (z.unique_sellers || 0), 0)
          }
        }
      });
    } catch (error) {
      console.error('Error generating monthly report:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to generate monthly report', 
        error: error.message 
      });
    }
  },

  async generateOccupancyReport(req, res) {
    try {
      const { start_date, end_date, zone_id } = req.query;
      
      if (!start_date || !end_date) {
        return res.status(400).json({ 
          success: false, 
          message: 'start_date and end_date parameters are required' 
        });
      }

      const selectedData = await Report.getOccupancyReport(start_date, end_date, zone_id);
      
      if (selectedData.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No data found for the specified parameters'
        });
      }

      const totalOccupancy = selectedData.length > 0 
        ? (selectedData.reduce((sum, z) => sum + (parseFloat(z.occupancy_rate) || 0), 0) / selectedData.length).toFixed(2)
        : 0;
      
      const totalSpaces = selectedData.reduce((sum, z) => sum + (z.total_spaces || 0), 0);
      const totalAvailable = selectedData.reduce((sum, z) => sum + (z.available_spaces || 0), 0);
      const totalOccupied = selectedData.reduce((sum, z) => sum + (z.occupied_spaces || 0), 0);
      const totalMaintenance = selectedData.reduce((sum, z) => sum + (z.maintenance_spaces || 0), 0);

      res.json({
        success: true,
        message: 'Occupancy report generated successfully',
        data: {
          report_type: 'occupancy',
          zones: selectedData,
          summary: {
            total_zones: selectedData.length,
            total_spaces: totalSpaces,
            available_spaces: totalAvailable,
            occupied_spaces: totalOccupied,
            maintenance_spaces: totalMaintenance,
            average_occupancy_rate: parseFloat(totalOccupancy)
          }
        }
      });
    } catch (error) {
      console.error('Error generating occupancy report:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to generate occupancy report', 
        error: error.message 
      });
    }
  },

  async generateRevenueReport(req, res) {
    try {
      const { start_date, end_date, zone_id } = req.query;
      
      if (!start_date || !end_date) {
        return res.status(400).json({ 
          success: false, 
          message: 'start_date and end_date parameters are required' 
        });
      }

      const selectedData = await Report.getRevenueReport(start_date, end_date, zone_id);
      
      if (selectedData.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No revenue data found for the specified date range'
        });
      }

      const totalRevenue = selectedData.reduce((sum, r) => sum + (parseFloat(r.total_amount) || 0), 0);
      const totalTransactions = selectedData.reduce((sum, r) => sum + (r.transaction_count || 0), 0);

      res.json({
        success: true,
        message: 'Revenue report generated successfully',
        data: {
          report_type: 'revenue',
          period_start: start_date,
          period_end: end_date,
          breakdown: selectedData,
          summary: {
            total_revenue: totalRevenue,
            total_transactions: totalTransactions,
            average_transaction: totalTransactions > 0 ? (totalRevenue / totalTransactions).toFixed(2) : 0
          }
        }
      });
    } catch (error) {
      console.error('Error generating revenue report:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to generate revenue report', 
        error: error.message 
      });
    }
  },

  async generateSellerReport(req, res) {
    try {
      const { start_date, end_date, limit } = req.query;
      
      if (!start_date || !end_date) {
        return res.status(400).json({ 
          success: false, 
          message: 'start_date and end_date parameters are required' 
        });
      }

      const selectedData = await Report.getTopSellers(start_date, end_date, limit || 10);
      
      if (selectedData.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No seller data found for the specified date range'
        });
      }

      const totalRevenue = selectedData.reduce((sum, s) => sum + (parseFloat(s.total_revenue) || 0), 0);
      const totalAllocations = selectedData.reduce((sum, s) => sum + (s.total_allocations || 0), 0);

      res.json({
        success: true,
        message: 'Seller report generated successfully',
        data: {
          report_type: 'seller',
          period_start: start_date,
          period_end: end_date,
          sellers: selectedData,
          summary: {
            total_sellers: selectedData.length,
            total_revenue: totalRevenue,
            total_allocations: totalAllocations,
            average_revenue_per_seller: selectedData.length > 0 ? (totalRevenue / selectedData.length).toFixed(2) : 0
          }
        }
      });
    } catch (error) {
      console.error('Error generating seller report:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to generate seller report', 
        error: error.message 
      });
    }
  },

  async getZoneStatistics(req, res) {
    try {
      const { start_date, end_date } = req.query;
      
      if (!start_date || !end_date) {
        return res.status(400).json({ 
          success: false, 
          message: 'start_date and end_date are required' 
        });
      }

      const data = await Report.getZoneStatistics(start_date, end_date);
      
      const totalRevenue = data.reduce((sum, z) => sum + (parseFloat(z.total_revenue) || 0), 0);
      const totalAllocations = data.reduce((sum, z) => sum + (z.total_allocations || 0), 0);
      const totalSellers = data.reduce((sum, z) => sum + (z.unique_sellers || 0), 0);

      res.json({
        success: true,
        message: 'Zone statistics fetched successfully',
        data: {
          zones: data,
          summary: {
            total_zones: data.length,
            total_revenue: totalRevenue,
            total_allocations: totalAllocations,
            total_unique_sellers: totalSellers
          }
        }
      });
    } catch (error) {
      console.error('Error getting zone statistics:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get zone statistics', 
        error: error.message 
      });
    }
  },

  async getAllocationSummary(req, res) {
    try {
      const { start_date, end_date } = req.query;
      
      if (!start_date || !end_date) {
        return res.status(400).json({ 
          success: false, 
          message: 'start_date and end_date are required' 
        });
      }

      const data = await Report.getAllocationSummary(start_date, end_date);
      
      const totalAllocations = data.reduce((sum, z) => sum + (z.total_allocations || 0), 0);
      const totalActive = data.reduce((sum, z) => sum + (z.active_allocations || 0), 0);
      const totalPending = data.reduce((sum, z) => sum + (z.pending_allocations || 0), 0);
      const totalTerminated = data.reduce((sum, z) => sum + (z.terminated_allocations || 0), 0);
      const totalSellers = data.reduce((sum, z) => sum + (z.unique_sellers || 0), 0);

      res.json({
        success: true,
        message: 'Allocation summary fetched successfully',
        data: {
          zones: data,
          summary: {
            total_zones: data.length,
            total_allocations: totalAllocations,
            active_allocations: totalActive,
            pending_allocations: totalPending,
            terminated_allocations: totalTerminated,
            total_unique_sellers: totalSellers
          }
        }
      });
    } catch (error) {
      console.error('Error getting allocation summary:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get allocation summary', 
        error: error.message 
      });
    }
  }
};

export default reportController;