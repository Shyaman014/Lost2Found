import express from 'express';
import { dismissMatch } from '../controllers/matchController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.patch('/:id/dismiss', dismissMatch);

export default router;
