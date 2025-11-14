import express from 'express';
import notificationController from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Protected routes
router.get('/', authenticate, notificationController.getAllNotifications.bind(notificationController));
router.get('/user/notifications', authenticate, notificationController.getUserNotifications.bind(notificationController));
router.get('/unread/count', authenticate, notificationController.getUnreadCount.bind(notificationController));
router.get('/:id', authenticate, notificationController.getNotificationById.bind(notificationController));

// Manual notification creation disabled - notifications are auto-created
// router.post('/', authenticate, notificationController.createNotification.bind(notificationController));

// Update routes
router.put('/:id', authenticate, notificationController.updateNotification.bind(notificationController));
router.patch('/:id/status', authenticate, notificationController.updateNotificationStatus.bind(notificationController));
router.patch('/:id/read', authenticate, notificationController.markAsRead.bind(notificationController));
router.post('/read/multiple', authenticate, notificationController.markMultipleAsRead.bind(notificationController));

// Delete notification
router.delete('/:id', authenticate, notificationController.deleteNotification.bind(notificationController));

export default router;
