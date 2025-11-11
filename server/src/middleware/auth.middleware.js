import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import Blacklist from '../models/Blacklist.model.js';

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
    req.user = decoded; // { userId, username, user_type }

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