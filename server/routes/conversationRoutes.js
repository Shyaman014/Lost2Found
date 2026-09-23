import express from 'express';
import {
  getConversations,
  getConversation,
  getMessages,
  markMessagesRead
} from '../controllers/conversationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All conversation routes require authentication

router.route('/')
  .get(getConversations);

router.route('/:id')
  .get(getConversation);

router.route('/:id/messages')
  .get(getMessages);

router.route('/:id/read')
  .patch(markMessagesRead);

export default router;
