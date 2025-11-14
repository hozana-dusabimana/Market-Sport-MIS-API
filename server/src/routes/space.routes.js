import express from 'express';
import spaceController from '../controllers/space.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Authenticated routes (needed for manager scoping)
router.get('/', authenticate, spaceController.getAllSpaces.bind(spaceController));
router.get('/available', authenticate, spaceController.getAvailableSpaces.bind(spaceController));
router.get('/:id', authenticate, spaceController.getSpaceById.bind(spaceController));
router.get('/:id/availability', authenticate, spaceController.checkAvailability.bind(spaceController));
router.get('/:id/history', authenticate, spaceController.getAllocationHistory.bind(spaceController));

// Protected routes
router.post('/', authenticate, spaceController.createSpace.bind(spaceController));
router.put('/:id', authenticate, spaceController.updateSpace.bind(spaceController));
router.patch('/:id/status', authenticate, spaceController.updateSpaceStatus.bind(spaceController));
router.delete('/:id', authenticate, spaceController.deleteSpace.bind(spaceController));

export default router;
