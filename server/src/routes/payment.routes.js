import express from 'express';
import paymentController from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public/Protected routes
router.get('/', authenticate, paymentController.getAllPayments.bind(paymentController));
router.get('/:id', authenticate, paymentController.getPaymentById.bind(paymentController));

// Revenue routes
router.get('/revenue/total', authenticate, paymentController.getTotalRevenue.bind(paymentController));
router.get('/revenue/by-zone', authenticate, paymentController.getRevenueByZone.bind(paymentController));
router.get('/revenue/by-method', authenticate, paymentController.getRevenueByMethod.bind(paymentController));

// Create/Update routes
router.post('/', authenticate, paymentController.createPayment.bind(paymentController));
router.put('/:id', authenticate, paymentController.updatePayment.bind(paymentController));
router.patch('/:id/status', authenticate, paymentController.updatePaymentStatus.bind(paymentController));

export default router;
