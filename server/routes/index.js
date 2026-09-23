import express from 'express';
import { healthCheck } from '../controllers/healthController.js';
import authRoutes from './authRoutes.js';

const router = express.Router();

router.get('/health', healthCheck);
router.use('/auth', authRoutes);

export default router;
