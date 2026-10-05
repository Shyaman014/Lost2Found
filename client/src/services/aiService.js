import api from './api';

const aiService = {
  chat: async (message, history = []) => {
    try {
      const response = await api.post('/ai/chat', { message, history });
      return response.data;
    } catch (error) {
      console.error('AI Chat Error:', error);
      throw error;
    }
  },
};

export default aiService;
