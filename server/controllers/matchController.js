import Item from '../models/Item.js';
import Match from '../models/Match.js';
import { runMatching } from '../services/matchingService.js';

// ─── Trigger AI Matching ───────────────────────────────────────────────────
// @desc    Run AI matching for an item
// @route   POST /api/items/:id/match
// @access  Private — only the item reporter
export const triggerMatching = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).lean();

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    // Only the item reporter may trigger matching
    if (item.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the item reporter can trigger matching' });
    }

    // Rate-limit: skip AI if matches were already generated in the last 24 hours
    // (unless the client sends ?force=true)
    const force = req.query.force === 'true';
    if (!force) {
      const recentMatch = await Match.findOne({
        $or: [{ lostItem: item._id }, { foundItem: item._id }],
        generatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });
      if (recentMatch) {
        // Return existing matches rather than calling AI again
        const existing = await getMatchesForItem(item);
        return res.status(200).json({
          success: true,
          message: 'Using recent match results (generated within last 24h). Use ?force=true to regenerate.',
          data: { matches: existing },
        });
      }
    }

    // Run the full matching pipeline
    const savedMatches = await runMatching(item);

    // Fetch populated matches to return to client
    const populated = await getMatchesForItem(item);

    res.status(200).json({
      success: true,
      message: savedMatches.length > 0
        ? `${savedMatches.length} potential match(es) found`
        : 'No strong potential matches found at this time',
      data: { matches: populated },
    });
  } catch (error) {
    console.error('[matchController] triggerMatching error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to find matches right now. Please try again later.',
    });
  }
};

// ─── Get Matches ───────────────────────────────────────────────────────────
// @desc    Get potential matches for an item
// @route   GET /api/items/:id/matches
// @access  Private
export const getMatches = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).lean();
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const matches = await getMatchesForItem(item);

    res.status(200).json({
      success: true,
      data: { matches },
    });
  } catch (error) {
    console.error('[matchController] getMatches error:', error.message);
    res.status(500).json({ success: false, message: 'Server error while fetching matches' });
  }
};

// ─── Dismiss Match ─────────────────────────────────────────────────────────
// @desc    Dismiss a potential match
// @route   PATCH /api/matches/:id/dismiss
// @access  Private — only reporter of the lost OR found item in the match
export const dismissMatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('lostItem', 'reportedBy')
      .populate('foundItem', 'reportedBy');

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    const userId = req.user._id.toString();
    const lostReporter  = match.lostItem?.reportedBy?.toString();
    const foundReporter = match.foundItem?.reportedBy?.toString();

    if (userId !== lostReporter && userId !== foundReporter) {
      return res.status(403).json({ success: false, message: 'Not authorized to dismiss this match' });
    }

    match.status = 'dismissed';
    await match.save();

    res.status(200).json({
      success: true,
      message: 'Match dismissed',
      data: { match },
    });
  } catch (error) {
    console.error('[matchController] dismissMatch error:', error.message);
    res.status(500).json({ success: false, message: 'Server error while dismissing match' });
  }
};

// ─── Helper ────────────────────────────────────────────────────────────────

/**
 * Return populated potential matches for a given item, regardless of whether
 * it is the lost or found side.
 */
const getMatchesForItem = async (item) => {
  const query = item.type === 'lost'
    ? { lostItem: item._id, status: 'potential' }
    : { foundItem: item._id, status: 'potential' };

  const matches = await Match.find(query)
    .populate({
      path: item.type === 'lost' ? 'foundItem' : 'lostItem',
      select: 'title type category location date color brand image status',
    })
    .sort({ score: -1 })
    .lean();

  // Normalise the response: always expose the "other" item as `matchedItem`
  return matches.map(m => ({
    _id: m._id,
    score: m.score,
    reasons: m.reasons,
    status: m.status,
    generatedAt: m.generatedAt,
    matchedItem: item.type === 'lost' ? m.foundItem : m.lostItem,
  }));
};
