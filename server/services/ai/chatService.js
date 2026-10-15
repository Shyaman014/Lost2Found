import { GoogleGenerativeAI } from '@google/generative-ai';
import Item from '../../models/Item.js';

// ─── Gemini Client ──────────────────────────────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME    = process.env.GEMINI_CHAT_MODEL || process.env.GEMINI_MODEL || 'gemini-1.5-flash';

let genAI = null;

const getGenAI = () => {
  if (!genAI) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'api') {
      return null;
    }
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return genAI;
};

// ─── Constants ──────────────────────────────────────────────────────────────

const MAX_MESSAGE_LENGTH     = 500;
const MAX_HISTORY_TURNS      = 10;   // Number of user+model turn pairs kept
const MAX_CONTEXT_ITEMS      = 15;   // Recent active DB items injected as context
const FALLBACK_MESSAGE =
  "I'm having trouble connecting to my AI service right now. " +
  "Please try again in a moment, or browse the Items page directly to search for lost and found reports.";

// ─── System Prompt ──────────────────────────────────────────────────────────

/**
 * Build the system instruction that grounds the model in the platform context.
 * Live database items are injected so the model can reference real reports
 * without hallucinating item IDs or details.
 */
const buildSystemInstruction = (activeItems) => {
  const itemSummaries = activeItems
    .map((item) => {
      const date = item.date
        ? new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'unknown date';
      const parts = [
        `[${item.type.toUpperCase()}] "${item.title}"`,
        `Category: ${item.category}`,
        `Location: ${item.location}`,
        `Date: ${date}`,
      ];
      if (item.color) parts.push(`Color: ${item.color}`);
      if (item.brand) parts.push(`Brand: ${item.brand}`);
      // Never expose identifyingDetails — they are a security field
      return parts.join(' | ');
    })
    .join('\n');

  return `You are the Lost2Found AI Assistant, an intelligent helper for a college campus lost-and-found platform.

Your role:
- Help students and staff find lost items or report found items.
- Search and reference ONLY the live item database excerpts provided below. Never invent items.
- Guide users on how to submit a report, claim an item, or use the platform.
- Keep responses concise and helpful. Use markdown bold (**text**) to highlight item names and locations.
- Do NOT expose or guess item "identifyingDetails" fields — those are hidden security fields.
- Do NOT discuss topics unrelated to lost and found. Politely redirect off-topic questions.
- If a user describes an item and it matches something in the database, mention it clearly.
- If no matching item is found, encourage the user to create a report.

Platform quick-reference:
- Users can post "Lost" reports (something they lost) or "Found" reports (something they found).
- Once a found item is claimed and approved, a private anonymous chat opens between the finder and claimant.
- Items can be in categories: electronics, clothing, accessories, books, wallet, keys, bag, sports, jewellery, documents, other.

Current active item database (${activeItems.length} items):
${itemSummaries || '(No active items in the database right now.)'}

Respond naturally and helpfully. If the database is empty, tell the user and encourage them to create a report.`;
};

// ─── History Sanitisation ────────────────────────────────────────────────────

/**
 * Convert client-supplied history into the Gemini-SDK `Content[]` shape,
 * trim to the last N turns, and reject any malformed entries.
 */
const sanitiseHistory = (rawHistory) => {
  if (!Array.isArray(rawHistory)) return [];

  const valid = rawHistory
    .filter(
      (entry) =>
        entry &&
        typeof entry.role === 'string' &&
        typeof entry.text === 'string' &&
        entry.text.trim().length > 0 &&
        ['user', 'ai'].includes(entry.role)
    )
    .slice(-(MAX_HISTORY_TURNS * 2)); // keep last N turn pairs (each turn = 1 user + 1 ai)

  // Map client roles to Gemini SDK roles: 'ai' → 'model'
  return valid.map((entry) => ({
    role: entry.role === 'ai' ? 'model' : 'user',
    parts: [{ text: entry.text.slice(0, MAX_MESSAGE_LENGTH * 2) }],
  }));
};

// ─── Gemini API Call ─────────────────────────────────────────────────────────

/**
 * Send a message to Gemini using multi-turn chat with context.
 *
 * @param {string}   message     - The current user message (already validated)
 * @param {Array}    history     - Prior conversation turns from the client
 * @param {Array}    activeItems - Live DB items for context injection
 * @returns {Promise<string>}    - The model's text reply
 */
