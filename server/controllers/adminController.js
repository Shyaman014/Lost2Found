import mongoose from 'mongoose';
import User from '../models/User.js';
import Item from '../models/Item.js';
import Claim from '../models/Claim.js';
import Match from '../models/Match.js';
import Conversation from '../models/Conversation.js';
import Report from '../models/Report.js';
import AuditLog from '../models/AuditLog.js';
import { createNotification } from '../services/notificationService.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Write an audit log entry.
 */
const logAudit = async ({ admin, action, targetType, targetId, metadata = {} }) => {
  try {
    await AuditLog.create({ admin, action, targetType, targetId, metadata });
  } catch (err) {
    console.error('[AuditLog] Failed to write audit log:', err.message);
  }
};

// ─── Dashboard ───────────────────────────────────────────────────────────────

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Admin
export const getDashboardStats = async (req, res) => {
  try {
    const [
      userStats,
      itemStats,
      claimStats,
      conversationStats,
      matchStats,
      reportStats,
      recentActivity,
    ] = await Promise.all([
      // User aggregation
      User.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: ['$isActive', 1, 0] } },
            inactive: { $sum: { $cond: ['$isActive', 0, 1] } },
            admins: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
          },
        },
      ]),

      // Item aggregation
      Item.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            lost: { $sum: { $cond: [{ $eq: ['$type', 'lost'] }, 1, 0] } },
            found: { $sum: { $cond: [{ $eq: ['$type', 'found'] }, 1, 0] } },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
            removed: { $sum: { $cond: [{ $eq: ['$moderationStatus', 'removed'] }, 1, 0] } },
            flagged: { $sum: { $cond: [{ $eq: ['$moderationStatus', 'flagged'] }, 1, 0] } },
          },
        },
      ]),

      // Claim aggregation
      Claim.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
            rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          },
        },
      ]),

      // Conversation aggregation
      Conversation.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
          },
        },
      ]),

      // Match aggregation
      Match.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            potential: { $sum: { $cond: [{ $eq: ['$status', 'potential'] }, 1, 0] } },
            dismissed: { $sum: { $cond: [{ $eq: ['$status', 'dismissed'] }, 1, 0] } },
          },
        },
      ]),

      // Report aggregation
      Report.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            reviewed: { $sum: { $cond: [{ $eq: ['$status', 'reviewed'] }, 1, 0] } },
            dismissed: { $sum: { $cond: [{ $eq: ['$status', 'dismissed'] }, 1, 0] } },
            action_taken: { $sum: { $cond: [{ $eq: ['$status', 'action_taken'] }, 1, 0] } },
          },
        },
      ]),

      // Recent audit activity (last 10)
      AuditLog.find()
        .populate('admin', 'name email')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: userStats[0] || { total: 0, active: 0, inactive: 0, admins: 0 },
        items: itemStats[0] || { total: 0, lost: 0, found: 0, active: 0, resolved: 0, removed: 0, flagged: 0 },
        claims: claimStats[0] || { total: 0, pending: 0, approved: 0, rejected: 0, cancelled: 0 },
        conversations: conversationStats[0] || { total: 0, active: 0, closed: 0 },
        matches: matchStats[0] || { total: 0, potential: 0, dismissed: 0 },
        reports: reportStats[0] || { total: 0, pending: 0, reviewed: 0, dismissed: 0, action_taken: 0 },
        recentActivity,
      },
    });
  } catch (error) {
    console.error('[Admin] getDashboardStats error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching dashboard stats' });
  }
};

// ─── User Management ─────────────────────────────────────────────────────────

// @desc    List all users (paginated, searchable, filterable)
// @route   GET /api/admin/users
// @access  Admin
export const getUsers = async (req, res) => {
  try {
    const {
      page: pageParam,
      limit: limitParam,
      search,
      role,
      status,
      sort,
    } = req.query;

    const page = Math.max(1, parseInt(pageParam, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitParam, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};

    // Role filter — whitelist only
    if (role && ['student', 'admin'].includes(role)) {
      query.role = role;
    }

    // Active/inactive filter
    if (status === 'active') query.isActive = true;
    else if (status === 'inactive') query.isActive = false;

    // Search across name, email, studentId, college
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { studentId: searchRegex },
        { college: searchRegex },
      ];
    }

    // Sorting — whitelist only
    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      name: { name: 1 },
    };
    const sortObj = sortMap[sort] || sortMap['newest'];

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPreviousPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('[Admin] getUsers error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching users' });
  }
};

