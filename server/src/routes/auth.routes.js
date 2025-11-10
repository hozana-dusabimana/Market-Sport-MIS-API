const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { 
  validateRegistration, 
  validateLogin,
  validateChangePassword,
  validateForgotPassword,  // Added
  validateResetPassword    // Added
} = require('../middleware/validation.middleware');

// Public routes
router.post('/register', validateRegistration, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);
router.post('/reset-password', validateResetPassword, authController.resetPassword);

// Protected routes (require authentication)
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/change-password', authenticate, validateChangePassword, authController.changePassword);
router.post('/logout', authenticate, authController.logout); // Added logout endpoint

module.exports = router;