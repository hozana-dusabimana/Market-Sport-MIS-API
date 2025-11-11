import db from '../config/database.js';
import User from '../models/User.model.js';
import bcrypt from 'bcryptjs';
import config from '../config/config.js'; // Adjust if config structure differs

class UserController {
  // Get all users with filters (for admins/managers)
  // Updated getAllUsers method in UserController
async getAllUsers(req, res) {
  try {
    const { id } = req.query; // Extract id from query params

    if (id) {
      // If id is provided, fetch single user (treat as single-item list)
      const user = await User.findWithProfile(id);

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Return as a list with pagination (total=1, page=1, etc.)
      return res.json({
        success: true,
        data: {
          users: [user],
          pagination: {
            page: 1,
            limit: 1,
            total: 1,
            pages: 1
          }
        }
      });
    }

    // Original list logic for no id or other filters
    const filters = {
      user_type: req.query.user_type,
      status: req.query.status,
      search: req.query.search,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    };

    const users = await User.findAll(filters);
    const total = await User.count(filters);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          pages: Math.ceil(total / filters.limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
  }
}

  // Get user by ID with profile
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findWithProfile(id);

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch user', error: error.message });
    }
  }

  // Create a new user (admin/manager only, similar to register but without password in request)
  async createUser(req, res) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const {
        username,
        email,
        password,
        phone_number,
        user_type,
        full_name,
        id_number,
        department,
        permissions,
        assigned_zones,
        employment_date,
        business_name,
        business_type,
        tin_number,
        emergency_contact,
        address,
        registration_date,
        status = 'active'
      } = req.body;

      if (!username || !email || !password || !phone_number || !user_type) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      if (!['admin', 'manager', 'seller'].includes(user_type)) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'Invalid user type' });
      }

      // Check existence using model
      const exists = await User.exists(username, email, connection);
      if (exists) {
        await connection.rollback();
        return res.status(409).json({ success: false, message: 'Username or email already exists' });
      }

      const idCheckTable = user_type === 'admin' ? 'admins' : 
                          user_type === 'manager' ? 'managers' : 'sellers';
      const [existingId] = await connection.query(
        `SELECT * FROM ${idCheckTable} WHERE id_number = ?`,
        [id_number]
      );

      if (existingId.length > 0) {
        await connection.rollback();
        return res.status(409).json({ success: false, message: 'ID number already registered' });
      }

      const password_hash = await bcrypt.hash(password, config.bcrypt.rounds);

      const userId = await User.create({
        username,
        email,
        password_hash,
        phone_number,
        user_type,
        status
      }, connection);

      let profileId;
      switch (user_type) {
        case 'admin':
          const [adminResult] = await connection.query(
            `INSERT INTO admins (user_id, full_name, id_number, department, permissions) 
             VALUES (?, ?, ?, ?, ?)`,
            [userId, full_name || null, id_number, department || null, permissions ? JSON.stringify(permissions) : null]
          );
          profileId = adminResult.insertId;
          break;
        case 'manager':
          const [managerResult] = await connection.query(
            `INSERT INTO managers (user_id, full_name, id_number, assigned_zones, employment_date) 
             VALUES (?, ?, ?, ?, ?)`,
            [userId, full_name || null, id_number, assigned_zones ? JSON.stringify(assigned_zones) : null, employment_date || new Date().toISOString().split('T')[0]]
          );
          profileId = managerResult.insertId;
          break;
        case 'seller':
          const [sellerResult] = await connection.query(
            `INSERT INTO sellers (user_id, full_name, id_number, business_name, business_type, tin_number, emergency_contact, address, registration_date, verification_status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [userId, full_name || null, id_number, business_name || null, business_type || null, tin_number || null, emergency_contact || null, address || null, registration_date || new Date().toISOString().split('T')[0]]
          );
          profileId = sellerResult.insertId;
          break;
      }

      await connection.commit();

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: { userId, username, email, user_type, profileId }
      });

    } catch (error) {
      await connection.rollback();
      console.error('Create user error:', error);
      res.status(500).json({ success: false, message: 'Failed to create user', error: error.message });
    } finally {
      connection.release();
    }
  }
// Update user (general updates to users table and profile)
async updateUser(req, res) {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const userId = req.params.id;
    const updates = req.body; // { username, email, phone_number, status, ... profile fields }

    // First, check if user exists
    const user = await User.findById(userId, connection);
    if (!user) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user_type = user.user_type;

    // Update users table fields
    const userFields = ['username', 'email', 'phone_number', 'status', 'profile_photo'];
    const userUpdate = {};
    let hasUserChanges = false;
    userFields.forEach(field => {
      if (updates[field] !== undefined) {
        if (updates[field] !== user[field]) {
          userUpdate[field] = updates[field];
          hasUserChanges = true;
        }
      }
    });

    let updated = false;

    // Update user if changes detected
    if (hasUserChanges) {
      const updatedUser = await User.update(userId, userUpdate, connection);
      if (!updatedUser) {
        await connection.rollback();
        return res.status(500).json({ success: false, message: 'Failed to update user' });
      }
      updated = true;
    }

    // Update profile table fields (check if profile exists; insert if not, update if yes)
    const profileTable = user_type === 'admin' ? 'admins' :
                        user_type === 'manager' ? 'managers' : 'sellers';
    
    const profileFields = {
      admin: ['full_name', 'id_number', 'department', 'permissions'],
      manager: ['full_name', 'id_number', 'assigned_zones', 'employment_date'],
      seller: ['full_name', 'id_number', 'business_name', 'business_type', 'tin_number', 'emergency_contact', 'address', 'registration_date', 'verification_status']
    };

    // Fetch existing profile to compare
    const [existingProfiles] = await connection.query(`SELECT * FROM ${profileTable} WHERE user_id = ?`, [userId]);
    const existingProfile = existingProfiles.length > 0 ? existingProfiles[0] : null;

    const profileUpdate = {};
    let hasProfileChanges = false;

    if (existingProfile) {
      // Compare with existing profile
      profileFields[user_type].forEach(field => {
        if (updates[field] !== undefined) {
          let existingValue = existingProfile[field];
          let newValue = updates[field];

          // Handle JSON fields (permissions, assigned_zones)
          if (field === 'permissions' || field === 'assigned_zones') {
            try {
              existingValue = existingValue ? JSON.parse(existingValue) : null;
              if (JSON.stringify(newValue) !== JSON.stringify(existingValue)) {
                profileUpdate[field] = JSON.stringify(newValue);
                hasProfileChanges = true;
              }
            } catch (parseError) {
              // If parsing fails, treat as different
              profileUpdate[field] = JSON.stringify(newValue);
              hasProfileChanges = true;
            }
          } else {
            // Simple comparison for other fields
            if (newValue !== existingValue) {
              profileUpdate[field] = newValue;
              hasProfileChanges = true;
            }
          }
        }
      });
    } else {
      // No existing profile, any provided fields count as changes (will insert)
      profileFields[user_type].forEach(field => {
        if (updates[field] !== undefined) {
          if (field === 'permissions' || field === 'assigned_zones') {
            profileUpdate[field] = updates[field] ? JSON.stringify(updates[field]) : null;
          } else {
            profileUpdate[field] = updates[field];
          }
          hasProfileChanges = true;
        }
      });
    }

    if (Object.keys(profileUpdate).length > 0 && hasProfileChanges) {
      if (existingProfile) {
        // Update existing
        const profileFieldsStr = Object.keys(profileUpdate).map(key => `${key} = ?`).join(', ');
        const profileValues = Object.values(profileUpdate).concat(userId);
        const [profileResult] = await connection.query(
          `UPDATE ${profileTable} SET ${profileFieldsStr} WHERE user_id = ?`,
          profileValues
        );
        if (profileResult.affectedRows === 0) {
          throw new Error('Failed to update profile');
        }
      } else {
        // Insert new profile (minimal, based on type)
        let insertQuery, insertValues;
        switch (user_type) {
          case 'admin':
            insertQuery = `INSERT INTO admins (user_id, full_name, id_number, department, permissions) VALUES (?, ?, ?, ?, ?)`;
            insertValues = [userId, profileUpdate.full_name || null, profileUpdate.id_number || null, profileUpdate.department || null, profileUpdate.permissions || null];
            break;
          case 'manager':
            insertQuery = `INSERT INTO managers (user_id, full_name, id_number, assigned_zones, employment_date) VALUES (?, ?, ?, ?, ?)`;
            insertValues = [userId, profileUpdate.full_name || null, profileUpdate.id_number || null, profileUpdate.assigned_zones || null, profileUpdate.employment_date || new Date().toISOString().split('T')[0]];
            break;
          case 'seller':
            insertQuery = `INSERT INTO sellers (user_id, full_name, id_number, business_name, business_type, tin_number, emergency_contact, address, registration_date, verification_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            insertValues = [
              userId, profileUpdate.full_name || null, profileUpdate.id_number || null,
              profileUpdate.business_name || null, profileUpdate.business_type || null,
              profileUpdate.tin_number || null, profileUpdate.emergency_contact || null,
              profileUpdate.address || null, profileUpdate.registration_date || new Date().toISOString().split('T')[0],
              profileUpdate.verification_status || 'pending'
            ];
            break;
        }
        const [insertResult] = await connection.query(insertQuery, insertValues);
        if (!insertResult.insertId) {
          throw new Error('Failed to create profile');
        }
      }
      updated = true;
    }

    await connection.commit();

    res.json({
      success: true,
      message: updated ? 'User updated successfully' : 'No changes made'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
  } finally {
    connection.release();
  }
}

  // Update user status (suspend, activate, etc.)
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['active', 'suspended', 'inactive'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }

      const updated = await User.updateStatus(id, status);

      if (!updated) {
        return res.status(404).json({ success: false, message: 'User not found or no change' });
      }

      res.json({ success: true, message: `User status updated to ${status}` });
    } catch (error) {
      console.error('Update status error:', error);
      res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
    }
  }

  // Delete user
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // Optionally, soft delete by setting status to 'deleted', but here using hard delete as per model
      const deleted = await User.delete(id);

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete user', error: error.message });
    }
  }

  // Get user statistics by type
  async getStatistics(req, res) {
    try {
      const stats = await User.getStatistics();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get statistics error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch statistics', error: error.message });
    }
  }

  // Get count by user type
  async getCountByType(req, res) {
    try {
      const { user_type } = req.params;

      if (!['admin', 'manager', 'seller'].includes(user_type)) {
        return res.status(400).json({ success: false, message: 'Invalid user type' });
      }

      const count = await User.countByType(user_type);

      res.json({
        success: true,
        data: { user_type, count }
      });
    } catch (error) {
      console.error('Get count by type error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch count', error: error.message });
    }
  }
}

export default new UserController();