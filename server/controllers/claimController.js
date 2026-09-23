import mongoose from 'mongoose';
import Claim from '../models/Claim.js';
import Item from '../models/Item.js';
import Match from '../models/Match.js';
import Conversation from '../models/Conversation.js';

// ─── Create Claim ──────────────────────────────────────────────────────────
// @desc    Create a claim for a found item
// @route   POST /api/items/:id/claims
// @access  Private
export const createClaim = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (item.type !== 'found') {
      return res.status(400).json({ success: false, message: 'You can only claim found items' });
    }

    if (item.reportedBy.toString() === req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You cannot claim an item you reported' });
    }

    if (item.status !== 'active') {
      return res.status(400).json({ success: false, message: `Item is no longer available (status: ${item.status})` });
    }

    const { message, specificDetails } = req.body;
    
    // Check for existing active claim by this user
    const existingClaim = await Claim.findOne({
      item: item._id,
      claimant: req.user._id,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingClaim) {
      return res.status(400).json({ success: false, message: 'You already have an active claim for this item' });
    }

    const claim = await Claim.create({
      item: item._id,
      claimant: req.user._id, // Enforced server-side
      evidence: {
        message,
        specificDetails: Array.isArray(specificDetails) ? specificDetails : [],
      },
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Claim submitted successfully',
      data: { claim },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Invalid claim data' });
  }
};

// ─── Get Claims for Item ───────────────────────────────────────────────────
// @desc    Get all claims for a specific found item
// @route   GET /api/items/:id/claims
// @access  Private (Finder only)
export const getItemClaims = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    // Only the reporter of the found item can view claims
    if (item.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the item reporter can view claims' });
    }

    const claims = await Claim.find({ item: item._id })
      .populate('claimant', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { claims },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while fetching claims' });
  }
};

// ─── Get My Claims ─────────────────────────────────────────────────────────
// @desc    Get all claims submitted by current user
// @route   GET /api/claims/my
// @access  Private
export const getMyClaims = async (req, res) => {
  try {
    const claims = await Claim.find({ claimant: req.user._id })
      .populate('item', 'title type category location date image status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { claims },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while fetching your claims' });
  }
};

// ─── Cancel Claim ──────────────────────────────────────────────────────────
// @desc    Cancel a pending claim
// @route   PATCH /api/claims/:id/cancel
// @access  Private (Claimant only)
export const cancelClaim = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    if (claim.claimant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this claim' });
    }

    if (claim.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Cannot cancel a claim that is ${claim.status}` });
    }

    claim.status = 'cancelled';
    await claim.save();

    res.status(200).json({
      success: true,
      message: 'Claim cancelled successfully',
      data: { claim },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while cancelling claim' });
  }
};

// ─── Approve Claim ─────────────────────────────────────────────────────────
// @desc    Approve a pending claim
// @route   PATCH /api/claims/:id/approve
// @access  Private (Finder only)
export const approveClaim = async (req, res) => {
  // Use transaction to ensure consistency between Claim and Item states
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const claim = await Claim.findById(req.params.id).session(session);

    if (!claim) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    if (claim.status !== 'pending') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: `Claim is already ${claim.status}` });
    }

    const item = await Item.findById(claim.item).session(session);
    
    if (item.reportedBy.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ success: false, message: 'Not authorized to approve claims for this item' });
    }

    // Update the approved claim
    claim.status = 'approved';
    claim.reviewedBy = req.user._id;
    claim.reviewedAt = new Date();
    await claim.save({ session });

    // Update the item status
    item.status = 'claimed';
    await item.save({ session });

    // Reject all other pending claims for this item
    await Claim.updateMany(
      { item: item._id, _id: { $ne: claim._id }, status: 'pending' },
      { 
        $set: { 
          status: 'rejected', 
          rejectionReason: 'Another claim was approved for this item.',
          reviewedBy: req.user._id,
          reviewedAt: new Date()
        }
      },
      { session }
    );

    // Create Conversation between Finder (req.user._id) and Claimant (claim.claimant)
    let conversation = await Conversation.findOne({ claim: claim._id }).session(session);
    if (!conversation) {
      conversation = new Conversation({
        item: item._id,
        claim: claim._id,
        participants: [item.reportedBy, claim.claimant],
        status: 'active',
      });
      await conversation.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Claim approved successfully',
      data: { claim, conversation },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, message: 'Server error while approving claim' });
  }
};

// ─── Reject Claim ──────────────────────────────────────────────────────────
// @desc    Reject a pending claim
// @route   PATCH /api/claims/:id/reject
// @access  Private (Finder only)
export const rejectClaim = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id).populate('item');

    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    if (claim.item.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to reject claims for this item' });
    }

    if (claim.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Claim is already ${claim.status}` });
    }

    const { reason } = req.body;

    claim.status = 'rejected';
    claim.rejectionReason = reason || 'No reason provided';
    claim.reviewedBy = req.user._id;
    claim.reviewedAt = new Date();
    
    await claim.save();

    res.status(200).json({
      success: true,
      message: 'Claim rejected',
      data: { claim },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while rejecting claim' });
  }
};