// @desc    Get a single user's admin detail view
// @route   GET /api/admin/users/:id
// @access  Admin
export const getUserById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const user = await User.findById(req.params.id)
      .select('-password')
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Aggregate counts
    const [itemCount, claimCount, conversationCount] = await Promise.all([
      Item.countDocuments({ reportedBy: user._id }),
      Claim.countDocuments({ claimant: user._id }),
      Conversation.countDocuments({ participants: user._id }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        user: {
          ...user,
          _counts: { items: itemCount, claims: claimCount, conversations: conversationCount },
        },
      },
    });
  } catch (error) {
    console.error('[Admin] getUserById error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching user' });
  }
};

// @desc    Activate or deactivate a user
// @route   PATCH /api/admin/users/:id/status
// @access  Admin
export const updateUserStatus = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be a boolean' });
    }

    const targetUser = await User.findById(req.params.id).select('-password');
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent admin from deactivating themselves
    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot change your own account status' });
    }

    // Protect last active admin
    if (targetUser.role === 'admin' && !isActive) {
      const activeAdminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (activeAdminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot deactivate the last active admin account' });
      }
    }

    targetUser.isActive = isActive;
    await targetUser.save();

    const action = isActive ? 'USER_REACTIVATED' : 'USER_DEACTIVATED';
    await logAudit({
      admin: req.user._id,
      action,
      targetType: 'user',
      targetId: targetUser._id,
      metadata: { name: targetUser.name, email: targetUser.email, isActive },
    });

    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user: targetUser },
    });
  } catch (error) {
    console.error('[Admin] updateUserStatus error:', error);
    res.status(500).json({ success: false, message: 'Server error updating user status' });
  }
};

// @desc    Change a user's role
// @route   PATCH /api/admin/users/:id/role
// @access  Admin
export const updateUserRole = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const { role } = req.body;
    const allowedRoles = ['student', 'admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: `Invalid role. Allowed: ${allowedRoles.join(', ')}` });
    }

    const targetUser = await User.findById(req.params.id).select('-password');
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent admin from changing their own role
    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot change your own role' });
    }

    // Protect last active admin — cannot demote
    if (targetUser.role === 'admin' && role !== 'admin') {
      const activeAdminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (activeAdminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot demote the last active admin account' });
      }
    }

    const previousRole = targetUser.role;
    targetUser.role = role;
    await targetUser.save();

    await logAudit({
      admin: req.user._id,
      action: 'USER_ROLE_CHANGED',
      targetType: 'user',
      targetId: targetUser._id,
      metadata: { name: targetUser.name, email: targetUser.email, previousRole, newRole: role },
    });

    res.status(200).json({
      success: true,
      message: `User role changed to ${role}`,
      data: { user: targetUser },
    });
  } catch (error) {
    console.error('[Admin] updateUserRole error:', error);
    res.status(500).json({ success: false, message: 'Server error updating user role' });
  }
};

// ─── Item Management ─────────────────────────────────────────────────────────

