import express from 'express';
import { getMyClaims, cancelClaim, approveClaim, rejectClaim } from '../controllers/claimController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All claim routes require authentication

router.route('/my')
  .get(getMyClaims);

router.route('/:id/cancel')
  .patch(cancelClaim);

router.route('/:id/approve')
  .patch(approveClaim);

router.route('/:id/reject')
  .patch(rejectClaim);

export default router;
