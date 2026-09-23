import api from './api';

const itemService = {
  // Create new item
  createItem: async (itemData) => {
    const response = await api.post('/items', itemData);
    return response.data;
  },

  // Get all active items
  getItems: async () => {
    const response = await api.get('/items');
    return response.data;
  },

  // Get current user's items
  getMyItems: async () => {
    const response = await api.get('/items/my');
    return response.data;
  },

  // Get single item by ID
  getItemById: async (id) => {
    const response = await api.get(`/items/${id}`);
    return response.data;
  },

  // Update item
  updateItem: async (id, itemData) => {
    const response = await api.put(`/items/${id}`, itemData);
    return response.data;
  },

  // Delete item
  deleteItem: async (id) => {
    const response = await api.delete(`/items/${id}`);
    return response.data;
  },

  // Update item status
  updateItemStatus: async (id, status) => {
    const response = await api.patch(`/items/${id}/status`, { status });
    return response.data;
  },
};

export default itemService;
