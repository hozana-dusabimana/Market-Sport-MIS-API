const db = require('../config/database');
const Seller = require('../models/Seller.model'); // Adjust path as needed

class SellerController {
  // Get all sellers with filters and pagination
  // Get all sellers with filters and pagination
  async getAllSellers(req, res) {
    try {
      const { id } = req.query; // Extract id from query params

      if (id) {
        // If id is provided, fetch single seller (treat as single-item list)
        const seller = await Seller.findWithUser(id);

        if (!seller) {
          return res.status(404).json({ success: false, message: 'Seller not found' });
        }

        // Return as a list with pagination (total=1, page=1, etc.)
        return res.json({
          success: true,
          data: {
            sellers: [seller],
            pagination: {
              page: 1,
              limit: 1,
              total: 1,
              pages: 1
            }
          }
        });
      }

      const filters = {
        verification_status: req.query.verification_status,
        business_type: req.query.business_type,
        search: req.query.search,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50
      };

      // Build count query for pagination
      let countQuery = `
        SELECT COUNT(*) as total
        FROM sellers s
        JOIN users u ON s.user_id = u.user_id
        WHERE 1=1
      `;
      let countValues = [];

      if (filters.verification_status) {
        countQuery += ' AND s.verification_status = ?';
        countValues.push(filters.verification_status);
      }

      if (filters.business_type) {
        countQuery += ' AND s.business_type = ?';
        countValues.push(filters.business_type);
      }

      if (filters.search) {
        countQuery += ' AND (s.full_name LIKE ? OR s.business_name LIKE ? OR s.id_number LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        countValues.push(searchTerm, searchTerm, searchTerm);
      }

      const [countResult] = await db.query(countQuery, countValues);
      const total = countResult[0].total;

      // Adjust filters for findAll (uses offset)
      filters.offset = (filters.page - 1) * filters.limit;

      const sellers = await Seller.findAll(filters);

      res.json({
        success: true,
        data: {
          sellers,
          pagination: {
            page: filters.page,
            limit: filters.limit,
            total,
            pages: Math.ceil(total / filters.limit)
          }
        }
      });
    } catch (error) {
      console.error('Get all sellers error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch sellers', error: error.message });
    }
  }
  

  // Get seller by ID with user info
  async getSellerById(req, res) {
    try {
      const { id } = req.params;
      const seller = await Seller.findWithUser(id);

      if (!seller) {
        return res.status(404).json({ success: false, message: 'Seller not found' });
      }

      res.json({
        success: true,
        data: seller
      });
    } catch (error) {
      console.error('Get seller by ID error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch seller', error: error.message });
    }
  }

  // Create a new seller profile (for existing user of type 'seller')
  async createSeller(req, res) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const {
        user_id,
        full_name,
        id_number,
        business_name,
        business_type,
        tin_number,
        emergency_contact,
        address,
        registration_date,
        verification_status = 'pending'
      } = req.body;

      if (!user_id || !full_name || !id_number || !business_name || !business_type) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      // Check if user exists and is of type 'seller'
      const [userRows] = await connection.query(
        'SELECT * FROM users WHERE user_id = ? AND user_type = ?',
        [user_id, 'seller']
      );
      if (userRows.length === 0) {
        await connection.rollback();
        return res.status(409).json({ success: false, message: 'User not found or not a seller type' });
      }

      // Check if seller profile already exists
      const existingSeller = await Seller.findByUserId(user_id);
      if (existingSeller) {
        await connection.rollback();
        return res.status(409).json({ success: false, message: 'Seller profile already exists for this user' });
      }

      // Check ID number uniqueness
      const idExists = await Seller.idNumberExists(id_number);
      if (idExists) {
        await connection.rollback();
        return res.status(409).json({ success: false, message: 'ID number already registered' });
      }

      const sellerId = await Seller.create({
        user_id,
        full_name,
        id_number,
        business_name,
        business_type,
        tin_number,
        emergency_contact,
        address,
        registration_date,
        verification_status
      });

      await connection.commit();

      res.status(201).json({
        success: true,
        message: 'Seller created successfully',
        data: { sellerId, user_id }
      });

    } catch (error) {
      await connection.rollback();
      console.error('Create seller error:', error);
      res.status(500).json({ success: false, message: 'Failed to create seller', error: error.message });
    } finally {
      connection.release();
    }
  }

  // Update seller profile
  async updateSeller(req, res) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const sellerId = req.params.id;
      const updates = req.body;

      // Check if seller exists
      const seller = await Seller.findById(sellerId);
      if (!seller) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: 'Seller not found' });
      }

      const userId = seller.user_id;

      // Update users table if user fields are provided (e.g., username, email, etc.)
      const userFields = ['username', 'email', 'phone_number', 'status', 'profile_photo'];
      const userUpdate = {};
      let hasUserChanges = false;

      // Fetch current user to compare
      const [currentUser] = await connection.query('SELECT * FROM users WHERE user_id = ?', [userId]);

      userFields.forEach(field => {
        if (updates[field] !== undefined && updates[field] !== currentUser[0][field]) {
          userUpdate[field] = updates[field];
          hasUserChanges = true;
        }
      });

      let updated = false;

      if (hasUserChanges) {
        // Update user table
        const userFieldsStr = Object.keys(userUpdate).map(key => `${key} = ?`).join(', ');
        const userValues = Object.values(userUpdate).concat(userId);
        const [userResult] = await connection.query(
          `UPDATE users SET ${userFieldsStr} WHERE user_id = ?`,
          userValues
        );
        if (userResult.affectedRows === 0) {
          throw new Error('Failed to update user details');
        }
        updated = true;
      }

      // Update seller profile fields
      const sellerFields = [
        'full_name', 'id_number', 'business_name', 'business_type',
        'tin_number', 'emergency_contact', 'address', 'registration_date',
        'verification_status'
      ];

      const sellerUpdate = {};
      let hasSellerChanges = false;

      sellerFields.forEach(field => {
        if (updates[field] !== undefined && updates[field] !== seller[field]) {
          sellerUpdate[field] = updates[field];
          hasSellerChanges = true;
        }
      });

      if (hasSellerChanges) {
        const updatedSeller = await Seller.update(sellerId, sellerUpdate);
        if (!updatedSeller) {
          throw new Error('Failed to update seller profile');
        }
        updated = true;
      }

      await connection.commit();

      res.json({
        success: true,
        message: updated ? 'Seller updated successfully' : 'No changes made'
      });

    } catch (error) {
      await connection.rollback();
      console.error('Update seller error:', error);
      res.status(500).json({ success: false, message: 'Failed to update seller', error: error.message });
    } finally {
      connection.release();
    }
  }

  // Update verification status
  async updateVerificationStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['pending', 'verified', 'rejected'].includes(status)) { // Assuming possible statuses
        return res.status(400).json({ success: false, message: 'Invalid verification status' });
      }

      const updated = await Seller.updateVerificationStatus(id, status);

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Seller not found or no change' });
      }

      res.json({ success: true, message: `Verification status updated to ${status}` });
    } catch (error) {
      console.error('Update verification status error:', error);
      res.status(500).json({ success: false, message: 'Failed to update verification status', error: error.message });
    }
  }

  // Delete seller
  async deleteSeller(req, res) {
    try {
      const { id } = req.params;

      const deleted = await Seller.delete(id);

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Seller not found' });
      }

      res.json({ success: true, message: 'Seller deleted successfully' });
    } catch (error) {
      console.error('Delete seller error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete seller', error: error.message });
    }
  }

  // Get seller allocations
  async getAllocations(req, res) {
    try {
      const { id } = req.params;
      const allocations = await Seller.getAllocations(id);

      res.json({
        success: true,
        data: allocations
      });
    } catch (error) {
      console.error('Get allocations error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch allocations', error: error.message });
    }
  }

  // Get seller payments
  async getPayments(req, res) {
    try {
      const { id } = req.params;
      const payments = await Seller.getPayments(id);

      res.json({
        success: true,
        data: payments
      });
    } catch (error) {
      console.error('Get payments error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch payments', error: error.message });
    }
  }

  // Get seller statistics
  async getStatistics(req, res) {
    try {
      const { id } = req.params;
      const stats = await Seller.getStatistics(id);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get statistics error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch statistics', error: error.message });
    }
  }

  // Count sellers by verification status
  async getCountByStatus(req, res) {
    try {
      const counts = await Seller.countByStatus();

      res.json({
        success: true,
        data: counts
      });
    } catch (error) {
      console.error('Get count by status error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch counts', error: error.message });
    }
  }
}

module.exports = new SellerController();