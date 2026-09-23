import Item from '../models/Item.js';
import Match from '../models/Match.js';
import { analyzeMatches } from './ai/aiProvider.js';

const CANDIDATE_LIMIT = 20;
const AI_CANDIDATE_LIMIT = 10; // top N sent to AI after pre-scoring

// ─── Pre-scoring ───────────────────────────────────────────────────────────

/**
 * Compute a simple deterministic similarity score (0–100) between two items.
 * Used to rank candidates BEFORE sending to AI, to reduce token cost.
 */
export const calculatePreScore = (target, candidate) => {
  let score = 0;

  // Category must match (we already filter by this in findCandidates, but keep for ranking)
  if (target.category && candidate.category && target.category === candidate.category) score += 25;

  // Brand match (case-insensitive)
  if (target.brand && candidate.brand &&
      target.brand.toLowerCase() === candidate.brand.toLowerCase()) score += 20;

  // Color match (case-insensitive)
  if (target.color && candidate.color &&
      target.color.toLowerCase() === candidate.color.toLowerCase()) score += 15;

  // Location similarity (one contains the other, case-insensitive)
  if (target.location && candidate.location) {
    const tLoc = target.location.toLowerCase();
    const cLoc = candidate.location.toLowerCase();
    if (tLoc.includes(cLoc) || cLoc.includes(tLoc)) score += 20;
  }

  // Date proximity — within 3 days = full points, within 7 = partial
  if (target.date && candidate.date) {
    const diffDays = Math.abs(
      (new Date(target.date) - new Date(candidate.date)) / (1000 * 60 * 60 * 24)
    );
    if (diffDays <= 1) score += 20;
    else if (diffDays <= 3) score += 12;
    else if (diffDays <= 7) score += 5;
  }

  return Math.min(100, score);
};

// ─── Candidate Retrieval ───────────────────────────────────────────────────

/**
 * Find plausible opposing-type candidates for the given item.
 * Prioritises same category; falls back to any active opposing item if needed.
 */
export const findCandidates = async (item) => {
  const oppositeType = item.type === 'lost' ? 'found' : 'lost';

  // Stage 1: same category
  let candidates = await Item.find({
    type: oppositeType,
    status: 'active',
    category: item.category,
    _id: { $ne: item._id },
  })
    .sort({ createdAt: -1 })
    .limit(CANDIDATE_LIMIT)
    .lean();

  // Stage 2: if too few, expand to any active opposing items
  if (candidates.length < 5) {
    const extra = await Item.find({
      type: oppositeType,
      status: 'active',
      _id: { $nin: [item._id, ...candidates.map(c => c._id)] },
    })
      .sort({ createdAt: -1 })
      .limit(CANDIDATE_LIMIT - candidates.length)
      .lean();
    candidates = [...candidates, ...extra];
  }

  return candidates;
};

// ─── Validation ────────────────────────────────────────────────────────────

/**
 * Validate AI response: ensure scores are 0-100, itemIds exist in candidates,
 * and reasons are non-empty strings.
 */
const validateAIResponse = (aiMatches, candidates) => {
  const candidateIds = new Set(candidates.map(c => c._id.toString()));
  const threshold = parseInt(process.env.AI_MATCH_THRESHOLD || '70', 10);

  return aiMatches
    .filter(m => {
      if (!m.itemId || !candidateIds.has(m.itemId)) return false;
      if (typeof m.score !== 'number' || m.score < 0 || m.score > 100) return false;
      if (!Array.isArray(m.reasons) || m.reasons.length === 0) return false;
      if (m.score < threshold) return false;
      return true;
    })
    .map(m => ({
      itemId: m.itemId,
      score: Math.round(Math.max(0, Math.min(100, m.score))),
      reasons: m.reasons
        .filter(r => typeof r === 'string' && r.trim().length > 0)
        .slice(0, 5),
    }));
};

// ─── Match Persistence ─────────────────────────────────────────────────────

/**
 * Upsert Match documents. Uses the unique compound index {lostItem, foundItem}
 * to prevent duplicate documents for the same pair.
 */
const saveMatches = async (targetItem, validatedMatches, candidateMap) => {
  const saved = [];

  for (const m of validatedMatches) {
    const candidate = candidateMap[m.itemId];
    if (!candidate) continue;

    const lostItem  = targetItem.type === 'lost'  ? targetItem._id : candidate._id;
    const foundItem = targetItem.type === 'found' ? targetItem._id : candidate._id;

    const doc = await Match.findOneAndUpdate(
      { lostItem, foundItem },
      {
        $set: {
          score: m.score,
          reasons: m.reasons,
          status: 'potential',
          generatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );
    saved.push(doc);
  }

  return saved;
};

// ─── Main Orchestrator ─────────────────────────────────────────────────────

/**
 * Run the full matching pipeline for a given item.
 * Returns saved Match documents (potentially empty).
 */
export const runMatching = async (item) => {
  // 1. Find candidates
  const candidates = await findCandidates(item);
  if (candidates.length === 0) {
    console.info(`[Matching] No candidates found for item ${item._id}`);
    return [];
  }

  // 2. Pre-score and rank — send only top N to AI
  const scored = candidates
    .map(c => ({ candidate: c, preScore: calculatePreScore(item, c) }))
    .sort((a, b) => b.preScore - a.preScore)
    .slice(0, AI_CANDIDATE_LIMIT)
    .map(s => s.candidate);

  console.info(`[Matching] ${candidates.length} candidates found, sending top ${scored.length} to AI for item ${item._id}`);

  // 3. AI analysis
  const aiRaw = await analyzeMatches(item, scored);

  // 4. Validate AI output
  const candidateMap = Object.fromEntries(scored.map(c => [c._id.toString(), c]));
  const validated = validateAIResponse(aiRaw, scored);

  console.info(`[Matching] AI returned ${aiRaw.length} matches, ${validated.length} passed validation/threshold for item ${item._id}`);

  // 5. Persist
  const saved = await saveMatches(item, validated, candidateMap);
  return saved;
};
