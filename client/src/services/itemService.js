import api from './api';

const createFormData = (data) => {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  });
  return formData;
};

const itemService = {
  // Get items with optional search/filter/sort/pagination params
  getItems: async (params = {}) => {
    const cleanParams = {};
    Object.keys(params).forEach(key => {
      if (params[key] !== '' && params[key] !== undefined && params[key] !== null) {
        cleanParams[key] = params[key];
      }
    });
    const response = await api.get('/items', { params: cleanParams });
    return response.data;
  },

  getMyItems: async () => {
    const response = await api.get('/items/my');
    return response.data;
  },

  getItemById: async (id) => {
    const response = await api.get(`/items/${id}`);
    return response.data;
  },

  createItem: async (itemData) => {
    let payload = itemData;
    let headers = {};
    if (itemData.image && itemData.image instanceof File) {
      payload = createFormData(itemData);
      headers = { 'Content-Type': 'multipart/form-data' };
    }
    const response = await api.post('/items', payload, { headers });
    return response.data;
  },

  updateItem: async (id, itemData) => {
    let payload = itemData;
    let headers = {};
    if (itemData.image && itemData.image instanceof File) {
      payload = createFormData(itemData);
      headers = { 'Content-Type': 'multipart/form-data' };
    }
    const response = await api.put(`/items/${id}`, payload, { headers });
    return response.data;
  },

  deleteItem: async (id) => {
    const response = await api.delete(`/items/${id}`);
    return response.data;
  },

  updateItemStatus: async (id, status) => {
    const response = await api.patch(`/items/${id}/status`, { status });
    return response.data;
  },

  removeImage: async (id) => {
    const response = await api.delete(`/items/${id}/image`);
    return response.data;
  },

  // ── Phase 6: AI Matching ──────────────────────────────────────────────────
  findMatches: async (id, force = false) => {
    const response = await api.post(`/items/${id}/match${force ? '?force=true' : ''}`);
    return response.data;
  },

  getMatches: async (id) => {
    const response = await api.get(`/items/${id}/matches`);
    return response.data;
  },

  dismissMatch: async (matchId) => {
    const response = await api.patch(`/matches/${matchId}/dismiss`);
    return response.data;
  },
};

export default itemService;
