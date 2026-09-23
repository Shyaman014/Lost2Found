import api from './api';

const VALID_REASONS = [
  'spam',
  'fake_report',
  'inappropriate_content',
  'suspicious_activity',
  'duplicate',
  'harassment',
  'other',
];

const reportService = {
  VALID_REASONS,

  submitReport: async ({ targetType, targetId, reason, description }) => {
    const response = await api.post('/reports', { targetType, targetId, reason, description });
    return response.data;
  },
};

export default reportService;
