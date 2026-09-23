import Item from '../models/Item.js';
import { uploadImage, deleteImage } from '../services/cloudinaryService.js';

// @desc    Create a new item
// @route   POST /api/items
// @access  Private
export const createItem = async (req, res) => {
  const { title, description, type, category, location, date, time, color, brand, identifyingDetails, contactPreference } = req.body;

  if (!title || !description || !type || !category || !location || !date) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields' });
  }

  if (type !== 'lost' && type !== 'found') {
    return res.status(400).json({ success: false, message: 'Invalid item type' });
  }

  try {
    let imageData = null;

    if (req.file) {
      const result = await uploadImage(req.file.buffer);
      imageData = {
        url: result.url,
        publicId: result.publicId
      };
    }

    const item = await Item.create({
      title,
      description,
      type,
      category,
      location,
      date,
      time,
      color,
      brand,
      identifyingDetails,
      contactPreference,
      status: 'active',
      image: imageData,
      reportedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: item
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Invalid item data' });
  }
};

// @desc    Get all active items
// @route   GET /api/items
// @access  Private
export const getItems = async (req, res) => {
  try {
    const items = await Item.find({ status: 'active' })
      .populate('reportedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { items }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while fetching items' });
  }
};

// @desc    Get current user's items
// @route   GET /api/items/my
// @access  Private
export const getMyItems = async (req, res) => {
  try {
    const items = await Item.find({ reportedBy: req.user._id })
      .populate('reportedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { items }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while fetching your items' });
  }
};

// @desc    Get single item
// @route   GET /api/items/:id
// @access  Private
export const getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('reportedBy', 'name');

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.status(200).json({
      success: true,
      data: { item }
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Item not found (invalid ID)' });
    }
    res.status(500).json({ success: false, message: 'Server error while fetching item details' });
  }
};

// @desc    Update an item
// @route   PUT /api/items/:id
// @access  Private
export const updateItem = async (req, res) => {
  try {
    let item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (item.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to modify this item' });
    }

    const { reportedBy, image, ...updateData } = req.body;
    let newImageData = item.image; // default to existing
    let oldPublicIdToDelete = null;

    if (req.file) {
      const result = await uploadImage(req.file.buffer);
      newImageData = {
        url: result.url,
        publicId: result.publicId
      };
      
      // If there was an old image, queue it for deletion
      if (item.image && item.image.publicId) {
        oldPublicIdToDelete = item.image.publicId;
      }
    }

    updateData.image = newImageData;

    item = await Item.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    // Delete old image from Cloudinary only after successful DB update
    if (oldPublicIdToDelete) {
      await deleteImage(oldPublicIdToDelete);
    }

    res.status(200).json({
      success: true,
      message: 'Item updated successfully',
      data: { item }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Invalid item data' });
  }
};

// @desc    Delete an item
// @route   DELETE /api/items/:id
// @access  Private
export const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (item.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to modify this item' });
    }

    const publicIdToDelete = item.image?.publicId;

    await item.deleteOne();

    if (publicIdToDelete) {
      await deleteImage(publicIdToDelete);
    }

    res.status(200).json({
      success: true,
      message: 'Item removed successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while deleting item' });
  }
};

// @desc    Remove an image from an item
// @route   DELETE /api/items/:id/image
// @access  Private
export const removeImage = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (item.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to modify this item' });
    }

    if (!item.image || !item.image.publicId) {
      return res.status(400).json({ success: false, message: 'Item has no image to remove' });
    }

    const publicIdToDelete = item.image.publicId;

    item.image = null; // Unset image
    await item.save();

    await deleteImage(publicIdToDelete);

    res.status(200).json({
      success: true,
      message: 'Image removed successfully',
      data: { item }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while removing image' });
  }
};

// @desc    Update item status
// @route   PATCH /api/items/:id/status
// @access  Private
export const updateItemStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (status !== 'active' && status !== 'resolved') {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (item.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to modify this item status' });
    }

    item.status = status;
    await item.save();

    res.status(200).json({
      success: true,
      message: `Item status updated to ${status}`,
      data: { item }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while updating item status' });
  }
};
