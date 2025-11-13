import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import Blacklist from '../models/Blacklist.model.js';
import db from '../config/database.js';

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    console.log('Auth token received:', token.substring(0, 20) + '...'); // Debug log

    // Verify JWT
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded; // { userId, username, user_type, ... }

    // If the user is a manager, enrich the payload with manager_id
    if (req.user?.user_type === 'manager') {
      try {
        // Try existing fields first
        let managerId = req.user.manager_id || req.user?.profile?.manager_id || null;

        if (!managerId && req.user?.userId) {
          const [rows] = await db.query(
            'SELECT manager_id FROM managers WHERE user_id = ? LIMIT 1',
            [req.user.userId]
          );
          managerId = rows?.[0]?.manager_id || null;
        }

        if (managerId) {
          // Attach manager_id for consistent access by controllers
          req.user.manager_id = managerId;
          req.user.profile = { ...(req.user.profile || {}), manager_id: managerId };
          // For compatibility with clients expecting id to be manager id
          req.user.id = managerId;
        }
      } catch (e) {
        // Non-fatal enrichment failure; proceed with decoded token
      }
    }

    // Check blacklist AFTER verification
    const isBlacklisted = await Blacklist.isBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({ success: false, message: 'Token has been revoked' });
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ success: false, message: 'Authentication failed' });
  }
};

export { authenticate };