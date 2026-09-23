import express from 'express';
import {
  createItem,
  getItems,
  getMyItems,
  getItemById,
  updateItem,
  deleteItem,
  updateItemStatus
} from '../controllers/itemController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All item routes require authentication for Phase 3

router.route('/')
  .get(getItems)
  .post(createItem);

router.route('/my')
  .get(getMyItems);

router.route('/:id')
  .get(getItemById)
  .put(updateItem)
  .delete(deleteItem);

router.route('/:id/status')
  .patch(updateItemStatus);

export default router;
