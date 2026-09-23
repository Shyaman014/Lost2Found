import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Claim from '../models/Claim.js';
import Item from '../models/Item.js';

// ─── Get All Conversations for User ────────────────────────────────────────
// @desc    Get all conversations where the user is a participant
// @route   GET /api/conversations
// @access  Private
export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('item', 'title type image')
      .populate('claim', 'status')
      .sort({ lastMessageAt: -1 })
      .lean();

    // Retrieve the latest message for each conversation
    const conversationIds = conversations.map(c => c._id);
    
    // Aggregation to get latest message per conversation
    const latestMessages = await Message.aggregate([
      { $match: { conversation: { $in: conversationIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$conversation',
          latestMessage: { $first: '$$ROOT' },
        },
      },
    ]);

    const latestMessageMap = latestMessages.reduce((acc, curr) => {
      acc[curr._id.toString()] = curr.latestMessage;
      return acc;
    }, {});

    // Count unread messages per conversation for this user
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          conversation: { $in: conversationIds },
          sender: { $ne: req.user._id },
          readAt: null,
        },
      },
      {
        $group: {
          _id: '$conversation',
          count: { $sum: 1 },
        },
      },
    ]);

    const unreadMap = unreadCounts.reduce((acc, curr) => {
      acc[curr._id.toString()] = curr.count;
      return acc;
    }, {});

    // Format the response to include anonymous roles and metadata
    const formattedConversations = conversations.map(c => {
      // Find out if the current user is the finder or claimant
      // Finder = the one who reported the item
      // We can get this from the Item model or assume from the fact that it's a found item
      // Wait, we need to populate Item.reportedBy to know for sure
      return {
        _id: c._id,
        item: c.item,
        status: c.status,
        lastMessageAt: c.lastMessageAt,
        latestMessage: latestMessageMap[c._id.toString()] || null,
        unreadCount: unreadMap[c._id.toString()] || 0,
      };
    });

    res.status(200).json({
      success: true,
      data: { conversations: formattedConversations },
    });
  } catch (error) {
    console.error('[conversationController] getConversations error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching conversations' });
  }
};

// ─── Get Single Conversation ───────────────────────────────────────────────
// @desc    Get conversation by ID
// @route   GET /api/conversations/:id
// @access  Private
export const getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('item', 'title type status reportedBy')
      .populate('claim', 'status')
      .lean();

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this conversation' });
    }

    // Determine anonymous role
    // The finder is the one who reported the item.
    const isFinder = conversation.item.reportedBy.toString() === req.user._id.toString();
    const myRole = isFinder ? 'Finder' : 'Claimant';
    const otherRole = isFinder ? 'Claimant' : 'Finder';

    // The frontend needs to know who is who. We'll map the participant IDs to roles.
    const roles = {};
    conversation.participants.forEach(p => {
      if (p.toString() === conversation.item.reportedBy.toString()) {
        roles[p.toString()] = 'Finder';
      } else {
        roles[p.toString()] = 'Claimant';
      }
    });

    res.status(200).json({
      success: true,
      data: { 
        conversation: {
          ...conversation,
          myRole,
          otherRole,
          roles, // Map of userId -> Role
        }
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while fetching conversation' });
  }
};

// ─── Get Messages for Conversation ─────────────────────────────────────────
// @desc    Get messages for a conversation with pagination
// @route   GET /api/conversations/:id/messages
// @access  Private
export const getMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ conversation: conversation._id })
      .sort({ createdAt: -1 }) // Newest first for pagination
      .skip(skip)
      .limit(limit)
      .lean();

    // The frontend usually expects messages in chronological order (oldest to newest) to render top-down
    const chronologicalMessages = messages.reverse();

    const total = await Message.countDocuments({ conversation: conversation._id });

    res.status(200).json({
      success: true,
      data: {
        messages: chronologicalMessages,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while fetching messages' });
  }
};

// ─── Mark Messages Read ────────────────────────────────────────────────────
// @desc    Mark unread messages in conversation as read
// @route   PATCH /api/conversations/:id/read
// @access  Private
export const markMessagesRead = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Message.updateMany(
      {
        conversation: conversation._id,
        sender: { $ne: req.user._id },
        readAt: null,
      },
      {
        $set: { readAt: new Date() },
      }
    );

    res.status(200).json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while marking messages read' });
  }
};
