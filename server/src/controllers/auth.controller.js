import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';
import config from '../config/config.js';
import User from '../models/User.model.js';
import Blacklist from '../models/Blacklist.model.js';
import NotificationService from '../services/notificationService.js';

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
          // Accept optional manager_id from body (e.g., manager creating a seller from dashboard)
          const creatorManagerId = req.body.manager_id || null;
          const [sellerResult] = await connection.query(
            `INSERT INTO sellers (user_id, full_name, id_number, business_name, business_type, created_by_manager_id, tin_number, emergency_contact, address, registration_date, verification_status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [
              userId,
              full_name || null,
              id_number,
              business_name || null,
              business_type || null,
              creatorManagerId,
              tin_number || null,
              emergency_contact || null,
              address || null,
              registration_date || new Date().toISOString().split('T')[0]
            ]
          );
          profileId = sellerResult.insertId;
          // Best-effort mirror into sellers.manager_id if the column exists
          if (creatorManagerId) {
            try {
              await connection.query('UPDATE sellers SET manager_id = ? WHERE seller_id = ?', [creatorManagerId, profileId]);
            } catch (e) {
              // Column may not exist; ignore silently
            }
          }
          break;
      }

      await connection.commit();

      // Auto-create notification
      await NotificationService.createUserNotification({
        user_id: userId,
        username,
        user_type
      }, null);

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

  // Login user - User can only login if status is 'active'
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

      // User can login if and only if status is 'active'
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

      // Get current user data
      const [users] = await connection.query(
        'SELECT user_type, phone_number, profile_photo FROM users WHERE user_id = ?',
        [userId]
      );

      if (users.length === 0) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const currentUser = users[0];
      const user_type = currentUser.user_type;

      // Get current profile data
      const profileTable = user_type === 'admin' ? 'admins' :
                          user_type === 'manager' ? 'managers' : 'sellers';
      
      const [profiles] = await connection.query(`SELECT * FROM ${profileTable} WHERE user_id = ?`, [userId]);
      const currentProfile = profiles[0] || {};

      const userUpdateFields = [];
      const userUpdateValues = [];
      const sameUserFields = [];

      if (phone_number !== undefined) {
        if (phone_number === currentUser.phone_number) {
          sameUserFields.push('phone_number');
        } else {
          userUpdateFields.push('phone_number = ?');
          userUpdateValues.push(phone_number);
        }
      }
      if (profile_photo !== undefined) {
        if (profile_photo === currentUser.profile_photo) {
          sameUserFields.push('profile_photo');
        } else {
          userUpdateFields.push('profile_photo = ?');
          userUpdateValues.push(profile_photo);
        }
      }

      if (userUpdateFields.length > 0) {
        userUpdateValues.push(userId);
        await connection.query(`UPDATE users SET ${userUpdateFields.join(', ')} WHERE user_id = ?`, userUpdateValues);
      }

      const profileUpdateFields = [];
      const profileUpdateValues = [];
      const sameProfileFields = [];

      if (full_name !== undefined) {
        if (full_name === currentProfile.full_name) {
          sameProfileFields.push('full_name');
        } else {
          profileUpdateFields.push('full_name = ?');
          profileUpdateValues.push(full_name);
        }
      }

      switch (user_type) {
        case 'admin':
          if (department !== undefined) {
            if (department === currentProfile.department) {
              sameProfileFields.push('department');
            } else {
              profileUpdateFields.push('department = ?');
              profileUpdateValues.push(department);
            }
          }
          break;
        case 'manager':
          if (assigned_zones !== undefined) {
            const newZones = assigned_zones ? JSON.stringify(assigned_zones) : null;
            const currentZones = currentProfile.assigned_zones;
            if (newZones === currentZones) {
              sameProfileFields.push('assigned_zones');
            } else {
              profileUpdateFields.push('assigned_zones = ?');
              profileUpdateValues.push(newZones);
            }
          }
          break;
        case 'seller':
          if (business_name !== undefined) {
            if (business_name === currentProfile.business_name) {
              sameProfileFields.push('business_name');
            } else {
              profileUpdateFields.push('business_name = ?');
              profileUpdateValues.push(business_name);
            }
          }
          if (business_type !== undefined) {
            if (business_type === currentProfile.business_type) {
              sameProfileFields.push('business_type');
            } else {
              profileUpdateFields.push('business_type = ?');
              profileUpdateValues.push(business_type);
            }
          }
          if (tin_number !== undefined) {
            if (tin_number === currentProfile.tin_number) {
              sameProfileFields.push('tin_number');
            } else {
              profileUpdateFields.push('tin_number = ?');
              profileUpdateValues.push(tin_number);
            }
          }
          if (emergency_contact !== undefined) {
            if (emergency_contact === currentProfile.emergency_contact) {
              sameProfileFields.push('emergency_contact');
            } else {
              profileUpdateFields.push('emergency_contact = ?');
              profileUpdateValues.push(emergency_contact);
            }
          }
          if (address !== undefined) {
            if (address === currentProfile.address) {
              sameProfileFields.push('address');
            } else {
              profileUpdateFields.push('address = ?');
              profileUpdateValues.push(address);
            }
          }
          break;
      }

      if (profileUpdateFields.length > 0) {
        profileUpdateValues.push(userId);
        await connection.query(`UPDATE ${profileTable} SET ${profileUpdateFields.join(', ')} WHERE user_id = ?`, profileUpdateValues);
      }

      await connection.commit();

      const allSameFields = [...sameUserFields, ...sameProfileFields];
      
      if (userUpdateFields.length === 0 && profileUpdateFields.length === 0) {
        return res.json({ 
          success: true, 
          message: 'No changes made. All values are the same as existing values.',
          sameFields: allSameFields
        });
      }

      const responseMessage = allSameFields.length > 0
        ? `Profile updated successfully. The following fields had the same value: ${allSameFields.join(', ')}`
        : 'Profile updated successfully';

      res.json({ 
        success: true, 
        message: responseMessage,
        ...(allSameFields.length > 0 && { sameFields: allSameFields })
      });

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


// Logout user
async logout(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(400).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const userId = req.user.userId;

    // Decode token to get expiry (without verifying, since middleware already did)
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return res.status(400).json({ success: false, message: 'Invalid token' });
    }

    // Blacklist the token
    const blacklisted = await Blacklist.add(token, userId, decoded.exp);
    if (!blacklisted) {
      console.warn('Failed to blacklist token for user:', userId);
    }

    console.log('User logged out and token blacklisted:', userId); // Debug log

    // Client still discards token on their end
    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Logout failed', error: error.message });
  }
}

  // Forgot password - Generate reset token for email
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }

      const user = await User.findByEmail(email);

      if (!user) {
        return res.status(404).json({ success: false, message: 'Email not found' });
      }

      // Optionally restrict to active users only; here we allow any status for recovery
      if (user.status !== 'active') {
        return res.status(403).json({ success: false, message: 'Account is inactive' });
      }

      // Generate short-lived JWT reset token (self-contained, no DB storage needed)
      const resetToken = jwt.sign(
        { userId: user.user_id, type: 'password_reset' },
        config.jwt.secret,
        { expiresIn: '15m' } // Short expiry for security
      );

      console.log('Reset token generated for user:', user.user_id); // Debug log

      res.json({
        success: true,
        message: 'Reset token generated successfully. Use this to set a new password.',
        data: { resetToken, email: user.email, user_type: user.user_type }
      });

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ success: false, message: 'Forgot password failed', error: error.message });
    }
  }

  // Reset password using token
  async resetPassword(req, res) {
    try {
      const { resetToken, new_password, confirm_password } = req.body;

      if (!resetToken || !new_password || !confirm_password) {
        return res.status(400).json({ success: false, message: 'Reset token, new password, and confirmation are required' });
      }

      if (new_password !== confirm_password) {
        return res.status(400).json({ success: false, message: 'New password and confirmation do not match' });
      }

      if (new_password.length < 6) { // Basic validation; enhance as needed
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
      }

      // Verify the reset token
      let decoded;
      try {
        decoded = jwt.verify(resetToken, config.jwt.secret);
        if (decoded.type !== 'password_reset') {
          return res.status(400).json({ success: false, message: 'Invalid reset token' });
        }
      } catch (error) {
        console.error('Reset token verification error:', error);
        return res.status(403).json({ success: false, message: 'Invalid or expired reset token' });
      }

      const userId = decoded.userId;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Hash the new password
      const new_password_hash = await bcrypt.hash(new_password, config.bcrypt.rounds);

      // Update password
      const updated = await User.updatePassword(userId, new_password_hash);

      if (!updated) {
        return res.status(500).json({ success: false, message: 'Failed to update password' });
      }

      // Optional: Update last_login or status here if needed
      await User.updateLastLogin(userId);

      console.log('Password reset successfully for user:', userId); // Debug log

      res.json({
        success: true,
        message: 'Password reset successfully. You can now login with your new password.'
      });

    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ success: false, message: 'Reset password failed', error: error.message });
    }
  }
}

export default new AuthController();