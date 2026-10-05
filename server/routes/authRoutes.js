import express from 'express';
import { registerUser, loginUser, getCurrentUser, logoutUser, demoLogin, updateProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/demo', authLimiter, demoLogin);
router.post('/logout', logoutUser);
router.get('/me', protect, getCurrentUser);
router.put('/profile', protect, upload.single('profileImage'), updateProfile);

export default router;
