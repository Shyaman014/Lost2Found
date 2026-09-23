import {
  getOverviewKPIs,
  getLostVsFound,
  getItemReportingTrend,
  getCategoryAnalytics,
  getLocationAnalytics,
  getClaimAnalytics,
  getAIMatchAnalytics,
  getUserGrowthAndActivity,
  getModerationAnalytics,
  getRecentActivity,
} from '../services/analyticsService.js';

/**
 * Helper to validate YYYY-MM-DD string
 */
const isValidDateString = (str) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const d = new Date(str);
  return !isNaN(d.getTime());
};

/**
 * GET /api/admin/analytics/overview
 * Platform-wide descriptive analytics and KPIs
 */
export const getAnalyticsOverview = async (req, res) => {
  try {
    const { from, to, range } = req.query;

    let startDate;
    let endDate = new Date();
    let granularity = 'day';
    let preset = '30d';

    // 1. Custom Date Range
    if (from || to) {
      if (!from || !to) {
        return res.status(400).json({
          success: false,
          message: 'Both "from" and "to" parameters are required for custom date range (YYYY-MM-DD).',
        });
      }

      if (!isValidDateString(from) || !isValidDateString(to)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Dates must be in YYYY-MM-DD format.',
        });
      }

      startDate = new Date(from);
      startDate.setUTCHours(0, 0, 0, 0);

      endDate = new Date(to);
      endDate.setUTCHours(23, 59, 59, 999);

      if (startDate > endDate) {
        return res.status(400).json({
          success: false,
          message: '"from" date cannot be after "to" date.',
        });
      }

      // Check max range (5 years)
      const maxSpanMs = 5 * 365.25 * 24 * 60 * 60 * 1000;
      if (endDate.getTime() - startDate.getTime() > maxSpanMs) {
        return res.status(400).json({
          success: false,
          message: 'Date range cannot exceed 5 years.',
        });
      }

      const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      if (diffDays <= 31) {
        granularity = 'day';
      } else if (diffDays <= 120) {
        granularity = 'week';
      } else {
        granularity = 'month';
      }
      preset = 'custom';
    } else {
      // 2. Preset Range
      const selectedRange = (range || '30d').toLowerCase();
      preset = selectedRange;

      endDate = new Date();
      endDate.setUTCHours(23, 59, 59, 999);

      switch (selectedRange) {
        case '7d': {
          startDate = new Date();
          startDate.setDate(endDate.getDate() - 7);
          startDate.setUTCHours(0, 0, 0, 0);
          granularity = 'day';
          break;
        }
        case '30d': {
          startDate = new Date();
          startDate.setDate(endDate.getDate() - 30);
          startDate.setUTCHours(0, 0, 0, 0);
          granularity = 'day';
          break;
        }
        case '90d': {
          startDate = new Date();
          startDate.setDate(endDate.getDate() - 90);
          startDate.setUTCHours(0, 0, 0, 0);
          granularity = 'week';
          break;
        }
        case '1y': {
          startDate = new Date();
          startDate.setFullYear(endDate.getFullYear() - 1);
          startDate.setUTCHours(0, 0, 0, 0);
          granularity = 'month';
          break;
        }
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid range parameter. Valid options are: 7d, 30d, 90d, 1y',
          });
      }
    }

    // Calculate previous period for comparison
    const periodDuration = endDate.getTime() - startDate.getTime();
    const prevEndDate = new Date(startDate.getTime() - 1);
    const prevStartDate = new Date(prevEndDate.getTime() - periodDuration);

    // Concurrently fetch all analytics via MongoDB aggregations
    const [
      overview,
      lostVsFound,
      reportingTrend,
      categories,
      locations,
      claims,
      aiMatches,
      users,
      moderation,
      recentActivity,
    ] = await Promise.all([
      getOverviewKPIs(startDate, endDate, prevStartDate, prevEndDate),
      getLostVsFound(startDate, endDate),
      getItemReportingTrend(startDate, endDate, granularity),
      getCategoryAnalytics(startDate, endDate, 10),
      getLocationAnalytics(startDate, endDate, 8),
      getClaimAnalytics(startDate, endDate, granularity),
      getAIMatchAnalytics(),
      getUserGrowthAndActivity(startDate, endDate, granularity),
      getModerationAnalytics(startDate, endDate),
      getRecentActivity(10),
    ]);

    res.status(200).json({
      success: true,
      data: {
        filter: {
          from: startDate.toISOString(),
          to: endDate.toISOString(),
          granularity,
          preset,
        },
        overview,
        items: {
          lostVsFound,
          trend: reportingTrend,
          categories,
          locations,
        },
        claims,
        matches: aiMatches,
        users,
        moderation: {
          ...moderation,
          recentActivity,
        },
      },
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics data.',
    });
  }
};
