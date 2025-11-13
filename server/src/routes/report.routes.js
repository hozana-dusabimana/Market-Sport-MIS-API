import express from 'express';
import reportController from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Reports (authenticated to derive manager scope)
router.get('/overview', authenticate, reportController.getOverview.bind(reportController));
router.get('/payments', authenticate, reportController.getPaymentsReport.bind(reportController));
router.get('/allocations', authenticate, reportController.getAllocationsReport.bind(reportController));
router.get('/spaces', authenticate, reportController.getSpacesReport.bind(reportController));

export default router;

