import express from 'express';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  getAdminItems,
  getAdminItemById,
  moderateItem,
  restoreItem,
  getAdminClaims,
  getAdminClaimById,
  getAdminReports,
  getAdminReportById,
  reviewReport,
  getAuditLog,
} from '../controllers/adminController.js';
import adminAnalyticsRoutes from './adminAnalyticsRoutes.js';

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect);
router.use(authorizeRoles('admin'));

// Analytics (Phase 11)
router.use('/analytics', adminAnalyticsRoutes);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// User Management
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/status', updateUserStatus);
router.patch('/users/:id/role', updateUserRole);

// Item Management
router.get('/items', getAdminItems);
router.get('/items/:id', getAdminItemById);
router.patch('/items/:id/moderate', moderateItem);
router.patch('/items/:id/restore', restoreItem);

// Claim Management (read-only — claim workflow stays with finder/claimant)
router.get('/claims', getAdminClaims);
router.get('/claims/:id', getAdminClaimById);

// Report Management
router.get('/reports', getAdminReports);
router.get('/reports/:id', getAdminReportById);
router.patch('/reports/:id', reviewReport);

// Audit Log
router.get('/activity', getAuditLog);

export default router;
