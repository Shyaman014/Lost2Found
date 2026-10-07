import Item from '../models/Item.js';

// @desc    Chat with Mock AI Assistant about lost/found items
// @route   POST /api/ai/chat
// @access  Private
export const chatWithAssistant = async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }

  try {
    // Fetch recent active items to provide context
    const items = await Item.find({ status: 'active' }).sort({ createdAt: -1 }).limit(50);
    
    // Simple simulated AI logic (keyword matching)
    const lowerMessage = message.toLowerCase();
    
    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    let reply = "I'm not sure I understand. Could you describe the item you lost or found (e.g., 'did anyone find a backpack' or 'I lost my keys')?";

    // Greetings
    if (lowerMessage.match(/\b(hi|hello|hey|howdy|greetings)\b/)) {
      reply = "Hello there! I'm the Lost2Found AI. I can check our database for you. What are you looking for?";
    }
    // Asking how it is
    else if (lowerMessage.match(/how are (u|you)/)) {
      reply = "I'm just a simulated AI living in your code, but I'm doing great! How can I help you find an item today?";
    }
    // Searching for items
    else if (lowerMessage.includes('find') || lowerMessage.includes('lost') || lowerMessage.includes('looking for') || lowerMessage.includes('search')) {
      // Try to find matching items based on words in the user's message
      const words = lowerMessage.replace(/[^a-z0-9 ]/g, '').split(' ').filter(w => w.length > 3);
      
      const matches = items.filter(item => {
        const itemText = `${item.title} ${item.description} ${item.category} ${item.color} ${item.brand}`.toLowerCase();
        return words.some(word => itemText.includes(word));
      });

      if (matches.length > 0) {
        const item = matches[0]; // Just take the first match for simplicity
        const itemType = item.type === 'found' ? 'found' : 'reported as lost';
        reply = `I found a potential match in our database! A **${item.title}** was ${itemType} at the ${item.location}. Go to the Items page to see more details!`;
      } else {
        reply = "I've checked our recent database, but I couldn't find any items matching your description right now. You should consider creating a report so others can keep an eye out for it!";
      }
    }
    // Generic question about the system
    else if (lowerMessage.includes('what can you do') || lowerMessage.includes('help')) {
      reply = "I can scan our database of lost and found items. Just tell me what you're looking for, like 'did anyone find a yellow backpack?' and I'll check for you!";
    }
    // Default fallback
    else {
      reply = "I've checked the latest reports. There's currently nothing matching that description. Is there anything else I can check for you?";
    }

    res.json({
      success: true,
      data: {
        reply
      }
    });

  } catch (error) {
    console.error('[AI Chat Mock] Error:', error);
    res.status(500).json({ success: false, message: 'AI failed to respond' });
  }
};
