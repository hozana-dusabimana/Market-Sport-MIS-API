const jwt = require('jsonwebtoken');
const config = require('../config/config');

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
};

module.exports = { authenticate };