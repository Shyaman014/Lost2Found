import express from 'express';
import { healthCheck } from '../controllers/healthController.js';
import authRoutes from './authRoutes.js';
import itemRoutes from './itemRoutes.js';
import matchRoutes from './matchRoutes.js';
import claimRoutes from './claimRoutes.js';
import conversationRoutes from './conversationRoutes.js';

const router = express.Router();

router.get('/health', healthCheck);
router.use('/auth', authRoutes);
router.use('/items', itemRoutes);
router.use('/matches', matchRoutes);
router.use('/claims', claimRoutes);
router.use('/conversations', conversationRoutes);

export default router;
