import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import { ClaimStatusBadge } from '../../components/admin/Badges';
import AdminPagination from '../../components/admin/AdminPagination';

const AdminClaims = () => {
  const [claims, setClaims] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalClaims: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClaims = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;

      const res = await adminService.getAdminClaims(params);
      setClaims(res.data.claims);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load claims.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims(1);
  }, [statusFilter]);

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Claims Management</h1>
          <p className="text-gray-500 text-sm mt-1">Review student ownership verification claims</p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
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
        ) : claims.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/75 text-xs text-gray-400 uppercase border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Item</th>
                  <th className="px-6 py-3">Claimant</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {claims.map((claim) => (
                  <tr key={claim._id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4">
                      {claim.item ? (
                        <div>
                          <p className="font-medium text-gray-900">{claim.item.title}</p>
                          <span className="text-xs text-gray-400 capitalize">{claim.item.type}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Item deleted</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900 font-medium">{claim.claimant?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">{claim.claimant?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <ClaimStatusBadge status={claim.status} />
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(claim.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/admin/claims/${claim._id}`}
                        className="text-indigo-600 hover:text-indigo-700 font-medium text-xs bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400 text-sm">No claims found.</div>
        )}

        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-50">
            <AdminPagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(p) => fetchClaims(p)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminClaims;
