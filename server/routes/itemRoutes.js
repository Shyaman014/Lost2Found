import express from 'express';
import {
  createItem,
  getItems,
  getMyItems,
  getItemById,
  updateItem,
  deleteItem,
  updateItemStatus,
  removeImage
} from '../controllers/itemController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect); // All item routes require authentication

router.route('/')
  .get(getItems)
  .post(upload.single('image'), createItem);

router.route('/my')
  .get(getMyItems);

router.route('/:id')
  .get(getItemById)
  .put(upload.single('image'), updateItem)
  .delete(deleteItem);

router.route('/:id/image')
  .delete(removeImage);

router.route('/:id/status')
  .patch(updateItemStatus);

export default router;
