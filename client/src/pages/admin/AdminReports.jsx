import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import { ReportStatusBadge } from '../../components/admin/Badges';
import AdminPagination from '../../components/admin/AdminPagination';

const reasonLabels = {
  spam: 'Spam',
  fake_report: 'Fake Report',
  inappropriate_content: 'Inappropriate Content',
  suspicious_activity: 'Suspicious Activity',
  duplicate: 'Duplicate',
  harassment: 'Harassment',
  other: 'Other',
};

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalReports: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReports = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      if (targetTypeFilter) params.targetType = targetTypeFilter;

      const res = await adminService.getAdminReports(params);
      setReports(res.data.reports);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(1);
  }, [statusFilter, targetTypeFilter]);

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports Moderation</h1>
          <p className="text-gray-500 text-sm mt-1">Review flagged items and suspicious users</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="dismissed">Dismissed</option>
            <option value="action_taken">Action Taken</option>
          </select>

          <select
            value={targetTypeFilter}
            onChange={(e) => setTargetTypeFilter(e.target.value)}
            className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Targets</option>
            <option value="item">Items</option>
            <option value="user">Users</option>
          </select>
        </div>
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
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : reports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/75 text-xs text-gray-400 uppercase border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Reporter</th>
                  <th className="px-6 py-3">Target</th>
                  <th className="px-6 py-3">Reason</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reports.map((report) => (
                  <tr key={report._id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{report.reporter?.name || 'Anonymous'}</p>
                      <p className="text-xs text-gray-400">{report.reporter?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize font-medium text-gray-800">{report.targetType}: </span>
                      <span className="text-xs text-gray-600">
                        {report.target ? (report.target.title || report.target.name) : 'Deleted'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-md">
                        {reasonLabels[report.reason] || report.reason}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <ReportStatusBadge status={report.status} />
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/admin/reports/${report._id}`}
                        className="text-indigo-600 hover:text-indigo-700 font-medium text-xs bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition"
                      >
                        Review Report →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400 text-sm">No reports found.</div>
        )}

        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-50">
            <AdminPagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(p) => fetchReports(p)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
