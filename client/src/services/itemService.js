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
  // Create new item
  createItem: async (itemData) => {
    // Determine if we need to send JSON or FormData (if there is a file)
    let payload = itemData;
    let headers = {};
    if (itemData.image && itemData.image instanceof File) {
      payload = createFormData(itemData);
      headers = { 'Content-Type': 'multipart/form-data' };
    }

    const response = await api.post('/items', payload, { headers });
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
    let payload = itemData;
    let headers = {};
    if (itemData.image && itemData.image instanceof File) {
      payload = createFormData(itemData);
      headers = { 'Content-Type': 'multipart/form-data' };
    }

    const response = await api.put(`/items/${id}`, payload, { headers });
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

  // Remove image from item
  removeImage: async (id) => {
    const response = await api.delete(`/items/${id}/image`);
    return response.data;
  }
};

export default itemService;
