import express from 'express';
import allocationController from '../controllers/allocation.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Authenticated routes (needed for manager scoping)
router.get('/', authenticate, allocationController.getAllAllocations.bind(allocationController));
router.get('/:id', authenticate, allocationController.getAllocationById.bind(allocationController));
router.get('/:id/payments', authenticate, allocationController.getPayments.bind(allocationController));

// Protected routes
router.post('/', authenticate, allocationController.createAllocation.bind(allocationController));
router.put('/:id', authenticate, allocationController.updateAllocation.bind(allocationController));
router.patch('/:id/status', authenticate, allocationController.updateAllocationStatus.bind(allocationController));
router.delete('/:id', authenticate, allocationController.deleteAllocation.bind(allocationController));

// Admin route to check expired allocations
router.post('/check-expired', authenticate, allocationController.checkExpired.bind(allocationController));

export default router;
