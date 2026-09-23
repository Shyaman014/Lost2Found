import mongoose from 'mongoose';
import User from '../models/User.js';
import Item from '../models/Item.js';
import Claim from '../models/Claim.js';
import Match from '../models/Match.js';
import Conversation from '../models/Conversation.js';
import Report from '../models/Report.js';
import AuditLog from '../models/AuditLog.js';

/**
 * Safe percentage calculation
 */
const calcPercentChange = (current, previous) => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
};

/**
 * Get date format string for MongoDB dateToString based on granularity
 */
const getDateFormat = (granularity) => {
  switch (granularity) {
    case 'month':
      return '%Y-%m';
    case 'week':
      return '%Y-W%V';
    case 'day':
    default:
      return '%Y-%m-%d';
  }
};

/**
 * 1. Overview KPI Metrics
 */
export const getOverviewKPIs = async (startDate, endDate, prevStartDate, prevEndDate) => {
  // Concurrent execution of independent count queries
  const [
    totalUsers,
    activeUsers,
    inactiveUsers,
    newUsersCurrent,
    newUsersPrev,

    totalItems,
    activeItems,
    resolvedItems,
    claimedItems,
    returnedItems,
    lostItems,
    foundItems,
    newItemsCurrent,
    newItemsPrev,

    totalClaims,
    pendingClaims,
    approvedClaims,
    rejectedClaims,
    cancelledClaims,
    newClaimsCurrent,
    newClaimsPrev,

    matchStats,

    totalConversations,
    activeConversations,
    closedConversations,

    totalReports,
    pendingReports,
    reviewedReports,
    dismissedReports,
    actionTakenReports,
  ] = await Promise.all([
    // Users
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isActive: false }),
    User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
    User.countDocuments({ createdAt: { $gte: prevStartDate, $lte: prevEndDate } }),

    // Items
    Item.countDocuments(),
    Item.countDocuments({ status: 'active', moderationStatus: { $ne: 'removed' } }),
    Item.countDocuments({ status: 'resolved' }),
    Item.countDocuments({ status: 'claimed' }),
    Item.countDocuments({ status: 'returned' }),
    Item.countDocuments({ type: 'lost' }),
    Item.countDocuments({ type: 'found' }),
    Item.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
    Item.countDocuments({ createdAt: { $gte: prevStartDate, $lte: prevEndDate } }),

    // Claims
    Claim.countDocuments(),
    Claim.countDocuments({ status: 'pending' }),
    Claim.countDocuments({ status: 'approved' }),
    Claim.countDocuments({ status: 'rejected' }),
    Claim.countDocuments({ status: 'cancelled' }),
    Claim.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
    Claim.countDocuments({ createdAt: { $gte: prevStartDate, $lte: prevEndDate } }),

    // Matches
    Match.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          potential: {
            $sum: { $cond: [{ $eq: ['$status', 'potential'] }, 1, 0] },
          },
          dismissed: {
            $sum: { $cond: [{ $eq: ['$status', 'dismissed'] }, 1, 0] },
          },
          avgScore: { $avg: '$score' },
        },
      },
    ]),

    // Conversations
    Conversation.countDocuments(),
    Conversation.countDocuments({ status: 'active' }),
    Conversation.countDocuments({ status: 'closed' }),

    // Reports
    Report.countDocuments(),
    Report.countDocuments({ status: 'pending' }),
    Report.countDocuments({ status: 'reviewed' }),
    Report.countDocuments({ status: 'dismissed' }),
    Report.countDocuments({ status: 'action_taken' }),
  ]);

  // Derived calculations
  const totalEligibleItems = resolvedItems + returnedItems + claimedItems + activeItems;
  const resolutionRate =
    totalEligibleItems > 0
      ? Math.round(((resolvedItems + returnedItems) / totalEligibleItems) * 1000) / 10
      : 0;

  const reviewedClaims = approvedClaims + rejectedClaims;
  const claimApprovalRate =
    reviewedClaims > 0 ? Math.round((approvedClaims / reviewedClaims) * 1000) / 10 : 0;

  const matchData = matchStats[0] || {
    total: 0,
    potential: 0,
    dismissed: 0,
    avgScore: 0,
  };

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      newInPeriod: newUsersCurrent,
      previousNewInPeriod: newUsersPrev,
      changePercent: calcPercentChange(newUsersCurrent, newUsersPrev),
    },
    items: {
      total: totalItems,
      active: activeItems,
      resolved: resolvedItems,
      claimed: claimedItems,
      returned: returnedItems,
      lost: lostItems,
      found: foundItems,
      newInPeriod: newItemsCurrent,
      previousNewInPeriod: newItemsPrev,
      changePercent: calcPercentChange(newItemsCurrent, newItemsPrev),
      resolutionRate,
    },
    claims: {
      total: totalClaims,
      pending: pendingClaims,
      approved: approvedClaims,
      rejected: rejectedClaims,
      cancelled: cancelledClaims,
      newInPeriod: newClaimsCurrent,
      previousNewInPeriod: newClaimsPrev,
      changePercent: calcPercentChange(newClaimsCurrent, newClaimsPrev),
      approvalRate: claimApprovalRate,
    },
    matches: {
      total: matchData.total,
      potential: matchData.potential,
      dismissed: matchData.dismissed,
      averageScore: Math.round((matchData.avgScore || 0) * 10) / 10,
    },
    communication: {
      totalConversations,
      activeConversations,
      closedConversations,
    },
    reports: {
      total: totalReports,
      pending: pendingReports,
      reviewed: reviewedReports,
      dismissed: dismissedReports,
      actionTaken: actionTakenReports,
    },
  };
};

