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
        registration_date
      } = req.body;

      if (!username || !email || !password || !phone_number || !user_type) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      if (!['admin', 'manager', 'seller'].includes(user_type)) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'Invalid user type' });
      }

      const [existingUser] = await connection.query(
        'SELECT user_id FROM users WHERE username = ? OR email = ?',
        [username, email]
      );

      if (existingUser.length > 0) {
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

      const [userResult] = await connection.query(
        `INSERT INTO users (username, email, password_hash, phone_number, user_type, status) 
         VALUES (?, ?, ?, ?, ?, 'active')`,
        [username, email, password_hash, phone_number, user_type]
      );

      const userId = userResult.insertId;

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

      const token = jwt.sign(
        { userId, username, user_type },
        config.jwt.secret,
        { expiresIn: config.jwt.expire }
      );

      console.log('Registration token generated:', token.substring(0, 20) + '...'); // Debug log

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: { userId, username, email, user_type, profileId, token }
      });

    } catch (error) {
      await connection.rollback();
      console.error('Registration error:', error);
      res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
    } finally {
      connection.release();
    }
  }

  // Login user
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required' });
      }

      const [users] = await db.query(
        'SELECT * FROM users WHERE username = ? OR email = ?',
        [username, username]
      );

      if (users.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const user = users[0];

      if (user.status !== 'active') {
        return res.status(403).json({ success: false, message: 'Account is suspended or inactive' });
      }

      const isValid = await bcrypt.compare(password, user.password_hash);

      if (!isValid) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      await db.query('UPDATE users SET last_login = NOW() WHERE user_id = ?', [user.user_id]);

      let profile = {};
      const profileTable = user.user_type === 'admin' ? 'admins' :
                          user.user_type === 'manager' ? 'managers' : 'sellers';
      
      const [profiles] = await db.query(`SELECT * FROM ${profileTable} WHERE user_id = ?`, [user.user_id]);

      if (profiles.length > 0) {
        profile = profiles[0];
        if (profile.permissions) profile.permissions = JSON.parse(profile.permissions || '{}');
        if (profile.assigned_zones) profile.assigned_zones = JSON.parse(profile.assigned_zones || '[]');
      }

      const token = jwt.sign(
        { userId: user.user_id, username: user.username, user_type: user.user_type },
        config.jwt.secret,
        { expiresIn: config.jwt.expire }
      );

      console.log('Login token generated:', token.substring(0, 20) + '...'); // Debug log

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
      res.status(500).json({ success: false, message: 'Login failed', error: error.message });
    }
  }

  // Get current user profile
  async getProfile(req, res) {
    try {
      console.log('getProfile called with req.user:', req.user); // Debug log for middleware output

      const userId = req.user.userId;

      const [users] = await db.query(
        'SELECT user_id, username, email, phone_number, user_type, status, profile_photo, created_at, last_login FROM users WHERE user_id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const user = users[0];

      const profileTable = user.user_type === 'admin' ? 'admins' :
                          user.user_type === 'manager' ? 'managers' : 'sellers';
      
      const [profiles] = await db.query(`SELECT * FROM ${profileTable} WHERE user_id = ?`, [userId]);

      let profile = profiles[0] || {};
      if (profile.permissions) profile.permissions = JSON.parse(profile.permissions || '{}');
      if (profile.assigned_zones) profile.assigned_zones = JSON.parse(profile.assigned_zones || '[]');

      res.json({
        success: true,
        data: { ...user, profile }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ success: false, message: 'Failed to get profile', error: error.message });
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

      const userUpdateFields = [];
      const userUpdateValues = [];

      if (phone_number !== undefined) {
        userUpdateFields.push('phone_number = ?');
        userUpdateValues.push(phone_number);
      }
      if (profile_photo !== undefined) {
        userUpdateFields.push('profile_photo = ?');
        userUpdateValues.push(profile_photo);
      }

      if (userUpdateFields.length > 0) {
        userUpdateValues.push(userId);
        await connection.query(`UPDATE users SET ${userUpdateFields.join(', ')} WHERE user_id = ?`, userUpdateValues);
      }

      const [users] = await connection.query('SELECT user_type FROM users WHERE user_id = ?', [userId]);

      if (users.length === 0) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const user_type = users[0].user_type;

      const profileUpdateFields = [];
      const profileUpdateValues = [];

      if (full_name !== undefined) {
        profileUpdateFields.push('full_name = ?');
        profileUpdateValues.push(full_name);
      }

      switch (user_type) {
        case 'admin':
          if (department !== undefined) {
            profileUpdateFields.push('department = ?');
            profileUpdateValues.push(department);
          }
          break;
        case 'manager':
          if (assigned_zones !== undefined) {
            profileUpdateFields.push('assigned_zones = ?');
            profileUpdateValues.push(assigned_zones ? JSON.stringify(assigned_zones) : null);
          }
          break;
        case 'seller':
          if (business_name !== undefined) {
            profileUpdateFields.push('business_name = ?');
            profileUpdateValues.push(business_name);
          }
          if (business_type !== undefined) {
            profileUpdateFields.push('business_type = ?');
            profileUpdateValues.push(business_type);
          }
          if (tin_number !== undefined) {
            profileUpdateFields.push('tin_number = ?');
            profileUpdateValues.push(tin_number);
          }
          if (emergency_contact !== undefined) {
            profileUpdateFields.push('emergency_contact = ?');
            profileUpdateValues.push(emergency_contact);
          }
          if (address !== undefined) {
            profileUpdateFields.push('address = ?');
            profileUpdateValues.push(address);
          }
          break;
      }

      if (profileUpdateFields.length > 0) {
        const profileTable = user_type === 'admin' ? 'admins' :
                            user_type === 'manager' ? 'managers' : 'sellers';
        profileUpdateValues.push(userId);
        await connection.query(`UPDATE ${profileTable} SET ${profileUpdateFields.join(', ')} WHERE user_id = ?`, profileUpdateValues);
      }

      await connection.commit();

      res.json({ success: true, message: 'Profile updated successfully' });

    } catch (error) {
      await connection.rollback();
      console.error('Update profile error:', error);
      res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
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
        return res.status(400).json({ success: false, message: 'Current password and new password are required' });
      }

      if (current_password === new_password) {
        return res.status(400).json({ success: false, message: 'New password must be different from current password' });
      }

      const [users] = await db.query('SELECT password_hash FROM users WHERE user_id = ?', [userId]);

      if (users.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const isValid = await bcrypt.compare(current_password, users[0].password_hash);

      if (!isValid) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }

      const new_password_hash = await bcrypt.hash(new_password, config.bcrypt.rounds);

      const [result] = await db.query('UPDATE users SET password_hash = ? WHERE user_id = ?', [new_password_hash, userId]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Failed to update password' });
      }

      res.json({ success: true, message: 'Password changed successfully' });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ success: false, message: 'Failed to change password', error: error.message });
    }
  }
}

module.exports = new AuthController();