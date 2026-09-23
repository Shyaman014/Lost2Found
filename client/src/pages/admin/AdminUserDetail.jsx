import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import { UserStatusBadge, RoleBadge } from '../../components/admin/Badges';

const AdminUserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Dialog state
  const [dialog, setDialog] = useState({ open: false, type: null });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await adminService.getUserById(id);
        setUser(res.data.user);
      } catch {
        setError('User not found or failed to load.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleStatusChange = async () => {
    setActionLoading(true);
    try {
      const res = await adminService.updateUserStatus(id, !user.isActive);
      setUser(res.data.user);
      showToast(`User ${res.data.user.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update user status', 'error');
    } finally {
      setActionLoading(false);
      setDialog({ open: false, type: null });
    }
  };

  const handleRoleChange = async (newRole) => {
    setActionLoading(true);
    try {
      const res = await adminService.updateUserRole(id, newRole);
      setUser(res.data.user);
      showToast('User role updated successfully');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update user role', 'error');
    } finally {
      setActionLoading(false);
      setDialog({ open: false, type: null });
    }
  };

  if (loading) {
    return (
      <div className="p-6 sm:p-8">
        <div className="h-6 bg-gray-200 rounded w-32 animate-pulse mb-6" />
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-5 bg-gray-100 rounded w-3/4" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 sm:p-8 flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-gray-500 mb-4">{error}</p>
        <button onClick={() => navigate('/admin/users')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">
          Back to Users
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-3xl">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Back */}
      <Link to="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 mb-6 transition">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Users
      </Link>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {/* Header */}
        <div className="flex items-start gap-4 p-6 border-b border-gray-50">
          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl flex-shrink-0">
            {user.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-400 text-sm">{user.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <RoleBadge role={user.role} />
              <UserStatusBadge isActive={user.isActive} />
              {user.isVerified && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700">
                  ✓ Verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">College</p>
            <p className="text-sm text-gray-700">{user.college || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Student ID</p>
            <p className="text-sm text-gray-700">{user.studentId || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Joined</p>
            <p className="text-sm text-gray-700">{new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Last Updated</p>
            <p className="text-sm text-gray-700">{new Date(user.updatedAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Activity counts */}
        <div className="px-6 pb-6 grid grid-cols-3 gap-4">
          {[
            { label: 'Items Posted', val: user._counts?.items ?? 0 },
            { label: 'Claims Made', val: user._counts?.claims ?? 0 },
            { label: 'Conversations', val: user._counts?.conversations ?? 0 },
          ].map(({ label, val }) => (
            <div key={label} className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-900">{val}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 px-6 pb-6 pt-2 border-t border-gray-50">
          <button
            id={`toggle-status-btn-${id}`}
            onClick={() => setDialog({ open: true, type: 'status' })}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              user.isActive
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-green-50 text-green-600 hover:bg-green-100'
            }`}
          >
            {user.isActive ? 'Deactivate User' : 'Activate User'}
          </button>
          <button
            id={`change-role-btn-${id}`}
            onClick={() => setDialog({ open: true, type: 'role' })}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 transition"
          >
            Change Role
          </button>
        </div>
      </div>

      {/* Status Dialog */}
      <ConfirmDialog
        isOpen={dialog.open && dialog.type === 'status'}
        title={user.isActive ? 'Deactivate this user?' : 'Activate this user?'}
        message={
          user.isActive
            ? `${user.name} (${user.email}) will be deactivated and will not be able to use the platform until reactivated.`
            : `${user.name} (${user.email}) will be able to use the platform again.`
        }
        confirmLabel={user.isActive ? 'Deactivate' : 'Activate'}
        confirmVariant={user.isActive ? 'danger' : 'primary'}
        onConfirm={handleStatusChange}
        onCancel={() => setDialog({ open: false, type: null })}
        loading={actionLoading}
      />

      {/* Role Dialog */}
      <ConfirmDialog
        isOpen={dialog.open && dialog.type === 'role'}
        title="Change user role"
        message={`Current role: ${user.role}. Select new role for ${user.name}.`}
        confirmLabel="Change Role"
        confirmVariant="warning"
        onConfirm={() => handleRoleChange(user.role === 'admin' ? 'student' : 'admin')}
        onCancel={() => setDialog({ open: false, type: null })}
        loading={actionLoading}
      >
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
          ⚠️ Changing to <strong>{user.role === 'admin' ? 'student' : 'admin'}</strong>.
          {user.role !== 'admin' && ' This grants full admin access to the platform.'}
        </div>
      </ConfirmDialog>
    </div>
  );
};

export default AdminUserDetail;
