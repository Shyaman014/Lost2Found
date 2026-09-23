import express from 'express';
import { healthCheck } from '../controllers/healthController.js';
import authRoutes from './authRoutes.js';
import itemRoutes from './itemRoutes.js';
import matchRoutes from './matchRoutes.js';
import claimRoutes from './claimRoutes.js';
import conversationRoutes from './conversationRoutes.js';
import adminRoutes from './adminRoutes.js';
import reportRoutes from './reportRoutes.js';

const router = express.Router();

router.get('/health', healthCheck);
router.use('/auth', authRoutes);
router.use('/items', itemRoutes);
router.use('/matches', matchRoutes);
router.use('/claims', claimRoutes);
router.use('/conversations', conversationRoutes);
router.use('/admin', adminRoutes);
router.use('/reports', reportRoutes);

export default router;
