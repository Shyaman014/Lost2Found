import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import StatCard from '../../components/admin/StatCard';

const formatRelative = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const actionLabel = (action) => {
  const map = {
    USER_DEACTIVATED: { text: 'User deactivated', color: 'text-red-600', bg: 'bg-red-50' },
    USER_REACTIVATED: { text: 'User reactivated', color: 'text-green-600', bg: 'bg-green-50' },
    USER_ROLE_CHANGED: { text: 'Role changed', color: 'text-purple-600', bg: 'bg-purple-50' },
    ITEM_REMOVED: { text: 'Item removed', color: 'text-red-600', bg: 'bg-red-50' },
    ITEM_RESTORED: { text: 'Item restored', color: 'text-green-600', bg: 'bg-green-50' },
    ITEM_FLAGGED: { text: 'Item flagged', color: 'text-amber-600', bg: 'bg-amber-50' },
    REPORT_REVIEWED: { text: 'Report reviewed', color: 'text-blue-600', bg: 'bg-blue-50' },
    REPORT_DISMISSED: { text: 'Report dismissed', color: 'text-gray-600', bg: 'bg-gray-100' },
    REPORT_ACTION_TAKEN: { text: 'Action taken on report', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  };
  return map[action] || { text: action, color: 'text-gray-600', bg: 'bg-gray-100' };
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminService.getDashboardStats();
        setStats(res.data);
      } catch (err) {
        setError('Failed to load dashboard statistics. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-6 sm:p-8">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse mb-2" />
          <div className="h-4 bg-gray-100 rounded w-72 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 h-28 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 sm:p-8 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-700 font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const { users, items, claims, conversations, matches, reports, recentActivity } = stats;

  return (
    <div className="p-6 sm:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Platform overview and recent activity</p>
      </div>

      {/* Users section */}
      <div className="mb-2">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Users</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Users"
          value={users.total}
          color="indigo"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard title="Active" value={users.active} color="green"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard title="Inactive" value={users.inactive} color="red"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
        />
        <StatCard title="Admins" value={users.admins} color="purple"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
        />
      </div>

      {/* Items & Claims */}
      <div className="mb-2">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Items & Claims</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Items" value={items.total} color="sky"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
        />
        <StatCard title="Lost / Found" value={`${items.lost} / ${items.found}`} color="amber"
          subtitle="lost vs found reports"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
        />
        <StatCard title="Removed Items" value={items.removed} color="red"
          subtitle={`${items.flagged} flagged`}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
        />
        <StatCard title="Claims" value={claims.total} color="indigo"
          subtitle={`${claims.pending} pending`}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
        />
      </div>

      {/* Reports & Matches */}
      <div className="mb-2">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Reports & AI</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        <StatCard title="Pending Reports" value={reports.pending} color="red"
          subtitle={`${reports.total} total`}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
        />
        <StatCard title="Active Conversations" value={conversations.active} color="green"
          subtitle={`${conversations.closed} closed`}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>}
        />
        <StatCard title="AI Matches" value={matches.total} color="purple"
          subtitle={`${matches.potential} pending`}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
        />
        <StatCard title="Claims Approved" value={claims.approved} color="green"
          subtitle={`${claims.rejected} rejected`}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-800">Recent Activity</h2>
          <Link to="/admin/activity" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition">
            View all →
          </Link>
        </div>
        {recentActivity && recentActivity.length > 0 ? (
          <ul className="divide-y divide-gray-50">
            {recentActivity.map((log) => {
              const { text, color, bg } = actionLabel(log.action);
              return (
                <li key={log._id} className="flex items-start gap-4 px-6 py-4">
                  <div className={`mt-0.5 px-2 py-1 rounded-md text-xs font-medium ${bg} ${color} whitespace-nowrap`}>
                    {text}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">
                      <span className="font-medium">{log.admin?.name || 'Admin'}</span>
                      {' · '}
                      <span className="text-gray-500 capitalize">{log.targetType}</span>
                      {log.metadata?.name || log.metadata?.title
                        ? ` — ${log.metadata.name || log.metadata.title}`
                        : ''}
                    </p>
                    {log.metadata?.reason && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">Reason: {log.metadata.reason}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{formatRelative(log.createdAt)}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="py-12 text-center text-gray-400 text-sm">No activity yet</div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
