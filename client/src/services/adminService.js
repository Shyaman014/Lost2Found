import api from './api';

const adminService = {
  // ── Dashboard ──────────────────────────────────────────────────────────────
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },

  // ── Users ─────────────────────────────────────────────────────────────────
  getUsers: async (params = {}) => {
    const cleanParams = {};
    Object.keys(params).forEach((key) => {
      if (params[key] !== '' && params[key] !== undefined && params[key] !== null) {
        cleanParams[key] = params[key];
      }
    });
    const response = await api.get('/admin/users', { params: cleanParams });
    return response.data;
  },

  getUserById: async (id) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  updateUserStatus: async (id, isActive) => {
    const response = await api.patch(`/admin/users/${id}/status`, { isActive });
    return response.data;
  },

  updateUserRole: async (id, role) => {
    const response = await api.patch(`/admin/users/${id}/role`, { role });
    return response.data;
  },

  // ── Items ─────────────────────────────────────────────────────────────────
  getAdminItems: async (params = {}) => {
    const cleanParams = {};
    Object.keys(params).forEach((key) => {
      if (params[key] !== '' && params[key] !== undefined && params[key] !== null) {
        cleanParams[key] = params[key];
      }
    });
    const response = await api.get('/admin/items', { params: cleanParams });
    return response.data;
  },

  getAdminItemById: async (id) => {
    const response = await api.get(`/admin/items/${id}`);
    return response.data;
  },

  moderateItem: async (id, action, reason) => {
    const response = await api.patch(`/admin/items/${id}/moderate`, { action, reason });
    return response.data;
  },

  restoreItem: async (id) => {
    const response = await api.patch(`/admin/items/${id}/restore`);
    return response.data;
  },

  // ── Claims ────────────────────────────────────────────────────────────────
  getAdminClaims: async (params = {}) => {
    const cleanParams = {};
    Object.keys(params).forEach((key) => {
      if (params[key] !== '' && params[key] !== undefined && params[key] !== null) {
        cleanParams[key] = params[key];
      }
    });
    const response = await api.get('/admin/claims', { params: cleanParams });
    return response.data;
  },

  getAdminClaimById: async (id) => {
    const response = await api.get(`/admin/claims/${id}`);
    return response.data;
  },

  // ── Reports ───────────────────────────────────────────────────────────────
  getAdminReports: async (params = {}) => {
    const cleanParams = {};
    Object.keys(params).forEach((key) => {
      if (params[key] !== '' && params[key] !== undefined && params[key] !== null) {
        cleanParams[key] = params[key];
      }
    });
    const response = await api.get('/admin/reports', { params: cleanParams });
    return response.data;
  },

  getAdminReportById: async (id) => {
    const response = await api.get(`/admin/reports/${id}`);
    return response.data;
  },

  reviewReport: async (id, data) => {
    const response = await api.patch(`/admin/reports/${id}`, data);
    return response.data;
  },

  // ── Activity / Audit Log ──────────────────────────────────────────────────
  getAuditLog: async (params = {}) => {
    const cleanParams = {};
    Object.keys(params).forEach((key) => {
      if (params[key] !== '' && params[key] !== undefined && params[key] !== null) {
        cleanParams[key] = params[key];
      }
    });
    const response = await api.get('/admin/activity', { params: cleanParams });
    return response.data;
  },
};

export default adminService;
