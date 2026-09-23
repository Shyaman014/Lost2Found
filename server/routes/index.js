import express from 'express';
import { healthCheck } from '../controllers/healthController.js';
import authRoutes from './authRoutes.js';
import itemRoutes from './itemRoutes.js';

const router = express.Router();

router.get('/health', healthCheck);
router.use('/auth', authRoutes);
router.use('/items', itemRoutes);

export default router;
