import express from 'express';
import { chatWithAssistant } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';
import { aiChatLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// protect runs first (attaches req.user), then aiChatLimiter keys on req.user._id
router.post('/chat', protect, aiChatLimiter, chatWithAssistant);

export default router;
