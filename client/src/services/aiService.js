import api from './api';

const aiService = {
  /**
   * Send a message to the AI chat endpoint.
   *
   * @param {string} message  - Current user message
   * @param {Array}  history  - Prior conversation turns [{ role: 'user'|'ai', text: string }]
   * @returns {Promise}       - Axios response data
   */
  chat: async (message, history = []) => {
    const response = await api.post('/ai/chat', { message, history });
    return response.data;
  },
};

export default aiService;