// @desc    List all items (admin view, includes removed)
// @route   GET /api/admin/items
// @access  Admin
export const getAdminItems = async (req, res) => {
  try {
    const {
      page: pageParam,
      limit: limitParam,
      search,
      type,
      category,
      status,
      moderationStatus,
      dateFrom,
      dateTo,
      sort,
    } = req.query;

    const page = Math.max(1, parseInt(pageParam, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitParam, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};

    // Type filter
    if (type && ['lost', 'found'].includes(type)) query.type = type;

    // Category filter
    const validCategories = [
      'electronics', 'documents', 'wallet', 'keys', 'bags',
      'clothing', 'books', 'stationery', 'jewelry', 'accessories', 'other',
    ];
    if (category && validCategories.includes(category.toLowerCase())) {
      query.category = category.toLowerCase();
    }

    // Status filter
    const validStatuses = ['active', 'resolved', 'claimed', 'returned'];
    if (status && validStatuses.includes(status)) query.status = status;

    // Moderation status filter
    const validModerationStatuses = ['active', 'flagged', 'removed'];
    if (moderationStatus && validModerationStatuses.includes(moderationStatus)) {
      query.moderationStatus = moderationStatus;
    }

    // Date range
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) {
        const from = new Date(dateFrom);
        if (!isNaN(from)) query.date.$gte = from;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        if (!isNaN(to)) query.date.$lte = to;
      }
    }

    // Search
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
        { brand: searchRegex },
        { color: searchRegex },
      ];
    }

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
    };
    const sortObj = sortMap[sort] || sortMap['newest'];

    const [items, total] = await Promise.all([
      Item.find(query)
        .populate('reportedBy', 'name email')
        .populate('removedBy', 'name email')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Item.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPreviousPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('[Admin] getAdminItems error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching items' });
  }
};

// @desc    Get single item admin detail
// @route   GET /api/admin/items/:id
// @access  Admin
export const getAdminItemById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid item ID' });
    }

    const item = await Item.findById(req.params.id)
      .populate('reportedBy', 'name email college studentId')
      .populate('removedBy', 'name email')
      .lean();

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    // Attach claim and match summaries
    const [claims, matches] = await Promise.all([
      Claim.find({ item: item._id })
        .populate('claimant', 'name email')
        .select('status createdAt claimant evidence.message')
        .lean(),
      Match.find({ $or: [{ lostItem: item._id }, { foundItem: item._id }] })
        .select('score status lostItem foundItem')
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: { item, claims, matches },
    });
  } catch (error) {
    console.error('[Admin] getAdminItemById error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching item' });
  }
};

// @desc    Moderate (remove or flag) an item
// @route   PATCH /api/admin/items/:id/moderate
// @access  Admin
export const moderateItem = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid item ID' });
    }

    const { action, reason } = req.body;
    const validActions = ['remove', 'flag'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ success: false, message: `Invalid action. Allowed: ${validActions.join(', ')}` });
    }

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (action === 'remove') {
      item.moderationStatus = 'removed';
      item.removedAt = new Date();
      item.removedBy = req.user._id;
      item.removalReason = reason || 'Removed by admin';

      await item.save();

      await logAudit({
        admin: req.user._id,
        action: 'ITEM_REMOVED',
        targetType: 'item',
        targetId: item._id,
        metadata: { title: item.title, reason: item.removalReason },
      });

      // Notify the reporter
      try {
        await createNotification({
          recipient: item.reportedBy,
          type: 'moderation_action',
          title: 'Your item report was removed',
          message: `Your item "${item.title}" has been removed by a moderator. Reason: ${item.removalReason}`,
          actionUrl: '/my-items',
          relatedItem: item._id,
        });
      } catch (_) { /* non-fatal */ }

    } else if (action === 'flag') {
      item.moderationStatus = 'flagged';
      await item.save();

      await logAudit({
        admin: req.user._id,
        action: 'ITEM_FLAGGED',
        targetType: 'item',
        targetId: item._id,
        metadata: { title: item.title, reason: reason || 'Flagged for review' },
      });
    }

    res.status(200).json({
      success: true,
      message: `Item ${action === 'remove' ? 'removed' : 'flagged'} successfully`,
      data: { item },
    });
  } catch (error) {
    console.error('[Admin] moderateItem error:', error);
    res.status(500).json({ success: false, message: 'Server error moderating item' });
  }
};

// @desc    Restore a moderated item
// @route   PATCH /api/admin/items/:id/restore
// @access  Admin
export const restoreItem = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid item ID' });
    }

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (item.moderationStatus === 'active') {
      return res.status(400).json({ success: false, message: 'Item is already active — no restoration needed' });
    }

    item.moderationStatus = 'active';
    item.removedAt = null;
    item.removedBy = null;
    item.removalReason = null;
    await item.save();

    await logAudit({
      admin: req.user._id,
      action: 'ITEM_RESTORED',
      targetType: 'item',
      targetId: item._id,
      metadata: { title: item.title },
    });

    res.status(200).json({
      success: true,
      message: 'Item restored successfully',
      data: { item },
    });
  } catch (error) {
    console.error('[Admin] restoreItem error:', error);
    res.status(500).json({ success: false, message: 'Server error restoring item' });
  }
};

