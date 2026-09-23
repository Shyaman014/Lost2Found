import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import analyticsService from '../../services/analyticsService';
import DateRangeSelector from '../../components/admin/analytics/DateRangeSelector';
import AnalyticsKPICard from '../../components/admin/analytics/AnalyticsKPICard';
import TrendLineChart from '../../components/admin/analytics/TrendLineChart';
import DonutChart from '../../components/admin/analytics/DonutChart';
import HorizontalBarChart from '../../components/admin/analytics/HorizontalBarChart';
import ScoreDistributionChart from '../../components/admin/analytics/ScoreDistributionChart';

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
    USER_DEACTIVATED: { text: 'User deactivated', color: 'text-red-700 bg-red-50 border-red-200' },
    USER_REACTIVATED: { text: 'User reactivated', color: 'text-green-700 bg-green-50 border-green-200' },
    USER_ROLE_CHANGED: { text: 'Role changed', color: 'text-purple-700 bg-purple-50 border-purple-200' },
    ITEM_REMOVED: { text: 'Item removed', color: 'text-red-700 bg-red-50 border-red-200' },
    ITEM_RESTORED: { text: 'Item restored', color: 'text-green-700 bg-green-50 border-green-200' },
    ITEM_FLAGGED: { text: 'Item flagged', color: 'text-amber-700 bg-amber-50 border-amber-200' },
    REPORT_REVIEWED: { text: 'Report reviewed', color: 'text-blue-700 bg-blue-50 border-blue-200' },
    REPORT_DISMISSED: { text: 'Report dismissed', color: 'text-gray-700 bg-gray-100 border-gray-200' },
    REPORT_ACTION_TAKEN: { text: 'Action taken on report', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
    CLAIM_REVIEWED: { text: 'Claim reviewed', color: 'text-sky-700 bg-sky-50 border-sky-200' },
  };
  return map[action] || { text: action, color: 'text-gray-700 bg-gray-100 border-gray-200' };
};

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rangeFilter, setRangeFilter] = useState({ range: '30d' });

  const fetchAnalytics = async (filterParams) => {
    try {
      setLoading(true);
      setError(null);
      const res = await analyticsService.getAnalyticsOverview(filterParams);
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Unable to load analytics. Please verify server connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(rangeFilter);
  }, [rangeFilter]);

  const handleRangeChange = (newParams) => {
    setRangeFilter(newParams);
  };

  if (error && !data) {
    return (
      <div className="p-6 sm:p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Unable to Load Analytics</h2>
        <p className="text-gray-500 text-sm max-w-sm text-center mb-6">{error}</p>
        <button
          onClick={() => fetchAnalytics(rangeFilter)}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition shadow-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  const overview = data?.overview;
  const items = data?.items;
  const claims = data?.claims;
  const matches = data?.matches;
  const users = data?.users;
  const moderation = data?.moderation;
  const filter = data?.filter;

  const lostVsFoundDonut = items
    ? [
        { label: 'Lost Items', value: items.lostVsFound?.lost || 0, color: '#f59e0b' },
        { label: 'Found Items', value: items.lostVsFound?.found || 0, color: '#6366f1' },
      ]
    : [];

  const claimStatusDonut = claims
    ? [
        { label: 'Pending', value: claims.statusBreakdown?.find((s) => s.status === 'pending')?.count || 0, color: '#f59e0b' },
        { label: 'Approved', value: claims.statusBreakdown?.find((s) => s.status === 'approved')?.count || 0, color: '#10b981' },
        { label: 'Rejected', value: claims.statusBreakdown?.find((s) => s.status === 'rejected')?.count || 0, color: '#ef4444' },
        { label: 'Cancelled', value: claims.statusBreakdown?.find((s) => s.status === 'cancelled')?.count || 0, color: '#94a3b8' },
      ]
    : [];

  const topCategories = items?.categories
    ? items.categories.map((c) => ({ label: c.category, count: c.count }))
    : [];

  const topLocations = items?.locations
    ? items.locations.map((l) => ({ label: l.location, count: l.count }))
    : [];

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Analytics & Insights
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Real-time platform metrics, reporting trends, and moderation health
            {filter && (
              <span className="ml-2 font-mono text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md">
                {new Date(filter.from).toLocaleDateString()} – {new Date(filter.to).toLocaleDateString()}
              </span>
            )}
          </p>
        </div>

        {/* Date Filter */}
        <DateRangeSelector
          currentPreset={filter?.preset || '30d'}
          onRangeChange={handleRangeChange}
          loading={loading}
        />
      </div>

      {loading && !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Overview KPI Cards Grid */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Platform Vital Metrics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <AnalyticsKPICard
                title="Total Users"
                value={overview?.users?.total}
                subtitle={`${overview?.users?.active || 0} active users`}
                changePercent={overview?.users?.changePercent}
                color="indigo"
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
              />

              <AnalyticsKPICard
                title="Items Reported"
                value={overview?.items?.newInPeriod}
                subtitle={`${overview?.items?.total || 0} total on platform`}
                changePercent={overview?.items?.changePercent}
                color="amber"
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
              />

              <AnalyticsKPICard
                title="Resolution Rate"
                value={`${overview?.items?.resolutionRate || 0}%`}
                subtitle={`${overview?.items?.resolved || 0} resolved / returned`}
                color="emerald"
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />

              <AnalyticsKPICard
                title="Claim Approval"
                value={`${overview?.claims?.approvalRate || 0}%`}
                subtitle={`${overview?.claims?.approved || 0} approved of reviewed`}
                color="sky"
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>}
              />
            </div>
          </div>

          {/* Section 1: Item Reporting Trend & Lost vs Found Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-gray-900 text-lg">Items Reported Over Time</h2>
                  <p className="text-gray-400 text-xs">Lost vs Found volume across the selected timeframe</p>
                </div>
              </div>
              <TrendLineChart
                data={items?.trend || []}
                series={[
                  { key: 'total', label: 'Total Items', color: '#6366f1' },
                  { key: 'lost', label: 'Lost', color: '#f59e0b' },
                  { key: 'found', label: 'Found', color: '#10b981' },
                ]}
                height={260}
              />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Lost vs Found Ratio</h2>
                <p className="text-gray-400 text-xs mb-4">Distribution of reports in this period</p>
              </div>
              <DonutChart
                data={lostVsFoundDonut}
                size={180}
                centerTitle="Reports"
                centerValue={items?.lostVsFound?.total || 0}
              />
              <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
                <span>Active Listings: <strong>{overview?.items?.active || 0}</strong></span>
                <span>Removed/Flagged: <strong>{moderation?.actions?.itemsRemoved || 0}</strong></span>
              </div>
            </div>
          </div>

          {/* Section 2: Top Categories & Top Locations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Top Reported Categories</h2>
                <p className="text-gray-400 text-xs">Most frequent item types reported</p>
              </div>
              <HorizontalBarChart
                data={topCategories}
                color="#6366f1"
                emptyMessage="No items recorded in this period."
              />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Top Reported Locations</h2>
                <p className="text-gray-400 text-xs">Campus spots with the highest incident reports</p>
              </div>
              <HorizontalBarChart
                data={topLocations}
                color="#06b6d4"
                emptyMessage="No locations recorded in this period."
              />
            </div>
          </div>

          {/* Section 3: Claims Analytics & Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-gray-900 text-lg">Claims Filed Over Time</h2>
                  <p className="text-gray-400 text-xs">Volume of ownership verification claims filed</p>
                </div>
                <Link
                  to="/admin/claims"
                  className="text-xs text-indigo-600 font-semibold hover:underline"
                >
                  Manage Claims →
                </Link>
              </div>
              <TrendLineChart
                data={claims?.trend || []}
                series={[{ key: 'claims', label: 'Claims', color: '#3b82f6' }]}
                height={220}
              />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Claim Status Breakdown</h2>
                <p className="text-gray-400 text-xs mb-4">Verification outcomes for this period</p>
              </div>
              <DonutChart
                data={claimStatusDonut}
                size={180}
                centerTitle="Claims"
                centerValue={claims?.total || 0}
              />
              <div className="pt-3 border-t border-gray-50 text-xs text-gray-400 text-center">
                Pending reviews: <strong>{overview?.claims?.pending || 0}</strong>
              </div>
            </div>
          </div>

          {/* Section 4: AI Matching Activity */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">AI Matching Activity</h2>
                <p className="text-gray-400 text-xs">Insights into stored automated similarity matches</p>
              </div>
              <span className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-semibold border border-purple-200/50">
                Vector Similarity Engine
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                <span className="text-xs text-purple-700 font-semibold uppercase">Total Generated</span>
                <p className="text-2xl font-black text-gray-900 mt-1">{matches?.summary?.total || 0}</p>
                <span className="text-[11px] text-gray-400">All-time pairs</span>
              </div>

              <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                <span className="text-xs text-purple-700 font-semibold uppercase">Potential Pending</span>
                <p className="text-2xl font-black text-gray-900 mt-1">{matches?.summary?.potential || 0}</p>
                <span className="text-[11px] text-gray-400">Awaiting user review</span>
              </div>

              <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                <span className="text-xs text-purple-700 font-semibold uppercase">Average Score</span>
                <p className="text-2xl font-black text-gray-900 mt-1">{matches?.summary?.averageScore || 0}%</p>
                <span className="text-[11px] text-gray-400">Mean similarity confidence</span>
              </div>

              <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                <span className="text-xs text-purple-700 font-semibold uppercase">Dismissed</span>
                <p className="text-2xl font-black text-gray-900 mt-1">{matches?.summary?.dismissed || 0}</p>
                <span className="text-[11px] text-gray-400">False positives marked</span>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Match Score Distribution
              </h3>
              <ScoreDistributionChart
                data={matches?.scoreDistribution || []}
                color="#8b5cf6"
              />
            </div>
          </div>

          {/* Section 5: User Growth & User Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-gray-900 text-lg">User Growth</h2>
                  <p className="text-gray-400 text-xs">New user registrations across the period</p>
                </div>
                <Link
                  to="/admin/users"
                  className="text-xs text-indigo-600 font-semibold hover:underline"
                >
                  Manage Users →
                </Link>
              </div>
              <TrendLineChart
                data={users?.growth || []}
                series={[{ key: 'newUsers', label: 'New Registrations', color: '#10b981' }]}
                height={220}
              />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Platform Engagement</h2>
                <p className="text-gray-400 text-xs">Distinct participants active in period</p>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                  <span className="text-xs text-gray-600 font-medium">Users Who Reported Items</span>
                  <span className="text-base font-bold text-gray-900 font-mono">
                    {users?.activity?.usersWhoReportedItems || 0}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                  <span className="text-xs text-gray-600 font-medium">Users Who Submitted Claims</span>
                  <span className="text-base font-bold text-gray-900 font-mono">
                    {users?.activity?.usersWhoSubmittedClaims || 0}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                  <span className="text-xs text-gray-600 font-medium">In Active Conversations</span>
                  <span className="text-base font-bold text-gray-900 font-mono">
                    {users?.activity?.usersInActiveConversations || 0}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-50 text-[11px] text-gray-400 text-center">
                Total registered: <strong>{overview?.users?.total || 0}</strong>
              </div>
            </div>
          </div>

          {/* Section 6: Moderation Overview & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Moderation summary */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900 text-lg">Moderation Health</h2>
                  <p className="text-gray-400 text-xs">Reports and enforcement actions</p>
                </div>
                <Link to="/admin/reports" className="text-xs text-indigo-600 font-semibold hover:underline">
                  Reports →
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-red-50/70 border border-red-100 rounded-xl">
                  <span className="text-red-700 block font-semibold">Pending Reports</span>
                  <span className="text-xl font-extrabold text-red-900 font-mono mt-1 block">
                    {moderation?.reports?.pending || 0}
                  </span>
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
                  <span className="text-blue-700 block font-semibold">Reviewed Reports</span>
                  <span className="text-xl font-extrabold text-blue-900 font-mono mt-1 block">
                    {moderation?.reports?.reviewed || 0}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <span className="text-gray-700 block font-semibold">Items Removed</span>
                  <span className="text-xl font-extrabold text-gray-900 font-mono mt-1 block">
                    {moderation?.actions?.itemsRemoved || 0}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <span className="text-gray-700 block font-semibold">Deactivated Users</span>
                  <span className="text-xl font-extrabold text-gray-900 font-mono mt-1 block">
                    {moderation?.actions?.usersDeactivated || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Audit Log */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                <h2 className="font-bold text-gray-900 text-lg">Recent Administrative Activity</h2>
                <Link to="/admin/activity" className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold">
                  View Full Audit Log →
                </Link>
              </div>

              {moderation?.recentActivity && moderation.recentActivity.length > 0 ? (
                <ul className="divide-y divide-gray-50 flex-1">
                  {moderation.recentActivity.slice(0, 5).map((log) => {
                    const { text, color } = actionLabel(log.action);
                    return (
                      <li key={log._id} className="flex items-start gap-4 px-6 py-3.5 hover:bg-gray-50/50 transition">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${color} whitespace-nowrap mt-0.5`}>
                          {text}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-800 truncate">
                            <span className="font-semibold">{log.admin?.name || 'Admin'}</span>
                            {' · '}
                            <span className="text-gray-500 capitalize">{log.targetType}</span>
                            {log.metadata?.title || log.metadata?.name ? (
                              <span className="font-medium text-gray-700"> — "{log.metadata.title || log.metadata.name}"</span>
                            ) : null}
                          </p>
                          {log.metadata?.reason && (
                            <p className="text-[11px] text-gray-400 truncate">Reason: {log.metadata.reason}</p>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-400 whitespace-nowrap">{formatRelative(log.createdAt)}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="py-12 text-center text-gray-400 text-xs">No recent admin actions recorded.</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
