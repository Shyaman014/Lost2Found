import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { submitReport } from '../controllers/reportController.js';

const router = express.Router();

// All report routes require authentication
router.use(protect);

// Students submit reports
router.post('/', submitReport);

export default router;
