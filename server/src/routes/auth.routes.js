import express from 'express';
const router = express.Router();
import authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  validateRegistration,
  validateLogin,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword
} from '../middleware/validation.middleware.js';

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

export default router;