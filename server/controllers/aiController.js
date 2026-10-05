import { GoogleGenerativeAI } from '@google/generative-ai';
import Item from '../models/Item.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

// @desc    Chat with AI Assistant about lost/found items
// @route   POST /api/ai/chat
// @access  Private
export const chatWithAssistant = async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ success: false, message: 'AI service is not configured' });
  }

  try {
    // Fetch recent active items to provide context
    const items = await Item.find({ status: 'active' }).sort({ createdAt: -1 }).limit(50);
    
    const formattedItems = items.map(item => ({
      id: item._id,
      type: item.type,
      title: item.title,
      category: item.category,
      location: item.location,
      date: item.date ? new Date(item.date).toISOString().split('T')[0] : 'unknown',
      description: item.description,
      color: item.color,
      brand: item.brand,
    }));

    const systemPrompt = `You are a helpful and friendly AI assistant for "Lost2Found", a college campus lost and found platform.
Your goal is to help users find items they lost or check if something they found has been reported.
You have access to the current active items in the database (up to 50 recent items).

Current Active Items:
${JSON.stringify(formattedItems, null, 2)}

Instructions:
- If the user asks about an item, search the "Current Active Items" list and tell them if there are any potential matches.
- Be conversational and polite.
- If they ask for something that is found, provide details like the title, location, date, and category.
- Do NOT provide raw item IDs in your response unless asked. Use natural language to describe items.
- If there are no matches, encourage them to report the item themselves.
- Keep your answers concise but helpful.`;

    const model = genAI.getGenerativeModel({ model: modelName });
    
    // The frontend sends an initial greeting from 'ai'. 
    // We must remove it to avoid consecutive 'model' roles which crashes Gemini.
    const validHistory = (history || []).filter((msg, idx) => {
      // Skip the very first AI greeting from frontend to maintain user/model alternation
      if (idx === 0 && msg.role === 'ai') return false;
      return true;
    });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: "Understood! I'm ready to help users find their lost items or match found items on the Lost2Found platform." }],
        },
        ...validHistory.map(msg => ({
          role: msg.role === 'ai' ? 'model' : 'user',
          parts: [{ text: msg.text }]
        }))
      ],
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    res.json({
      success: true,
      data: {
        reply: responseText
      }
    });

  } catch (error) {
    console.error('[AI Chat] Error:', error);
    res.status(500).json({ success: false, message: 'AI failed to respond' });
  }
};