// ─── Claim Management ────────────────────────────────────────────────────────

// @desc    List all claims (admin view)
// @route   GET /api/admin/claims
// @access  Admin
export const getAdminClaims = async (req, res) => {
  try {
    const {
      page: pageParam,
      limit: limitParam,
      status,
      dateFrom,
      dateTo,
      sort,
    } = req.query;

    const page = Math.max(1, parseInt(pageParam, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitParam, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};

    const validStatuses = ['pending', 'approved', 'rejected', 'cancelled'];
    if (status && validStatuses.includes(status)) query.status = status;

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        const from = new Date(dateFrom);
        if (!isNaN(from)) query.createdAt.$gte = from;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        if (!isNaN(to)) query.createdAt.$lte = to;
      }
    }

    const sortObj = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

    const [claims, total] = await Promise.all([
      Claim.find(query)
        .populate('item', 'title type category moderationStatus')
        .populate('claimant', 'name email')
        .populate('reviewedBy', 'name email')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Claim.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        claims,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPreviousPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('[Admin] getAdminClaims error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching claims' });
  }
};

// @desc    Get single claim admin detail
// @route   GET /api/admin/claims/:id
// @access  Admin
export const getAdminClaimById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid claim ID' });
    }

    const claim = await Claim.findById(req.params.id)
      .populate('item', 'title type category location date status moderationStatus reportedBy')
      .populate('claimant', 'name email college studentId')
      .populate('reviewedBy', 'name email')
      .lean();

    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    // Populate the item's reportedBy (finder) separately since it's nested
    let finder = null;
    if (claim.item?.reportedBy) {
      finder = await User.findById(claim.item.reportedBy).select('name email college').lean();
    }

    res.status(200).json({
      success: true,
      data: { claim, finder },
    });
  } catch (error) {
    console.error('[Admin] getAdminClaimById error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching claim' });
  }
};

// ─── Report Management ───────────────────────────────────────────────────────

// @desc    List all reports (admin view)
// @route   GET /api/admin/reports
// @access  Admin
export const getAdminReports = async (req, res) => {
  try {
    const {
      page: pageParam,
      limit: limitParam,
      status,
      reason,
      targetType,
      dateFrom,
      dateTo,
      sort,
    } = req.query;

    const page = Math.max(1, parseInt(pageParam, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitParam, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};

    const validStatuses = ['pending', 'reviewed', 'dismissed', 'action_taken'];
    if (status && validStatuses.includes(status)) query.status = status;

    const validReasons = ['spam', 'fake_report', 'inappropriate_content', 'suspicious_activity', 'duplicate', 'harassment', 'other'];
    if (reason && validReasons.includes(reason)) query.reason = reason;

    if (targetType && ['item', 'user'].includes(targetType)) query.targetType = targetType;

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        const from = new Date(dateFrom);
        if (!isNaN(from)) query.createdAt.$gte = from;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        if (!isNaN(to)) query.createdAt.$lte = to;
      }
    }

    const sortObj = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate('reporter', 'name email')
        .populate('reviewedBy', 'name email')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Report.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        reports,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPreviousPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('[Admin] getAdminReports error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching reports' });
  }
};

// @desc    Get single report admin detail
// @route   GET /api/admin/reports/:id
// @access  Admin
export const getAdminReportById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid report ID' });
    }

    const report = await Report.findById(req.params.id)
      .populate('reporter', 'name email college')
      .populate('reviewedBy', 'name email')
      .lean();

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Populate target based on targetType
    let target = null;
    if (report.targetType === 'item') {
      target = await Item.findById(report.targetId)
        .populate('reportedBy', 'name email')
        .select('title type category status moderationStatus createdAt reportedBy')
        .lean();
    } else if (report.targetType === 'user') {
      target = await User.findById(report.targetId)
        .select('name email college role isActive createdAt')
        .lean();
    }

    res.status(200).json({
      success: true,
      data: { report, target },
    });
  } catch (error) {
    console.error('[Admin] getAdminReportById error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching report' });
  }
};

