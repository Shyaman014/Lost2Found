import express from 'express';
import { getAnalyticsOverview } from '../controllers/adminAnalyticsController.js';

const router = express.Router();

// GET /api/admin/analytics/overview
router.get('/overview', getAnalyticsOverview);

export default router;
