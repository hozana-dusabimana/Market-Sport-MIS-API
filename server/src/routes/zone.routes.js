import express from 'express';
import zoneController from '../controllers/zone.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/', zoneController.getAllZones.bind(zoneController));
router.get('/:id', zoneController.getZoneById.bind(zoneController));
router.get('/:id/spaces', zoneController.getZoneSpaces.bind(zoneController));
router.get('/:id/statistics', zoneController.getZoneStats.bind(zoneController));

// Protected routes
router.post('/', authenticate, zoneController.createZone.bind(zoneController));
router.put('/:id', authenticate, zoneController.updateZone.bind(zoneController));
router.delete('/:id', authenticate, zoneController.deleteZone.bind(zoneController));

export default router;
