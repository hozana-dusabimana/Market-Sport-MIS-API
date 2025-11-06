const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const config = require('../config/config');

class AuthController {
  // Register new user
  async register(req, res) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const {
        // Common fields
        username,
        email,
        password,
        phone_number,
        user_type,
        
        // Profile fields
        full_name,
        id_number,
        
        // Admin specific
        department,
        permissions,
        
        // Manager specific
        assigned_zones,
        employment_date,
        
        // Seller specific
        business_name,
        business_type,
        tin_number,
        emergency_contact,
        address,
        registration_date
      } = req.body;

      // Validate required fields
      if (!username || !email || !password || !phone_number || !user_type) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Validate user type
      if (!['admin', 'manager', 'seller'].includes(user_type)) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Invalid user type'
        });
      }

      // Check if username exists
      const [existingUser] = await connection.query(
        'SELECT user_id FROM users WHERE username = ? OR email = ?',
        [username, email]
      );

      if (existingUser.length > 0) {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: 'Username or email already exists'
        });
      }

      // Check if ID number exists
      const idCheckTable = user_type === 'admin' ? 'admins' : 
                          user_type === 'manager' ? 'managers' : 'sellers';
      const [existingId] = await connection.query(
        `SELECT * FROM ${idCheckTable} WHERE id_number = ?`,
        [id_number]
      );

      if (existingId.length > 0) {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: 'ID number already registered'
        });
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, config.bcrypt.rounds);

      // Insert user
      const [userResult] = await connection.query(
        `INSERT INTO users (username, email, password_hash, phone_number, user_type, status) 
         VALUES (?, ?, ?, ?, ?, 'active')`,
        [username, email, password_hash, phone_number, user_type]
      );

      const userId = userResult.insertId;

      // Insert role-specific profile
      let profileId;

      switch (user_type) {
        case 'admin':
          const [adminResult] = await connection.query(
            `INSERT INTO admins (user_id, full_name, id_number, department, permissions) 
             VALUES (?, ?, ?, ?, ?)`,
            [
              userId,
              full_name,
              id_number,
              department || null,
              permissions ? JSON.stringify(permissions) : null
            ]
          );
          profileId = adminResult.insertId;
          break;

        case 'manager':
          const [managerResult] = await connection.query(
            `INSERT INTO managers (user_id, full_name, id_number, assigned_zones, employment_date) 
             VALUES (?, ?, ?, ?, ?)`,
            [
              userId,
              full_name,
              id_number,
              assigned_zones ? JSON.stringify(assigned_zones) : null,
              employment_date || new Date().toISOString().split('T')[0]
            ]
          );
          profileId = managerResult.insertId;
          break;

        case 'seller':
          const [sellerResult] = await connection.query(
            `INSERT INTO sellers (
              user_id, full_name, id_number, business_name, business_type,
              tin_number, emergency_contact, address, registration_date, verification_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [
              userId,
              full_name,
              id_number,
              business_name || null,
              business_type || null,
              tin_number || null,
              emergency_contact || null,
              address || null,
              registration_date || new Date().toISOString().split('T')[0]
            ]
          );
          profileId = sellerResult.insertId;
          break;
      }

      await connection.commit();

      // Generate JWT token
      const token = jwt.sign(
        { userId, username, user_type },
        config.jwt.secret,
        { expiresIn: config.jwt.expire }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          userId,
          username,
          email,
          user_type,
          profileId,
          token
        }
      });

    } catch (error) {
      await connection.rollback();
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error.message
      });
    } finally {
      connection.release();
    }
  }

  // Login user
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required'
        });
      }

      // Get user
      const [users] = await db.query(
        'SELECT * FROM users WHERE username = ? OR email = ?',
        [username, username]
      );

      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const user = users[0];

      // Check if user is active
      if (user.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Account is suspended or inactive'
        });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password_hash);

      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Update last login
      await db.query(
        'UPDATE users SET last_login = NOW() WHERE user_id = ?',
        [user.user_id]
      );

      // Get profile data
      let profile = {};
      const profileTable = user.user_type === 'admin' ? 'admins' :
                          user.user_type === 'manager' ? 'managers' : 'sellers';
      
      const [profiles] = await db.query(
        `SELECT * FROM ${profileTable} WHERE user_id = ?`,
        [user.user_id]
      );

      if (profiles.length > 0) {
        profile = profiles[0];
      }

      // Generate token
      const token = jwt.sign(
        { 
          userId: user.user_id, 
          username: user.username, 
          user_type: user.user_type 
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expire }
      );

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          userId: user.user_id,
          username: user.username,
          email: user.email,
          phone_number: user.phone_number,
          user_type: user.user_type,
          profile,
          token
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  }

  // Get current user profile
  async getProfile(req, res) {
    try {
      const userId = req.user.userId;

      const [users] = await db.query(
        'SELECT user_id, username, email, phone_number, user_type, status, profile_photo, created_at, last_login FROM users WHERE user_id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const user = users[0];

      // Get profile data
      const profileTable = user.user_type === 'admin' ? 'admins' :
                          user.user_type === 'manager' ? 'managers' : 'sellers';
      
      const [profiles] = await db.query(
        `SELECT * FROM ${profileTable} WHERE user_id = ?`,
        [userId]
      );

      res.json({
        success: true,
        data: {
          ...user,
          profile: profiles[0] || {}
        }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get profile',
        error: error.message
      });
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const userId = req.user.userId;
      const {
        phone_number,
        profile_photo,
        full_name,
        department,
        assigned_zones,
        business_name,
        business_type,
        tin_number,
        emergency_contact,
        address
      } = req.body;

      // Update user table
      const updateFields = [];
      const updateValues = [];

      if (phone_number) {
        updateFields.push('phone_number = ?');
        updateValues.push(phone_number);
      }
      if (profile_photo) {
        updateFields.push('profile_photo = ?');
        updateValues.push(profile_photo);
      }

      if (updateFields.length > 0) {
        updateValues.push(userId);
        await connection.query(
          `UPDATE users SET ${updateFields.join(', ')} WHERE user_id = ?`,
          updateValues
        );
      }

      // Get user type
      const [users] = await connection.query(
        'SELECT user_type FROM users WHERE user_id = ?',
        [userId]
      );

      if (users.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const user_type = users[0].user_type;

      // Update profile table based on user type
      const profileFields = [];
      const profileValues = [];

      if (full_name) {
        profileFields.push('full_name = ?');
        profileValues.push(full_name);
      }

      switch (user_type) {
        case 'admin':
          if (department) {
            profileFields.push('department = ?');
            profileValues.push(department);
          }
          if (profileFields.length > 0) {
            profileValues.push(userId);
            await connection.query(
              `UPDATE admins SET ${profileFields.join(', ')} WHERE user_id = ?`,
              profileValues
            );
          }
          break;

        case 'manager':
          if (assigned_zones) {
            profileFields.push('assigned_zones = ?');
            profileValues.push(JSON.stringify(assigned_zones));
          }
          if (profileFields.length > 0) {
            profileValues.push(userId);
            await connection.query(
              `UPDATE managers SET ${profileFields.join(', ')} WHERE user_id = ?`,
              profileValues
            );
          }
          break;

        case 'seller':
          if (business_name) {
            profileFields.push('business_name = ?');
            profileValues.push(business_name);
          }
          if (business_type) {
            profileFields.push('business_type = ?');
            profileValues.push(business_type);
          }
          if (tin_number) {
            profileFields.push('tin_number = ?');
            profileValues.push(tin_number);
          }
          if (emergency_contact) {
            profileFields.push('emergency_contact = ?');
            profileValues.push(emergency_contact);
          }
          if (address) {
            profileFields.push('address = ?');
            profileValues.push(address);
          }
          if (profileFields.length > 0) {
            profileValues.push(userId);
            await connection.query(
              `UPDATE sellers SET ${profileFields.join(', ')} WHERE user_id = ?`,
              profileValues
            );
          }
          break;
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'Profile updated successfully'
      });

    } catch (error) {
      await connection.rollback();
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: error.message
      });
    } finally {
      connection.release();
    }
  }

  // Change password
  async changePassword(req, res) {
    try {
      const userId = req.user.userId;
      const { current_password, new_password } = req.body;

      if (!current_password || !new_password) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
      }

      // Get user
      const [users] = await db.query(
        'SELECT password_hash FROM users WHERE user_id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isValid = await bcrypt.compare(current_password, users[0].password_hash);

      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const new_password_hash = await bcrypt.hash(new_password, config.bcrypt.rounds);

      // Update password
      await db.query(
        'UPDATE users SET password_hash = ? WHERE user_id = ?',
        [new_password_hash, userId]
      );

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password',
        error: error.message
      });
    }
  }
}

module.exports = new AuthController();