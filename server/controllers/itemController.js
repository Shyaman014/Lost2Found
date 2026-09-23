import Item from '../models/Item.js';
import { uploadImage, deleteImage } from '../services/cloudinaryService.js';
import Conversation from '../models/Conversation.js';

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

// @desc    Get all items with search, filter, sort, pagination
// @route   GET /api/items
// @access  Private
export const getItems = async (req, res) => {
  try {
    const {
      search,
      type,
      category,
      location,
      dateFrom,
      dateTo,
      color,
      brand,
      status,
      sort,
      page: pageParam,
      limit: limitParam,
    } = req.query;

    // --- Validate & sanitize pagination ---
    const page = Math.max(1, parseInt(pageParam, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(limitParam, 10) || 12));
    const skip = (page - 1) * limit;

    // --- Build query object ---
    const query = {};

    // Phase 10: Always exclude admin-removed items from student-facing queries
    query.moderationStatus = { $ne: 'removed' };

    // Status — default to 'active'
    const allowedStatuses = ['active', 'resolved'];
    query.status = allowedStatuses.includes(status) ? status : 'active';

    // Type filter
    if (type) {
      if (!['lost', 'found'].includes(type)) {
        return res.status(400).json({ success: false, message: 'Invalid type value. Must be "lost" or "found".' });
      }
      query.type = type;
    }

    // Category filter
    const allowedCategories = [
      'electronics', 'documents', 'wallet', 'keys', 'bags',
      'clothing', 'books', 'stationery', 'jewelry', 'accessories', 'other',
    ];
    if (category) {
      if (!allowedCategories.includes(category.toLowerCase())) {
        return res.status(400).json({ success: false, message: 'Invalid category value.' });
      }
      query.category = category.toLowerCase();
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) {
        const from = new Date(dateFrom);
        if (isNaN(from)) return res.status(400).json({ success: false, message: 'Invalid dateFrom value.' });
        query.date.$gte = from;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        if (isNaN(to)) return res.status(400).json({ success: false, message: 'Invalid dateTo value.' });
        query.date.$lte = to;
      }
      if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
        return res.status(400).json({ success: false, message: 'dateFrom cannot be later than dateTo.' });
      }
    }

    // Location filter (case-insensitive partial match)
    if (location && location.trim()) {
      query.location = { $regex: location.trim(), $options: 'i' };
    }

    // Color filter (case-insensitive partial match)
    if (color && color.trim()) {
      query.color = { $regex: color.trim(), $options: 'i' };
    }

    // Brand filter (case-insensitive partial match)
    if (brand && brand.trim()) {
      query.brand = { $regex: brand.trim(), $options: 'i' };
    }

    // Text search across multiple fields
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { brand: searchRegex },
        { color: searchRegex },
        { location: searchRegex },
        { identifyingDetails: searchRegex },
      ];
    }

    // --- Sorting ---
    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      'date-newest': { date: -1 },
      'date-oldest': { date: 1 },
    };
    const sortObj = sortMap[sort] || sortMap['newest'];

    // --- Execute query with pagination ---
    const [items, totalItems] = await Promise.all([
      Item.find(query)
        .populate('reportedBy', 'name')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Item.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
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

    // Phase 10: Hide admin-removed items from students
    if (item.moderationStatus === 'removed') {
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

// @desc    Mark an item as physically returned
// @route   PATCH /api/items/:id/returned
// @access  Private (Finder only)
export const markItemReturned = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    // Only the reporter can mark it returned
    if (item.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this item' });
    }

    // Item must be in "claimed" status to be marked returned
    if (item.status !== 'claimed') {
      return res.status(400).json({ success: false, message: `Item must be "claimed" before it can be marked "returned" (currently ${item.status})` });
    }

    item.status = 'returned';
    await item.save();

    // Close the associated conversation if it exists
    await Conversation.findOneAndUpdate(
      { item: item._id, status: 'active' },
      { $set: { status: 'closed' } }
    );

    res.status(200).json({
      success: true,
      message: 'Item has been successfully marked as returned.',
      data: { item }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while marking item returned' });
  }
};
