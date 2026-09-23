import Notification from '../models/Notification.js';
import { getIO } from '../config/socket.js';

/**
 * Create a notification and emit real-time event
 * @param {Object} data
 * @param {String} data.recipient - User ID
 * @param {String} data.type - Notification type enum
 * @param {String} data.title
 * @param {String} data.message
 * @param {String} data.actionUrl
 * @param {String} [data.relatedItem]
 * @param {String} [data.relatedClaim]
 * @param {String} [data.relatedMatch]
 * @param {String} [data.relatedConversation]
 */
export const createNotification = async (data) => {
  try {
    const notification = await Notification.create({
      recipient: data.recipient,
      type: data.type,
      title: data.title,
      message: data.message,
      actionUrl: data.actionUrl,
      relatedItem: data.relatedItem,
      relatedClaim: data.relatedClaim,
      relatedMatch: data.relatedMatch,
      relatedConversation: data.relatedConversation,
    });

    // Attempt to emit to real-time socket room
    try {
      const io = getIO();
      if (io) {
        io.to(`user:${data.recipient.toString()}`).emit('notification:new', notification);
      }
    } catch (socketErr) {
      // It's okay if socket io is not initialized or fails (e.g. during testing without server attached)
      console.error('[NotificationService] Socket emission failed:', socketErr.message);
    }

    return notification;
  } catch (error) {
    console.error('[NotificationService] Failed to create notification:', error.message);
    throw error;
  }
};
