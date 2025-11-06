const jwt = require('jsonwebtoken');
const config = require('../config/config');

// Authenticate JWT token
const authenticate = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Add user info to request
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      user_type: decoded.user_type
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

// Authorize specific user types
const authorize = (...allowedTypes) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedTypes.includes(req.user.user_type)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.user_type !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Check if user is manager
const isManager = (req, res, next) => {
  if (!req.user || req.user.user_type !== 'manager') {
    return res.status(403).json({
      success: false,
      message: 'Manager access required'
    });
  }
  next();
};

// Check if user is seller
const isSeller = (req, res, next) => {
  if (!req.user || req.user.user_type !== 'seller') {
    return res.status(403).json({
      success: false,
      message: 'Seller access required'
    });
  }
  next();
};

// Check if user is admin or manager
const isAdminOrManager = (req, res, next) => {
  if (!req.user || !['admin', 'manager'].includes(req.user.user_type)) {
    return res.status(403).json({
      success: false,
      message: 'Admin or Manager access required'
    });
  }
  next();
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, config.jwt.secret);
      
      req.user = {
        userId: decoded.userId,
        username: decoded.username,
        user_type: decoded.user_type
      };
    }
  } catch (error) {
    // Continue without user info if token is invalid
  }
  
  next();
};

module.exports = {
  authenticate,
  authorize,
  isAdmin,
  isManager,
  isSeller,
  isAdminOrManager,
  optionalAuth
};