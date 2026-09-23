import api from './api';

const analyticsService = {
  /**
   * Get complete platform analytics & insights
   * @param {Object} params - { range: '7d'|'30d'|'90d'|'1y', from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' }
   */
  getAnalyticsOverview: async (params = {}) => {
    const cleanParams = {};
    Object.keys(params).forEach((key) => {
      if (params[key] !== '' && params[key] !== undefined && params[key] !== null) {
        cleanParams[key] = params[key];
      }
    });
    const response = await api.get('/admin/analytics/overview', { params: cleanParams });
    return response.data;
  },
};

export default analyticsService;
