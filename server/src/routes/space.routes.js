import express from 'express';
import spaceController from '../controllers/space.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/', spaceController.getAllSpaces.bind(spaceController));
router.get('/available', spaceController.getAvailableSpaces.bind(spaceController));
router.get('/:id', spaceController.getSpaceById.bind(spaceController));
router.get('/:id/availability', spaceController.checkAvailability.bind(spaceController));
router.get('/:id/history', spaceController.getAllocationHistory.bind(spaceController));

// Protected routes
router.post('/', authenticate, spaceController.createSpace.bind(spaceController));
router.put('/:id', authenticate, spaceController.updateSpace.bind(spaceController));
router.patch('/:id/status', authenticate, spaceController.updateSpaceStatus.bind(spaceController));
router.delete('/:id', authenticate, spaceController.deleteSpace.bind(spaceController));

export default router;
