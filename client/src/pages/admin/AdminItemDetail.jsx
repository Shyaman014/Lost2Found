import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import { ItemModerationBadge, ItemStatusBadge, ClaimStatusBadge } from '../../components/admin/Badges';
import ConfirmDialog from '../../components/admin/ConfirmDialog';

const AdminItemDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Moderate modal
  const [moderateModal, setModerateModal] = useState({ open: false, action: null });
  const [removalReason, setRemovalReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const fetchItem = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getAdminItemById(id);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load item details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItem();
  }, [id]);

  const handleModerate = async () => {
    try {
      setActionLoading(true);
      setActionError(null);
      await adminService.moderateItem(id, moderateModal.action, removalReason);
      setModerateModal({ open: false, action: null });
      setRemovalReason('');
      fetchItem();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      setActionLoading(true);
      setActionError(null);
      await adminService.restoreItem(id);
      fetchItem();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Restore failed.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 sm:p-8 animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-32" />
        <div className="h-10 bg-gray-200 rounded w-72" />
        <div className="h-64 bg-white rounded-xl border border-gray-100" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 sm:p-8 text-center py-16">
        <p className="text-red-600 font-medium mb-4">{error || 'Item not found'}</p>
        <Link to="/admin/items" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">
          ← Back to Items
        </Link>
      </div>
    );
  }

  const { item, claims = [], matches = [] } = data;

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to="/admin/items" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            ← Back to Items
          </Link>
          <div className="flex items-center gap-3 mt-2">
            <h1 className="text-2xl font-bold text-gray-900">{item.title}</h1>
            <ItemModerationBadge moderationStatus={item.moderationStatus} />
            <ItemStatusBadge status={item.status} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {item.moderationStatus === 'removed' ? (
            <button
              onClick={handleRestore}
              disabled={actionLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
            >
              Restore Item
            </button>
          ) : (
            <>
              {item.moderationStatus !== 'flagged' && (
                <button
                  onClick={() => setModerateModal({ open: true, action: 'flag' })}
                  className="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm font-medium hover:bg-amber-100 transition"
                >
                  Flag Item
                </button>
              )}
              <button
                onClick={() => setModerateModal({ open: true, action: 'remove' })}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
              >
                Remove Item
              </button>
            </>
          )}
        </div>
      </div>

      {actionError && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
          {actionError}
        </div>
      )}

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">Item Details</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400 block text-xs uppercase">Type</span>
                <span className="font-medium text-gray-800 capitalize">{item.type}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-xs uppercase">Category</span>
                <span className="font-medium text-gray-800 capitalize">{item.category}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-xs uppercase">Location</span>
                <span className="font-medium text-gray-800">{item.location}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-xs uppercase">Reported Date</span>
                <span className="font-medium text-gray-800">{new Date(item.date).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-xs uppercase">Contact Pref</span>
                <span className="font-medium text-gray-800">{item.contactPreference || 'in_app'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-xs uppercase">Created At</span>
                <span className="font-medium text-gray-800">{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div>
              <span className="text-gray-400 block text-xs uppercase mb-1">Description</span>
              <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
                {item.description}
              </p>
            </div>

            {item.moderationStatus === 'removed' && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-sm text-red-800">
                <span className="font-semibold block mb-1">Removal Details:</span>
                <p>Reason: {item.removalReason || 'Not specified'}</p>
                <p className="text-xs text-red-500 mt-1">
                  Removed by {item.removedBy?.name || 'Admin'} on{' '}
                  {item.removedAt ? new Date(item.removedAt).toLocaleString() : 'N/A'}
                </p>
              </div>
            )}
          </div>

          {/* Claims Table */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">
              Claims Filed ({claims.length})
            </h2>
            {claims.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-100 uppercase">
                      <th className="py-2">Claimant</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Date</th>
                      <th className="py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {claims.map((c) => (
                      <tr key={c._id}>
                        <td className="py-3 font-medium text-gray-800">{c.claimant?.name || 'User'}</td>
                        <td className="py-3"><ClaimStatusBadge status={c.status} /></td>
                        <td className="py-3 text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                        <td className="py-3">
                          <Link to={`/admin/claims/${c._id}`} className="text-indigo-600 hover:underline">
                            View Claim
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-4 text-center">No claims submitted for this item.</p>
            )}
          </div>
        </div>

        {/* Right Column: Image & Reporter */}
        <div className="space-y-6">
          {/* Item Image */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-3">
            <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-2">Item Image</h2>
            {item.image?.url ? (
              <img
                src={item.image.url}
                alt={item.title}
                className="w-full h-56 object-cover rounded-lg border border-gray-200"
              />
            ) : (
              <div className="w-full h-40 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                No image uploaded
              </div>
            )}
          </div>

          {/* Reporter Details */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-3">
            <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-2">Reported By</h2>
            {item.reportedBy ? (
              <div className="space-y-2 text-sm">
                <p className="font-medium text-gray-900">{item.reportedBy.name}</p>
                <p className="text-gray-500 text-xs">{item.reportedBy.email}</p>
                {item.reportedBy.studentId && (
                  <p className="text-gray-500 text-xs">ID: {item.reportedBy.studentId}</p>
                )}
                <div className="pt-2">
                  <Link
                    to={`/admin/users/${item.reportedBy._id}`}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    View User Profile →
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Reporter information unavailable</p>
            )}
          </div>

          {/* Potential Matches */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-3">
            <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-2">
              Potential Matches ({matches.length})
            </h2>
            {matches.length > 0 ? (
              <ul className="divide-y divide-gray-50 text-xs">
                {matches.map((m) => (
                  <li key={m._id} className="py-2 flex items-center justify-between">
                    <span className="text-gray-700">Score: <strong className="text-indigo-600">{m.score}%</strong></span>
                    <span className="text-gray-400 capitalize">{m.status}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400 py-2">No AI matches found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Moderation Modal */}
      {moderateModal.open && (
        <ConfirmDialog
          isOpen={moderateModal.open}
          title={moderateModal.action === 'remove' ? 'Remove Item' : 'Flag Item'}
          message={`Are you sure you want to ${moderateModal.action} this item? Removed items will no longer be visible to students.`}
          confirmLabel={moderateModal.action === 'remove' ? 'Remove' : 'Flag'}
          confirmVariant={moderateModal.action === 'remove' ? 'danger' : 'primary'}
          onCancel={() => setModerateModal({ open: false, action: null })}
          onConfirm={handleModerate}
        >
          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Reason for {moderateModal.action}:
            </label>
            <textarea
              value={removalReason}
              onChange={(e) => setRemovalReason(e.target.value)}
              placeholder="Provide a clear reason..."
              className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
              rows={3}
              required
            />
          </div>
        </ConfirmDialog>
      )}
    </div>
  );
};

export default AdminItemDetail;
