const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const { ResourceRequest } = require('../../models/ResourceModels');
const { ResourceOffer } = require('../../models/ResourceModels');
const Notification = require('../../models/NotificationModel');
const { adminAuth, requirePermission, auditLog } = require('../../middleware/adminAuth');

// Apply admin authentication to all routes
router.use(adminAuth);

// @route   GET api/admin/dashboard/stats
// @desc    Get comprehensive dashboard statistics
// @access  Private (Admin with view_analytics permission)
router.get('/stats', 
  requirePermission('view_analytics'),
  auditLog('view_dashboard_stats'),
  async (req, res) => {
    try {
      // Get date range from query (default to last 30 days)
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      // User statistics
      const totalUsers = await User.countDocuments();
      const verifiedUsers = await User.countDocuments({ isVerified: true });
      const pendingUsers = await User.countDocuments({ 
        isVerified: false, 
        isRejected: { $ne: true },
        role: { $ne: 'victim' }
      });
      const suspendedUsers = await User.countDocuments({ isSuspended: true });

      // User statistics by role
      const usersByRole = await User.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]);

      // New user registrations over time
      const newUsersOverTime = await User.aggregate([
        { 
          $match: { 
            createdAt: { $gte: start, $lte: end },
            isDeleted: { $ne: true }
          } 
        },
        {
          $group: {
            _id: { 
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]);

      // Request statistics
      const totalRequests = await ResourceRequest.countDocuments();
      const pendingRequests = await ResourceRequest.countDocuments({ status: 'pending' });
      const matchedRequests = await ResourceRequest.countDocuments({ status: 'matched' });
      const fulfilledRequests = await ResourceRequest.countDocuments({ status: 'fulfilled' });

      // Request statistics by type
      const requestsByType = await ResourceRequest.aggregate([
        { $group: { _id: '$requestType', count: { $sum: 1 } } }
      ]);

      // Request statistics by urgency
      const requestsByUrgency = await ResourceRequest.aggregate([
        { $group: { _id: '$urgency', count: { $sum: 1 } } }
      ]);

      // Offer statistics (if ResourceOffer model exists)
      let offerStats = {
        total: 0,
        pending: 0,
        matched: 0,
        expired: 0,
        byType: []
      };

      try {
        const totalOffers = await ResourceOffer.countDocuments();
        const pendingOffers = await ResourceOffer.countDocuments({ status: 'pending' });
        const matchedOffers = await ResourceOffer.countDocuments({ status: 'matched' });
        const expiredOffers = await ResourceOffer.countDocuments({ status: 'expired' });
        
        const offersByType = await ResourceOffer.aggregate([
          { $group: { _id: '$offerType', count: { $sum: 1 } } }
        ]);

        offerStats = {
          total: totalOffers,
          pending: pendingOffers,
          matched: matchedOffers,
          expired: expiredOffers,
          byType: offersByType
        };
      } catch (err) {
        console.log('ResourceOffer model not available or no data');
      }

      // Recent activity (last 7 days)
      const recentActivityStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const recentUsers = await User.countDocuments({ 
        createdAt: { $gte: recentActivityStart },
        isDeleted: { $ne: true }
      });
      
      const recentRequests = await ResourceRequest.countDocuments({ 
        createdAt: { $gte: recentActivityStart }
      });

      // System health metrics
      const systemHealth = {
        activeUsers: await User.countDocuments({ 
          isVerified: true,
          isSuspended: { $ne: true },
          isDeleted: { $ne: true }
        }),
        averageResponseTime: Math.random() * 100 + 50, // Mock data - implement actual monitoring
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      };

      res.json({
        users: {
          total: totalUsers,
          verified: verifiedUsers,
          pending: pendingUsers,
          suspended: suspendedUsers,
          byRole: usersByRole,
          newUsersOverTime,
          recent: recentUsers
        },
        requests: {
          total: totalRequests,
          pending: pendingRequests,
          matched: matchedRequests,
          fulfilled: fulfilledRequests,
          byType: requestsByType,
          byUrgency: requestsByUrgency,
          recent: recentRequests
        },
        offers: offerStats,
        systemHealth,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString()
        }
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/admin/dashboard/recent-activity
// @desc    Get recent system activity
// @access  Private (Admin with view_analytics permission)
router.get('/recent-activity', 
  requirePermission('view_analytics'),
  auditLog('view_recent_activity'),
  async (req, res) => {
    try {
      const { limit = 20 } = req.query;
      
      // Get recent users (last 24 hours)
      const recentUsers = await User.find({ 
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        isDeleted: { $ne: true }
      })
        .select('name email role createdAt isVerified')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit) / 2);

      // Get recent requests (last 24 hours)
      const recentRequests = await ResourceRequest.find({ 
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
        .populate('userId', 'name role')
        .select('title requestType urgency status createdAt userId')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit) / 2);

      // Combine and sort by timestamp
      const combinedActivity = [
        ...recentUsers.map(user => ({
          type: 'user_registration',
          data: user,
          timestamp: user.createdAt
        })),
        ...recentRequests.map(request => ({
          type: 'request_created',
          data: request,
          timestamp: request.createdAt
        }))
      ].sort((a, b) => b.timestamp - a.timestamp).slice(0, parseInt(limit));

      res.json(combinedActivity);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/admin/dashboard/analytics
// @desc    Get detailed analytics data
// @access  Private (Admin with view_analytics permission)
// DISABLED - Duplicate analytics route that returns wrong format
/*
router.get('/analytics', 
  requirePermission('view_analytics'),
  auditLog('view_detailed_analytics'),
  async (req, res) => {
    try {
      const { 
        metric = 'users', 
        timeframe = '30d',
        groupBy = 'day'
      } = req.query;

      // Calculate date range based on timeframe
      let startDate;
      const endDate = new Date();
      
      switch (timeframe) {
        case '7d':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }

      let analytics = {};

      // User analytics
      if (metric === 'users' || metric === 'all') {
        const userAnalytics = await User.aggregate([
          { 
            $match: { 
              createdAt: { $gte: startDate, $lte: endDate },
              isDeleted: { $ne: true }
            } 
          },
          {
            $group: {
              _id: groupBy === 'month' ? 
                { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } } :
                { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } },
              total: { $sum: 1 },
              verified: { $sum: { $cond: [{ $eq: ['$isVerified', true] }, 1, 0] } },
              byRole: { $push: '$role' }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        analytics.users = userAnalytics;
      }

      // Request analytics
      if (metric === 'requests' || metric === 'all') {
        const requestAnalytics = await ResourceRequest.aggregate([
          { 
            $match: { 
              createdAt: { $gte: startDate, $lte: endDate }
            } 
          },
          {
            $group: {
              _id: groupBy === 'month' ? 
                { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } } :
                { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } },
              total: { $sum: 1 },
              pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
              fulfilled: { $sum: { $cond: [{ $eq: ['$status', 'fulfilled'] }, 1, 0] } },
              byType: { $push: '$requestType' },
              byUrgency: { $push: '$urgency' }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        analytics.requests = requestAnalytics;
      }

      res.json({
        metric,
        timeframe,
        groupBy,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        data: analytics
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);
*/
// END DISABLED ROUTE

// @route   GET api/admin/dashboard/notifications
// @desc    Get admin notifications and alerts
// @access  Private (Admin)
router.get('/notifications', 
  auditLog('view_admin_notifications'),
  async (req, res) => {
    try {
      const notifications = [];

      // Check for users pending approval
      const pendingCount = await User.countDocuments({ 
        isVerified: false,
        isRejected: { $ne: true },
        role: { $ne: 'victim' }
      });

      if (pendingCount > 0) {
        notifications.push({
          type: 'warning',
          title: 'Users Pending Approval',
          message: `${pendingCount} users are waiting for approval`,
          count: pendingCount,
          link: '/admin/users?filter=pending'
        });
      }

      // Check for high urgency requests
      const urgentRequests = await ResourceRequest.countDocuments({ 
        urgency: 'high',
        status: 'pending'
      });

      if (urgentRequests > 0) {
        notifications.push({
          type: 'danger',
          title: 'Urgent Requests',
          message: `${urgentRequests} high priority requests need attention`,
          count: urgentRequests,
          link: '/admin/requests?urgency=high&status=pending'
        });
      }

      // Check for suspended users that might need review
      const suspendedUsers = await User.countDocuments({ 
        isSuspended: true,
        suspendedUntil: { $lt: new Date() }
      });

      if (suspendedUsers > 0) {
        notifications.push({
          type: 'info',
          title: 'Suspension Reviews',
          message: `${suspendedUsers} users have completed their suspension period`,
          count: suspendedUsers,
          link: '/admin/users?filter=suspended'
        });
      }

      res.json(notifications);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/admin/dashboard/export
// @desc    Export dashboard data as CSV
// @access  Private (Admin with view_analytics permission)
router.get('/export', 
  requirePermission('view_analytics'),
  auditLog('export_dashboard_data'),
  async (req, res) => {
    try {
      const { type = 'users', format = 'csv' } = req.query;

      let data = [];
      let filename = '';
      let headers = [];

      switch (type) {
        case 'users':
          data = await User.find({ isDeleted: { $ne: true } })
            .select('name email role isVerified createdAt location.address')
            .lean();
          filename = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
          headers = ['Name', 'Email', 'Role', 'Verified', 'Created At', 'Location'];
          break;

        case 'requests':
          data = await ResourceRequest.find()
            .populate('userId', 'name email')
            .select('title requestType urgency status createdAt userId')
            .lean();
          filename = `requests_export_${new Date().toISOString().split('T')[0]}.csv`;
          headers = ['Title', 'Type', 'Urgency', 'Status', 'Created At', 'User Name', 'User Email'];
          break;

        default:
          return res.status(400).json({ msg: 'Invalid export type' });
      }

      if (format === 'csv') {
        // Convert to CSV format
        let csvContent = headers.join(',') + '\n';
        
        data.forEach(item => {
          const row = [];
          switch (type) {
            case 'users':
              row.push(
                item.name,
                item.email,
                item.role,
                item.isVerified ? 'Yes' : 'No',
                item.createdAt.toISOString(),
                item.location?.address || ''
              );
              break;
            case 'requests':
              row.push(
                item.title,
                item.requestType,
                item.urgency,
                item.status,
                item.createdAt.toISOString(),
                item.userId?.name || '',
                item.userId?.email || ''
              );
              break;
          }
          csvContent += row.map(field => `"${field}"`).join(',') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csvContent);
      } else {
        // Return JSON format
        res.json({
          type,
          exportDate: new Date().toISOString(),
          count: data.length,
          data
        });
      }
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/admin/dashboard/analytics
// @desc    Get detailed analytics data
// @access  Private (Admin with view_analytics permission)
router.get('/analytics', 
  requirePermission('view_analytics'),
  auditLog('view_analytics'),
  async (req, res) => {
    try {
      const { timeRange = '7d' } = req.query;
      
      // Calculate date range
      let dateFrom = new Date();
      switch (timeRange) {
        case '1d':
          dateFrom.setDate(dateFrom.getDate() - 1);
          break;
        case '7d':
          dateFrom.setDate(dateFrom.getDate() - 7);
          break;
        case '30d':
          dateFrom.setDate(dateFrom.getDate() - 30);
          break;
        case '90d':
          dateFrom.setDate(dateFrom.getDate() - 90);
          break;
        default:
          dateFrom.setDate(dateFrom.getDate() - 7);
      }

      // Get basic user stats
      const totalUsers = await User.countDocuments({ isDeleted: { $ne: true } });
      const newUsersInPeriod = await User.countDocuments({
        createdAt: { $gte: dateFrom },
        isDeleted: { $ne: true }
      });

      // User stats by role
      const usersByRole = await User.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]);

      // Verification status
      const verificationStats = await User.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        {
          $group: {
            _id: null,
            verified: { $sum: { $cond: ['$isVerified', 1, 0] } },
            pending: { 
              $sum: { 
                $cond: [
                  { $and: [{ $eq: ['$isVerified', false] }, { $ne: ['$isRejected', true] }] },
                  1, 
                  0
                ] 
              } 
            },
            suspended: { 
              $sum: { 
                $cond: [
                  { $or: ['$isSuspended', '$isRejected'] }, 
                  1, 
                  0
                ] 
              } 
            }
          }
        }
      ]);

      // Activity trends - daily breakdown
      const activityTrends = [];
      const daysToShow = parseInt(timeRange.replace('d', '')) || 7;
      
      for (let i = daysToShow - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const newUsers = await User.countDocuments({
          createdAt: { $gte: date, $lt: nextDate },
          isDeleted: { $ne: true }
        });
        
        activityTrends.push({
          date: date.toISOString(),
          newUsers,
          newRequests: 0, // Placeholder for when Request model exists
          newOffers: 0    // Placeholder for when Offer model exists
        });
      }

      // Geographic distribution
      const geographicDistribution = await User.aggregate([
        { 
          $match: { 
            'location.address': { $exists: true, $ne: null, $ne: '' },
            isDeleted: { $ne: true }
          } 
        },
        { $group: { _id: '$location.address', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      // Get actual request/offer counts
      let totalRequests = 0;
      let totalOffers = 0;
      let matchedRequests = 0;

      try {
        totalRequests = await ResourceRequest.countDocuments();
        matchedRequests = await ResourceRequest.countDocuments({ status: 'matched' });
        totalOffers = await ResourceOffer.countDocuments();
      } catch (err) {
        console.log('ResourceRequest/Offer models not available, keeping at 0');
      }

      // Recent admin actions - get recent user registrations
      const recentActions = [];
      const recentUsers = await User.find({ isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(5);

      recentUsers.forEach(user => {
        const timeAgo = Math.floor((Date.now() - user.createdAt.getTime()) / 1000 / 60); // minutes ago
        recentActions.push({
          action: `New ${user.role} registered: ${user.name}`,
          time: timeAgo < 60 ? `${timeAgo}m ago` : `${Math.floor(timeAgo/60)}h ago`,
          type: 'user'
        });
      });

      res.json({
        users: {
          total: totalUsers,
          growth: newUsersInPeriod
        },
        requests: { 
          active: totalRequests, 
          growth: 0  // Could calculate based on time range
        },
        offers: { 
          active: totalOffers, 
          growth: 0  // Could calculate based on time range
        },
        matches: { 
          total: matchedRequests, 
          growth: 0  // Could calculate based on time range
        },
        usersByRole,
        verificationStatus: verificationStats[0] || { 
          verified: 0, 
          pending: 0,
          suspended: 0
        },
        activityTrends,
        geographicDistribution,
        recentActions
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
      res.status(500).json({ msg: 'Server error' });
    }
  }
);

module.exports = router;