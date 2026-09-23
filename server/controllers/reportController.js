import mongoose from 'mongoose';
import Report from '../models/Report.js';
import Item from '../models/Item.js';
import User from '../models/User.js';
import { VALID_REASONS, VALID_TARGET_TYPES } from '../models/Report.js';
import { notifyAdmins } from '../services/notificationService.js';

// @desc    Submit a content report
// @route   POST /api/reports
// @access  Private (authenticated students and admins)
export const submitReport = async (req, res) => {
  try {
    const { targetType, targetId, reason, description } = req.body;

    // Validate targetType
    if (!VALID_TARGET_TYPES.includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid targetType. Allowed: ${VALID_TARGET_TYPES.join(', ')}`,
      });
    }

    // Validate reason
    if (!VALID_REASONS.includes(reason)) {
      return res.status(400).json({
        success: false,
        message: `Invalid reason. Allowed: ${VALID_REASONS.join(', ')}`,
      });
    }

    // Validate targetId
    if (!targetId || !mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ success: false, message: 'Invalid target ID' });
    }

    // Verify the target actually exists
    if (targetType === 'item') {
      const item = await Item.findById(targetId).lean();
      if (!item) {
        return res.status(404).json({ success: false, message: 'Target item not found' });
      }
    } else if (targetType === 'user') {
      const user = await User.findById(targetId).lean();
      if (!user) {
        return res.status(404).json({ success: false, message: 'Target user not found' });
      }
      // Prevent reporting oneself
      if (targetId.toString() === req.user._id.toString()) {
        return res.status(400).json({ success: false, message: 'You cannot report yourself' });
      }
    }

    // Reporter is always taken from the authenticated session — never from the body
    const report = await Report.create({
      reporter: req.user._id,
      targetType,
      targetId,
      reason,
      description: description?.trim(),
    });

    // Notify admins of the new report
    await notifyAdmins({
      type: 'report_submitted',
      title: 'New report submitted',
      message: `A user reported a ${targetType} for: ${reason.replace(/_/g, ' ')}`,
      actionUrl: `/admin/reports/${report._id}`,
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Our moderation team will review it shortly.',
      data: { reportId: report._id },
    });
  } catch (error) {
    // Duplicate index violation = already reported this target
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted a pending report for this content',
      });
    }
    console.error('[Report] submitReport error:', error);
    res.status(500).json({ success: false, message: 'Server error submitting report' });
  }
};
