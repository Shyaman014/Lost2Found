import express from 'express';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All notification routes require authentication

// GET  /api/notifications          - get all notifications (supports ?unread=true)
router.get('/', getNotifications);

// PATCH /api/notifications/read-all - mark all as read (must be before /:id routes)
router.patch('/read-all', markAllNotificationsRead);

// PATCH /api/notifications/:id/read - mark single notification as read
router.patch('/:id/read', markNotificationRead);

// DELETE /api/notifications/:id     - delete a notification
router.delete('/:id', deleteNotification);

export default router;