// @desc    Review/update a report and optionally take action
// @route   PATCH /api/admin/reports/:id
// @access  Admin
export const reviewReport = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid report ID' });
    }

    const { status, adminNote, action } = req.body;

    const validStatuses = ['reviewed', 'dismissed', 'action_taken'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${validStatuses.join(', ')}` });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    report.status = status;
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    if (adminNote !== undefined) report.adminNote = adminNote;
    await report.save();

    const auditAction = status === 'dismissed' ? 'REPORT_DISMISSED' : 'REPORT_ACTION_TAKEN';
    await logAudit({
      admin: req.user._id,
      action: status === 'reviewed' ? 'REPORT_REVIEWED' : auditAction,
      targetType: 'report',
      targetId: report._id,
      metadata: { status, adminNote, targetType: report.targetType, targetId: report.targetId },
    });

    // Optionally take a moderation action on the target
    let actionResult = null;
    if (action && status === 'action_taken') {
      if (report.targetType === 'item' && action === 'remove_item') {
        const item = await Item.findById(report.targetId);
        if (item && item.moderationStatus !== 'removed') {
          item.moderationStatus = 'removed';
          item.removedAt = new Date();
          item.removedBy = req.user._id;
          item.removalReason = `Report reviewed by admin: ${adminNote || report.reason}`;
          await item.save();

          await logAudit({
            admin: req.user._id,
            action: 'ITEM_REMOVED',
            targetType: 'item',
            targetId: item._id,
            metadata: { title: item.title, reason: item.removalReason, viaReport: report._id },
          });
          actionResult = 'item_removed';
        }
      } else if (report.targetType === 'user' && action === 'deactivate_user') {
        const targetUser = await User.findById(report.targetId);
        if (targetUser && targetUser.isActive) {
          // Last-admin protection
          if (targetUser.role === 'admin') {
            const activeAdminCount = await User.countDocuments({ role: 'admin', isActive: true });
            if (activeAdminCount <= 1) {
              return res.status(400).json({ success: false, message: 'Cannot deactivate the last active admin' });
            }
          }
          targetUser.isActive = false;
          await targetUser.save();

          await logAudit({
            admin: req.user._id,
            action: 'USER_DEACTIVATED',
            targetType: 'user',
            targetId: targetUser._id,
            metadata: { name: targetUser.name, email: targetUser.email, viaReport: report._id },
          });
          actionResult = 'user_deactivated';
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Report reviewed successfully',
      data: { report, actionResult },
    });
  } catch (error) {
    console.error('[Admin] reviewReport error:', error);
    res.status(500).json({ success: false, message: 'Server error reviewing report' });
  }
};

// ─── Audit Log ───────────────────────────────────────────────────────────────

// @desc    List audit log entries
// @route   GET /api/admin/activity
// @access  Admin
export const getAuditLog = async (req, res) => {
  try {
    const {
      page: pageParam,
      limit: limitParam,
      action,
      adminId,
      targetType,
      dateFrom,
      dateTo,
    } = req.query;

    const page = Math.max(1, parseInt(pageParam, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitParam, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};

    // Whitelist action values
    const validActions = [
      'USER_DEACTIVATED', 'USER_REACTIVATED', 'USER_ROLE_CHANGED',
      'ITEM_REMOVED', 'ITEM_RESTORED', 'ITEM_FLAGGED',
      'REPORT_REVIEWED', 'REPORT_DISMISSED', 'REPORT_ACTION_TAKEN',
      'CLAIM_REVIEWED', 'ADMIN_ACTION',
    ];
    if (action && validActions.includes(action)) query.action = action;

    if (adminId && isValidObjectId(adminId)) query.admin = adminId;

    const validTargetTypes = ['user', 'item', 'claim', 'report'];
    if (targetType && validTargetTypes.includes(targetType)) query.targetType = targetType;

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        const from = new Date(dateFrom);
        if (!isNaN(from)) query.createdAt.$gte = from;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        if (!isNaN(to)) query.createdAt.$lte = to;
      }
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('admin', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPreviousPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('[Admin] getAuditLog error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching audit log' });
  }
};
