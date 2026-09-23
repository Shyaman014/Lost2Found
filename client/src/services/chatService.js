import api from './api';

const chatService = {
  getConversations: async () => {
    const response = await api.get('/conversations');
    return response.data;
  },

  getConversation: async (id) => {
    const response = await api.get(`/conversations/${id}`);
    return response.data;
  },

  getMessages: async (id, page = 1, limit = 50) => {
    const response = await api.get(`/conversations/${id}/messages?page=${page}&limit=${limit}`);
    return response.data;
  },

  markMessagesRead: async (id) => {
    const response = await api.patch(`/conversations/${id}/read`);
    return response.data;
  }
};

export default chatService;
