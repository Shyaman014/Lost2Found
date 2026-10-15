import { processChat } from '../services/ai/chatService.js';

// Input constraints (duplicated from chatService for early rejection before the service is called)
const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY_LENGTH = 20; // maximum number of history entries accepted from client

// @desc    Chat with Lost2Found AI Assistant (powered by Google Gemini)
// @route   POST /api/ai/chat
// @access  Private
export const chatWithAssistant = async (req, res) => {
  const { message, history } = req.body;

  // ── Input Validation ────────────────────────────────────────────────────
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ success: false, message: 'Message is required and must be a string.' });
  }

  const trimmed = message.trim();

  if (trimmed.length === 0) {
    return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
  }

  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({
      success: false,
      message: `Message is too long. Maximum ${MAX_MESSAGE_LENGTH} characters allowed.`,
    });
  }

  // Validate history shape — must be an array if provided
  let safeHistory = [];
  if (history !== undefined) {
    if (!Array.isArray(history)) {
      return res.status(400).json({ success: false, message: 'History must be an array.' });
    }
    // Truncate to avoid abuse; the service will sanitise further
    safeHistory = history.slice(-MAX_HISTORY_LENGTH);
  }

  // ── Gemini Call ──────────────────────────────────────────────────────────
  try {
    const result = await processChat(trimmed, safeHistory);

    // Surface a 429 hint when rate-limited so the client can back off
    if (result.rateLimited) {
      return res.status(429).json({
        success: false,
        message: result.reply,
        rateLimited: true,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        reply:    result.reply,
        fallback: result.fallback, // lets the client know if Gemini was unavailable
      },
    });
  } catch (error) {
    console.error('[AI Chat] Unhandled error:', error);
    return res.status(500).json({
      success: false,
      message: "I'm having trouble responding right now. Please try again in a moment.",
    });
  }
};