/**
 * 2. Lost vs Found Breakdown
 */
export const getLostVsFound = async (startDate, endDate) => {
  const result = await Item.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
      },
    },
  ]);

  let lost = 0;
  let found = 0;
  result.forEach((item) => {
    if (item._id === 'lost') lost = item.count;
    if (item._id === 'found') found = item.count;
  });

  return {
    lost,
    found,
    total: lost + found,
  };
};

/**
 * 3. Item Reporting Trend Time-series
 */
export const getItemReportingTrend = async (startDate, endDate, granularity = 'day') => {
  const dateFormat = getDateFormat(granularity);

  const rawTrend = await Item.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          type: '$type',
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { '_id.date': 1 },
    },
  ]);

  // Pivot into { date, lost, found, total }
  const map = new Map();
  rawTrend.forEach((row) => {
    const d = row._id.date;
    if (!map.has(d)) {
      map.set(d, { date: d, lost: 0, found: 0, total: 0 });
    }
    const entry = map.get(d);
    if (row._id.type === 'lost') {
      entry.lost += row.count;
    } else if (row._id.type === 'found') {
      entry.found += row.count;
    }
    entry.total += row.count;
  });

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * 4. Category Analytics
 */
export const getCategoryAnalytics = async (startDate, endDate, limit = 10) => {
  const categories = await Item.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $limit: limit,
    },
  ]);

  return categories.map((cat) => ({
    category: cat._id || 'other',
    count: cat.count,
  }));
};

/**
 * 5. Top Reported Locations
 */
export const getLocationAnalytics = async (startDate, endDate, limit = 8) => {
  const locations = await Item.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $project: {
        trimmedLocation: { $trim: { input: '$location' } },
      },
    },
    {
      $group: {
        _id: '$trimmedLocation',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $limit: limit,
    },
  ]);

  return locations.map((loc) => ({
    location: loc._id || 'Unknown',
    count: loc.count,
  }));
};

/**
 * 6. Claim Analytics & Trend
 */
export const getClaimAnalytics = async (startDate, endDate, granularity = 'day') => {
  const dateFormat = getDateFormat(granularity);

  const [statusAgg, trendAgg] = await Promise.all([
    // Status breakdown in period
    Claim.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),

    // Claims over time
    Claim.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]),
  ]);

  const statusMap = {
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
  };

  statusAgg.forEach((item) => {
    if (statusMap[item._id] !== undefined) {
      statusMap[item._id] = item.count;
    }
  });

  const totalPeriodClaims = Object.values(statusMap).reduce((a, b) => a + b, 0);
  const reviewedPeriodClaims = statusMap.approved + statusMap.rejected;
  const periodApprovalRate =
    reviewedPeriodClaims > 0
      ? Math.round((statusMap.approved / reviewedPeriodClaims) * 1000) / 10
      : 0;

  return {
    statusBreakdown: [
      { status: 'pending', count: statusMap.pending },
      { status: 'approved', count: statusMap.approved },
      { status: 'rejected', count: statusMap.rejected },
      { status: 'cancelled', count: statusMap.cancelled },
    ],
    total: totalPeriodClaims,
    approvalRate: periodApprovalRate,
    trend: trendAgg.map((item) => ({
      date: item._id,
      claims: item.count,
    })),
  };
};

