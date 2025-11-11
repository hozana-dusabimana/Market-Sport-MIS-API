import express from 'express';
import allocationController from '../controllers/allocation.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/', allocationController.getAllAllocations.bind(allocationController));
router.get('/:id', allocationController.getAllocationById.bind(allocationController));
router.get('/:id/payments', allocationController.getPayments.bind(allocationController));

// Protected routes
router.post('/', authenticate, allocationController.createAllocation.bind(allocationController));
router.put('/:id', authenticate, allocationController.updateAllocation.bind(allocationController));
router.patch('/:id/status', authenticate, allocationController.updateAllocationStatus.bind(allocationController));
router.delete('/:id', authenticate, allocationController.deleteAllocation.bind(allocationController));

// Admin route to check expired allocations
router.post('/check-expired', authenticate, allocationController.checkExpired.bind(allocationController));

export default router;
