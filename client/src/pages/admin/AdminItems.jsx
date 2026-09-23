import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import DataTable from '../../components/admin/DataTable';
import AdminPagination from '../../components/admin/AdminPagination';
import { ItemModerationBadge, ItemStatusBadge } from '../../components/admin/Badges';

const CATEGORIES = ['electronics','documents','wallet','keys','bags','clothing','books','stationery','jewelry','accessories','other'];

const AdminItems = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '', type: '', category: '', status: '', moderationStatus: '', sort: 'newest',
  });
  const [page, setPage] = useState(1);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getAdminItems({ ...filters, page, limit: 20 });
      setItems(res.data.items);
      setPagination(res.data.pagination);
    } catch {
      setError('Failed to load items. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleFilterChange = (key, val) => {
    setFilters((f) => ({ ...f, [key]: val }));
    setPage(1);
  };

  const columns = [
    {
      key: 'title',
      label: 'Item',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-800 text-sm">{row.title}</p>
          <p className="text-xs text-gray-400 capitalize">{row.type} · {row.category}</p>
        </div>
      ),
    },
    {
      key: 'reportedBy',
      label: 'Reporter',
      render: (row) => (
        <div>
          <p className="text-sm text-gray-700">{row.reportedBy?.name || '—'}</p>
          <p className="text-xs text-gray-400">{row.reportedBy?.email || ''}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <ItemStatusBadge status={row.status} />,
    },
    {
      key: 'moderationStatus',
      label: 'Moderation',
      render: (row) => <ItemModerationBadge moderationStatus={row.moderationStatus} />,
    },
    {
      key: 'location',
      label: 'Location',
      render: (row) => <span className="text-sm text-gray-500 truncate max-w-[120px] block">{row.location}</span>,
    },
    {
      key: 'createdAt',
      label: 'Reported',
      render: (row) => <span className="text-sm text-gray-400">{new Date(row.createdAt).toLocaleDateString()}</span>,
    },
  ];

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Items</h1>
        <p className="text-gray-500 text-sm mt-1">{pagination.total} total item{pagination.total !== 1 ? 's' : ''} (admin view includes removed)</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-5 shadow-sm flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search title, location…"
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="flex-1 min-w-[180px] px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <select value={filters.type} onChange={(e) => handleFilterChange('type', e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
          <option value="">All types</option>
          <option value="lost">Lost</option>
          <option value="found">Found</option>
        </select>
        <select value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>
        <select value={filters.moderationStatus} onChange={(e) => handleFilterChange('moderationStatus', e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
          <option value="">All moderation</option>
          <option value="active">Active</option>
          <option value="flagged">Flagged</option>
          <option value="removed">Removed</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">{error}</div>
      )}

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        emptyMessage="No items found matching your filters"
        onRowClick={(row) => navigate(`/admin/items/${row._id}`)}
      />

      <AdminPagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
    </div>
  );
};

export default AdminItems;