/**
 * 7. AI Match Analytics & Score Distribution
 */
export const getAIMatchAnalytics = async () => {
  const [summaryAgg, distributionAgg] = await Promise.all([
    Match.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          potential: {
            $sum: { $cond: [{ $eq: ['$status', 'potential'] }, 1, 0] },
          },
          dismissed: {
            $sum: { $cond: [{ $eq: ['$status', 'dismissed'] }, 1, 0] },
          },
          averageScore: { $avg: '$score' },
        },
      },
    ]),
    Match.aggregate([
      {
        $bucket: {
          groupBy: '$score',
          boundaries: [0, 21, 41, 61, 81, 101],
          default: 'other',
          output: {
            count: { $sum: 1 },
          },
        },
      },
    ]),
  ]);

  const summary = summaryAgg[0] || {
    total: 0,
    potential: 0,
    dismissed: 0,
    averageScore: 0,
  };

  const scoreBuckets = [
    { range: '0–20', count: 0 },
    { range: '21–40', count: 0 },
    { range: '41–60', count: 0 },
    { range: '61–80', count: 0 },
    { range: '81–100', count: 0 },
  ];

  distributionAgg.forEach((b) => {
    if (b._id === 0) scoreBuckets[0].count = b.count;
    else if (b._id === 21) scoreBuckets[1].count = b.count;
    else if (b._id === 41) scoreBuckets[2].count = b.count;
    else if (b._id === 61) scoreBuckets[3].count = b.count;
    else if (b._id === 81) scoreBuckets[4].count = b.count;
  });

  return {
    summary: {
      total: summary.total,
      potential: summary.potential,
      dismissed: summary.dismissed,
      averageScore: Math.round((summary.averageScore || 0) * 10) / 10,
    },
    scoreDistribution: scoreBuckets,
  };
};

/**
 * 8. User Growth & User Activity
 */
export const getUserGrowthAndActivity = async (startDate, endDate, granularity = 'day') => {
  const dateFormat = getDateFormat(granularity);

  const [growthAgg, reportingUsers, claimingUsers, conversationParticipants] =
    await Promise.all([
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
            newUsers: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]),

      // Distinct users who reported items in period
      Item.distinct('reportedBy', {
        createdAt: { $gte: startDate, $lte: endDate },
      }),

      // Distinct users who submitted claims in period
      Claim.distinct('claimant', {
        createdAt: { $gte: startDate, $lte: endDate },
      }),

      // Distinct users in active conversations
      Conversation.distinct('participants', {
        status: 'active',
      }),
    ]);

  return {
    growth: growthAgg.map((g) => ({
      date: g._id,
      newUsers: g.newUsers,
    })),
    activity: {
      usersWhoReportedItems: reportingUsers.length,
      usersWhoSubmittedClaims: claimingUsers.length,
      usersInActiveConversations: conversationParticipants.length,
    },
  };
};

/**
 * 9. Moderation Analytics
 */
export const getModerationAnalytics = async (startDate, endDate) => {
  const [reportCounts, auditActions] = await Promise.all([
    Report.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),

    AuditLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const reportMap = {
    pending: 0,
    reviewed: 0,
    dismissed: 0,
    action_taken: 0,
  };
  reportCounts.forEach((r) => {
    if (reportMap[r._id] !== undefined) reportMap[r._id] = r.count;
  });

  const auditMap = {};
  auditActions.forEach((a) => {
    auditMap[a._id] = a.count;
  });

  return {
    reports: {
      pending: reportMap.pending,
      reviewed: reportMap.reviewed,
      dismissed: reportMap.dismissed,
      actionTaken: reportMap.action_taken,
      total: Object.values(reportMap).reduce((a, b) => a + b, 0),
    },
    actions: {
      itemsRemoved: auditMap['ITEM_REMOVED'] || 0,
      itemsRestored: auditMap['ITEM_RESTORED'] || 0,
      itemsFlagged: auditMap['ITEM_FLAGGED'] || 0,
      usersDeactivated: auditMap['USER_DEACTIVATED'] || 0,
      usersReactivated: auditMap['USER_REACTIVATED'] || 0,
      rolesChanged: auditMap['USER_ROLE_CHANGED'] || 0,
    },
  };
};

/**
 * 10. Recent AuditLog Activity
 */
export const getRecentActivity = async (limit = 10) => {
  return AuditLog.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('admin', 'name email role')
    .lean();
};
