import express from 'express';
import reportController from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// All report routes require authentication
router.use(authenticate);

// Generate/Fetch report routes - Changed to GET with query parameters
router.get('/generate/daily', reportController.generateDailyReport);
router.get('/generate/weekly', reportController.generateWeeklyReport);
router.get('/generate/monthly', reportController.generateMonthlyReport);
router.get('/generate/occupancy', reportController.generateOccupancyReport);
router.get('/generate/revenue', reportController.generateRevenueReport);
router.get('/generate/seller', reportController.generateSellerReport);

// Statistics and summary routes (GET requests with query params)
router.get('/statistics/zones', reportController.getZoneStatistics);
router.get('/statistics/allocations', reportController.getAllocationSummary);

export default router;