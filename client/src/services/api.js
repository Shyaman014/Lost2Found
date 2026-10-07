import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true, // Crucial for sending/receiving cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Normalize error responses so err.response.data.message is always available
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with a non-2xx status — pass through as-is
      return Promise.reject(error);
    }
    if (error.request) {
      // Request made but no response received (server down / CORS blocked)
      error.response = {
        data: { success: false, message: 'Cannot connect to server. Please check your connection.' },
      };
    }
    return Promise.reject(error);
  }
);

export default api;
