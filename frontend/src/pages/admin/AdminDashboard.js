import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all dashboard data in parallel
      const [statsRes, notificationsRes, activityRes] = await Promise.all([
        axios.get('/admin/dashboard/stats'),
        axios.get('/admin/dashboard/notifications'),
        axios.get('/admin/dashboard/recent-activity?limit=10')
      ]);

      setStats(statsRes.data);
      setNotifications(notificationsRes.data);
      setRecentActivity(activityRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, subtext, trend, link }) => (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`inline-flex items-center justify-center p-3 ${color} rounded-md`}>
            {icon}
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">{value}</div>
              {trend && (
                <div className={`ml-2 flex items-baseline text-sm ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                  <svg className={`self-center flex-shrink-0 h-5 w-5 ${trend.positive ? 'text-green-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d={trend.positive ? 'M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z' : 'M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z'} clipRule="evenodd" />
                  </svg>
                  <span className="sr-only">{trend.positive ? 'Increased' : 'Decreased'} by</span>
                  {trend.value}
                </div>
              )}
            </dd>
            {subtext && <dd className="text-sm text-gray-500">{subtext}</dd>}
          </dl>
        </div>
        {link && (
          <div className="flex-shrink-0">
            <Link to={link} className="text-sm font-medium text-blue-600 hover:text-blue-500">
              View →
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  const NotificationItem = ({ notification }) => {
    const getNotificationColor = (type) => {
      switch (type) {
        case 'danger': return 'border-red-400 bg-red-50';
        case 'warning': return 'border-yellow-400 bg-yellow-50';
        case 'info': return 'border-blue-400 bg-blue-50';
        default: return 'border-gray-400 bg-gray-50';
      }
    };

    const getNotificationIcon = (type) => {
      switch (type) {
        case 'danger':
          return <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.598 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>;
        case 'warning':
          return <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>;
        case 'info':
          return <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>;
        default:
          return <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
          </svg>;
      }
    };

    return (
      <div className={`border-l-4 p-4 ${getNotificationColor(notification.type)}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            {getNotificationIcon(notification.type)}
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium">{notification.title}</h3>
            <div className="mt-1 text-sm">{notification.message}</div>
            {notification.link && (
              <div className="mt-2">
                <Link
                  to={notification.link}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Take Action →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ActivityItem = ({ activity }) => {
    const getActivityIcon = (type) => {
      switch (type) {
        case 'user_registration':
          return <div className="bg-green-500 h-8 w-8 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>;
        case 'request_created':
          return <div className="bg-blue-500 h-8 w-8 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>;
        default:
          return <div className="bg-gray-500 h-8 w-8 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>;
      }
    };

    const formatTime = (timestamp) => {
      const now = new Date();
      const time = new Date(timestamp);
      const diff = now - time;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) return `${days}d ago`;
      if (hours > 0) return `${hours}h ago`;
      if (minutes > 0) return `${minutes}m ago`;
      return 'Just now';
    };

    return (
      <div className="flex items-center space-x-4 py-3">
        {getActivityIcon(activity.type)}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900">
            {activity.type === 'user_registration' && (
              <>New {activity.data.role} registered: {activity.data.name}</>
            )}
            {activity.type === 'request_created' && (
              <>New request created: {activity.data.title}</>
            )}
          </div>
          <div className="text-sm text-gray-500">{formatTime(activity.timestamp)}</div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome to the RTD Platform administration panel
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={fetchDashboardData}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Key Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={stats.users.total.toLocaleString()}
            icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>}
            color="bg-blue-500"
            subtext={`${stats.users.verified} verified, ${stats.users.pending} pending`}
            link="/admin/users"
          />



          <StatCard
            title="Total Requests"
            value={stats.requests.total.toLocaleString()}
            icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>}
            color="bg-green-500"
            subtext={`${stats.requests.pending} pending, ${stats.requests.fulfilled} fulfilled`}
            link="/admin/requests"
          />

          <StatCard
            title="System Health"
            value={`${Math.round(stats.systemHealth.uptime / 3600)}h`}
            icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>}
            color="bg-purple-500"
            subtext={`${stats.systemHealth.activeUsers} active users`}
            link="/admin/analytics"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notifications */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Alerts & Notifications</h2>
            </div>
            <div className="p-6">
              {notifications.length > 0 ? (
                <div className="space-y-4">
                  {notifications.map((notification, index) => (
                    <NotificationItem key={index} notification={notification} />
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-6">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="mt-2 text-sm">No alerts at this time</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
              <Link
                to="/admin/activity"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                View all
              </Link>
            </div>
            <div className="p-6">
              {recentActivity.length > 0 ? (
                <div className="flow-root">
                  <ul className="-mb-8">
                    {recentActivity.map((activity, index) => (
                      <li key={index} className={index < recentActivity.length - 1 ? 'pb-4' : ''}>
                        <div className="relative">
                          {index < recentActivity.length - 1 && (
                            <span className="absolute top-8 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                          )}
                          <ActivityItem activity={activity} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-6">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="mt-2 text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/approvals"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Review Pending Users
          </Link>
          
          <Link
            to="/admin/content"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.598 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            View Urgent Requests
          </Link>
          
          <Link
            to="/admin/analytics"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            View Analytics
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
