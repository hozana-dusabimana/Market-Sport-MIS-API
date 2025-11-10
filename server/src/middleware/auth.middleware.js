const jwt = require('jsonwebtoken');
const config = require('../config/config');
const Blacklist = require('../models/Blacklist.model');

const authenticate = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.auth_token) {
    token = req.query.auth_token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token is required' });
  }

  console.log('Auth token received:', token.substring(0, 20) + '...'); // Debug log

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    console.log('Token decoded successfully:', decoded); // Debug log
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT Verify Error:', {
      name: error.name,
      message: error.message,
      tokenPreview: token.substring(0, 20) + '...',
      secretPreview: config.jwt.secret.substring(0, 10) + '...'
    }); // Detailed debug
    return res.status(403).json({ success: false, message: 'Invalid token' });
  }

  const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

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
};

module.exports = { authenticate };