const callGemini = async (message, history, activeItems) => {
  const client = getGenAI();
  if (!client) {
    throw new Error('GEMINI_API_KEY_MISSING');
  }

  const model = client.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: buildSystemInstruction(activeItems),
    generationConfig: {
      temperature:     0.7,
      maxOutputTokens: 512,
      topP:            0.9,
    },
  });

  const geminiHistory = sanitiseHistory(history);

  const chat = model.startChat({ history: geminiHistory });

  const result = await chat.sendMessage(message);
  const response = result.response;

  if (!response) throw new Error('Empty response from Gemini API');

  // Check finish reason for safety blocks
  const candidate = response.candidates?.[0];
  if (candidate?.finishReason === 'SAFETY') {
    return "I can't respond to that message. Please keep questions related to lost and found items.";
  }

  return response.text().trim();
};

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Main entry point used by the controller.
 *
 * @param {string} message   - Validated, trimmed user message
 * @param {Array}  history   - Prior conversation turns from the client
 * @returns {{ reply: string, fallback: boolean }}
 */
export const processChat = async (message, history = []) => {
  // Fetch live context items (non-sensitive fields only)
  let activeItems = [];
  try {
    activeItems = await Item.find({ status: 'active' })
      .select('title description type category location date color brand')
      .sort({ createdAt: -1 })
      .limit(MAX_CONTEXT_ITEMS)
      .lean();
  } catch {
    // DB failure should not crash the chat endpoint
    activeItems = [];
  }

  // Attempt real Gemini call
  try {
    const reply = await callGemini(message, history, activeItems);
    return { reply, fallback: false };
  } catch (err) {
    const msg = err.message || '';

    // Surface-level Gemini error classification
    const isRateLimit = /429|quota|rate.?limit|resource.?exhausted/i.test(msg);
    const isKeyMissing = msg === 'GEMINI_API_KEY_MISSING';
    const isApiError   = /4\d\d|5\d\d|fetch|network|ECONNREFUSED/i.test(msg);

    if (isRateLimit) {
      console.warn('[ChatService] Gemini rate limit hit — falling back');
      return {
        reply:
          "I'm currently handling a lot of requests. Please wait a moment and try again, " +
          "or browse the **Items** page to search directly.",
        fallback: true,
        rateLimited: true,
      };
    }

    if (isKeyMissing) {
      console.error('[ChatService] GEMINI_API_KEY is not configured');
    } else if (isApiError) {
      console.error('[ChatService] Gemini API error:', msg);
    } else {
      console.error('[ChatService] Unexpected error:', err);
    }

    // Generic graceful fallback — attempt a simple DB-assisted reply
    const fallbackReply = await buildFallbackReply(message, activeItems);
    return { reply: fallbackReply, fallback: true };
  }
};

// ─── Graceful Fallback ────────────────────────────────────────────────────────

/**
 * When Gemini is unavailable, provide a best-effort DB-assisted response
 * so the chatbot remains useful without the AI backend.
 */
const buildFallbackReply = async (message, activeItems) => {
  const lower = message.toLowerCase();

  const isGreeting = /\b(hi|hello|hey|howdy|greetings)\b/.test(lower);
  const isHelp     = /\b(help|what can you do|how do)\b/.test(lower);
  const isSearch   = /\b(find|lost|looking for|found|search|where)\b/.test(lower);

  if (isGreeting) {
    return "Hi! I'm the Lost2Found AI Assistant. I can help you find lost or found items on campus. What are you looking for?";
  }

  if (isHelp) {
    return (
      "I can help you:\n" +
      "• **Search** for lost or found items on campus\n" +
      "• **Guide you** through posting a report\n" +
      "• **Answer questions** about how claims and chats work\n\n" +
      "Just describe what you're looking for!"
    );
  }

  if (isSearch && activeItems.length > 0) {
    // Simple keyword match against titles and categories
    const words = lower.replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 3);
    const match = activeItems.find((item) => {
      const itemText = `${item.title} ${item.description || ''} ${item.category} ${item.color || ''} ${item.brand || ''}`.toLowerCase();
      return words.some((w) => itemText.includes(w));
    });

    if (match) {
      const dateStr = match.date
        ? new Date(match.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        : '';
      return (
        `I found a potential match! A **${match.title}** was ${match.type === 'found' ? 'found' : 'reported lost'} ` +
        `at **${match.location}**${dateStr ? ` on ${dateStr}` : ''}. ` +
        `Visit the Items page for full details and to submit a claim.`
      );
    }

    return (
      "I couldn't find a matching item in the current database. " +
      "Consider **creating a report** so others can keep an eye out for it!"
    );
  }

  return FALLBACK_MESSAGE;
};
