import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import AdminPagination from '../../components/admin/AdminPagination';

const actionLabels = {
  USER_DEACTIVATED: { text: 'User Deactivated', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  USER_REACTIVATED: { text: 'User Reactivated', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  USER_ROLE_CHANGED: { text: 'Role Changed', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  ITEM_REMOVED: { text: 'Item Removed', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  ITEM_RESTORED: { text: 'Item Restored', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  ITEM_FLAGGED: { text: 'Item Flagged', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  REPORT_REVIEWED: { text: 'Report Reviewed', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  REPORT_DISMISSED: { text: 'Report Dismissed', color: 'text-gray-700', bg: 'bg-gray-100 border-gray-200' },
  REPORT_ACTION_TAKEN: { text: 'Action Taken', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
  CLAIM_REVIEWED: { text: 'Claim Reviewed', color: 'text-sky-700', bg: 'bg-sky-50 border-sky-200' },
  ADMIN_ACTION: { text: 'Admin Action', color: 'text-gray-700', bg: 'bg-gray-100 border-gray-200' },
};

const AdminActivity = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, totalPages: 1, totalLogs: 0 });
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = { page, limit: 15 };
      if (actionFilter) params.action = actionFilter;

      const res = await adminService.getAuditLog(params);
      setLogs(res.data.logs);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load activity logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [actionFilter]);

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit & Moderation Logs</h1>
          <p className="text-gray-500 text-sm mt-1">Immutable record of administrator actions on the platform</p>
        </div>

        {/* Filter */}
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Actions</option>
          {Object.keys(actionLabels).map((key) => (
            <option key={key} value={key}>
              {actionLabels[key].text}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/75 text-xs text-gray-400 uppercase border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Admin</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Target</th>
                  <th className="px-6 py-3">Details / Snapshot</th>
                  <th className="px-6 py-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => {
                  const cfg = actionLabels[log.action] || { text: log.action, color: 'text-gray-700', bg: 'bg-gray-100 border-gray-200' };
                  return (
                    <tr key={log._id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {log.admin?.name || 'Admin'}
                        <span className="block text-xs text-gray-400">{log.admin?.email}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-md border ${cfg.bg} ${cfg.color}`}>
                          {cfg.text}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="capitalize font-medium text-gray-800">{log.targetType}</span>
                        <span className="block text-xs text-gray-400 font-mono">#{String(log.targetId).slice(-6)}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600 max-w-xs truncate">
                        {log.metadata ? (
                          <span>
                            {log.metadata.title && <strong>"{log.metadata.title}" </strong>}
                            {log.metadata.name && <strong>"{log.metadata.name}" </strong>}
                            {log.metadata.reason && <span>(Reason: {log.metadata.reason})</span>}
                            {log.metadata.role && <span>(New Role: {log.metadata.role})</span>}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-xs text-gray-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400 text-sm">No activity recorded yet.</div>
        )}

        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-50">
            <AdminPagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(p) => fetchLogs(p)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminActivity;
