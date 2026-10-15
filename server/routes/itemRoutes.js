import express from 'express';
import {
  createItem,
  getItems,
  getMyItems,
  getItemById,
  updateItem,
  deleteItem,
  updateItemStatus,
  removeImage,
  markItemReturned
} from '../controllers/itemController.js';
import { triggerMatching, getMatches } from '../controllers/matchController.js';
import { createClaim, getItemClaims } from '../controllers/claimController.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Publicly readable endpoints (optionalProtect attaches req.user if logged in)
router.route('/')
  .get(optionalProtect, getItems)
  .post(protect, upload.single('image'), createItem);

router.route('/my')
  .get(protect, getMyItems);

router.route('/:id')
  .get(optionalProtect, getItemById)
  .put(protect, upload.single('image'), updateItem)
  .delete(protect, deleteItem);

router.route('/:id/image')
  .delete(protect, removeImage);

router.route('/:id/status')
  .patch(protect, updateItemStatus);

router.route('/:id/returned')
  .patch(protect, markItemReturned);

router.route('/:id/match')
  .post(protect, triggerMatching);

router.route('/:id/matches')
  .get(protect, getMatches);

router.route('/:id/claims')
  .post(protect, createClaim)
  .get(protect, getItemClaims);

export default router;
