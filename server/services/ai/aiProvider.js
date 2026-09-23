import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  console.warn('[AIProvider] GEMINI_API_KEY is not set. AI matching will fail.');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

/**
 * Build a structured prompt for matching a target item against candidates.
 * Only metadata fields are sent — no passwords, JWTs, emails or user credentials.
 */
const buildPrompt = (targetItem, candidates) => {
  const formatItem = (item) => ({
    id: item._id.toString(),
    type: item.type,
    title: item.title,
    description: item.description,
    category: item.category,
    location: item.location,
    date: item.date ? new Date(item.date).toISOString().split('T')[0] : 'unknown',
    color: item.color || 'unknown',
    brand: item.brand || 'unknown',
    identifyingDetails: item.identifyingDetails || 'none',
  });

  return `You are an AI assistant for a college Lost & Found platform.

Your task is to compare a target report against a list of candidate reports and identify potential matches.

Rules:
- A "match" means the two items COULD be the same physical item.
- Do NOT assume items are the same just because they share generic attributes (e.g., both are "black").
- Consider ALL available signals: category, title, description, brand, color, location, date, and identifying details.
- Be skeptical. A high score (80+) should only be given when multiple specific signals align.
- Do NOT invent or assume any information not present in the data.
- Return ONLY valid JSON. No extra text, no markdown, no code fences.

Target item (the one we are finding matches for):
${JSON.stringify(formatItem(targetItem), null, 2)}

Candidate items (opposite type — these are what we are comparing against):
${JSON.stringify(candidates.map(formatItem), null, 2)}

Return a JSON object with this exact structure:
{
  "matches": [
    {
      "itemId": "<candidate id string>",
      "score": <integer 0-100>,
      "reasons": ["<concise factual reason>", ...]
    }
  ]
}

Only include candidates with a score >= 40. Omit the rest entirely.
Reasons must be factual observations (e.g., "Same brand: Casio"), not conclusions (e.g., "This is the same item").
Maximum 5 reasons per match.`;
};

/**
 * Send target + candidates to Gemini and return parsed AI match results.
 * @param {Object} targetItem - The item we are matching for
 * @param {Array} candidates - Up to 10 candidate items
 * @returns {Array} Array of { itemId, score, reasons }
 */
export const analyzeMatches = async (targetItem, candidates) => {
  if (!candidates || candidates.length === 0) return [];

  const model = genAI.getGenerativeModel({ model: modelName });
  const prompt = buildPrompt(targetItem, candidates);

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Strip any accidental markdown code fences the model may add
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`AI returned invalid JSON: ${cleaned.slice(0, 200)}`);
  }

  if (!Array.isArray(parsed.matches)) {
    throw new Error('AI response missing "matches" array.');
  }

  return parsed.matches;
};
