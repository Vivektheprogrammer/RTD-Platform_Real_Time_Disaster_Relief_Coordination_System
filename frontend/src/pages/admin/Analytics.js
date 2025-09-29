import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // Use the same simple pattern as AdminDashboard - the AdminLayout already sets up the axios header
      const res = await axios.get(`/admin/dashboard/analytics?timeRange=${timeRange}`);
      setAnalyticsData(res.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      toast.error('Failed to fetch analytics data');
      // Set default data structure on error
      setAnalyticsData({
        users: { total: 0, growth: 0 },
        requests: { active: 0, growth: 0 },
        offers: { active: 0, growth: 0 },
        matches: { total: 0, growth: 0 },
        usersByRole: [],
        verificationStatus: { verified: 0, pending: 0, suspended: 0 },
        activityTrends: [],
        geographicDistribution: [],
        recentActions: []
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, change, trend, icon, color = "blue" }) => {
    const colorClasses = {
      blue: "bg-blue-100 text-blue-600",
      green: "bg-green-100 text-green-600",
      yellow: "bg-yellow-100 text-yellow-600",
      red: "bg-red-100 text-red-600",
      purple: "bg-purple-100 text-purple-600"
    };

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {change !== undefined && (
              <div className={`flex items-center mt-2 text-sm ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                {trend === 'up' && <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>}
                {trend === 'down' && <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>}
                {Math.abs(change)}% from last period
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </div>
    );
  };

  const ChartCard = ({ title, children }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Analytics Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Detailed insights and trends for your disaster relief platform
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={analyticsData?.users?.total || 0}
          change={analyticsData?.users?.growth}
          trend={analyticsData?.users?.growth > 0 ? 'up' : 'down'}
          color="blue"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>}
        />
        
        <StatCard
          title="Active Requests"
          value={analyticsData?.requests?.active || 0}
          change={analyticsData?.requests?.growth}
          trend={analyticsData?.requests?.growth > 0 ? 'up' : 'down'}
          color="red"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>}
        />
        
        <StatCard
          title="Available Offers"
          value={analyticsData?.offers?.active || 0}
          change={analyticsData?.offers?.growth}
          trend={analyticsData?.offers?.growth > 0 ? 'up' : 'down'}
          color="green"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>}
        />
        
        <StatCard
          title="Successful Matches"
          value={analyticsData?.matches?.total || 0}
          change={analyticsData?.matches?.growth}
          trend={analyticsData?.matches?.growth > 0 ? 'up' : 'down'}
          color="purple"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>}
        />
      </div>

      {/* User Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="User Distribution by Role">
          <div className="space-y-4">
            {analyticsData?.usersByRole?.map((item) => (
              <div key={item._id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full mr-3 ${
                    item._id === 'victim' ? 'bg-blue-500' :
                    item._id === 'ngo' ? 'bg-green-500' :
                    item._id === 'volunteer' ? 'bg-purple-500' :
                    item._id === 'government' ? 'bg-red-500' : 'bg-gray-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-700 capitalize">{item._id}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">{item.count}</span>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        item._id === 'victim' ? 'bg-blue-500' :
                        item._id === 'ngo' ? 'bg-green-500' :
                        item._id === 'volunteer' ? 'bg-purple-500' :
                        item._id === 'government' ? 'bg-red-500' : 'bg-gray-500'
                      }`}
                      style={{ width: `${(item.count / (analyticsData?.users?.total || 1)) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500 ml-2">
                    {Math.round((item.count / (analyticsData?.users?.total || 1)) * 100)}%
                  </span>
                </div>
              </div>
            )) || (
              <div className="text-center text-gray-500 py-8">
                <p>No user data available</p>
              </div>
            )}
          </div>
        </ChartCard>

        <ChartCard title="User Verification Status">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full mr-3 bg-green-500"></div>
                <span className="text-sm font-medium text-gray-700">Verified Users</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">{analyticsData?.verificationStatus?.verified || 0}</span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-green-500"
                    style={{ 
                      width: `${((analyticsData?.verificationStatus?.verified || 0) / (analyticsData?.users?.total || 1)) * 100}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm text-gray-500 ml-2">
                  {Math.round(((analyticsData?.verificationStatus?.verified || 0) / (analyticsData?.users?.total || 1)) * 100)}%
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full mr-3 bg-yellow-500"></div>
                <span className="text-sm font-medium text-gray-700">Pending Approval</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">{analyticsData?.verificationStatus?.pending || 0}</span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-yellow-500"
                    style={{ 
                      width: `${((analyticsData?.verificationStatus?.pending || 0) / (analyticsData?.users?.total || 1)) * 100}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm text-gray-500 ml-2">
                  {Math.round(((analyticsData?.verificationStatus?.pending || 0) / (analyticsData?.users?.total || 1)) * 100)}%
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full mr-3 bg-red-500"></div>
                <span className="text-sm font-medium text-gray-700">Suspended/Rejected</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">{analyticsData?.verificationStatus?.suspended || 0}</span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-red-500"
                    style={{ 
                      width: `${((analyticsData?.verificationStatus?.suspended || 0) / (analyticsData?.users?.total || 1)) * 100}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm text-gray-500 ml-2">
                  {Math.round(((analyticsData?.verificationStatus?.suspended || 0) / (analyticsData?.users?.total || 1)) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Activity Trends */}
      <ChartCard title="Platform Activity Trends">
        <div className="space-y-4">
          {analyticsData?.activityTrends?.length > 0 ? (
            analyticsData.activityTrends.map((day) => (
              <div key={day.date} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {new Date(day.date).toLocaleDateString()}
                </span>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <span className="text-xs text-blue-600 mr-2">Users: {day.newUsers}</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${(day.newUsers / Math.max(1, ...analyticsData.activityTrends.map(d => d.newUsers))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-green-600 mr-2">Requests: {day.newRequests}</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-green-500"
                        style={{ width: `${(day.newRequests / Math.max(1, ...analyticsData.activityTrends.map(d => d.newRequests))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-purple-600 mr-2">Offers: {day.newOffers}</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-purple-500"
                        style={{ width: `${(day.newOffers / Math.max(1, ...analyticsData.activityTrends.map(d => d.newOffers))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>No activity data available for the selected time range</p>
            </div>
          )}
        </div>
      </ChartCard>

      {/* Geographic Distribution */}
      {analyticsData?.geographicDistribution && analyticsData.geographicDistribution.length > 0 && (
        <ChartCard title="Geographic Distribution">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Top Locations by Users</h4>
              <div className="space-y-2">
                {analyticsData.geographicDistribution.slice(0, 5).map((location, index) => (
                  <div key={location._id || index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{location._id || 'Unknown'}</span>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-900 font-medium mr-2">{location.count}</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${(location.count / Math.max(1, analyticsData.geographicDistribution[0]?.count || 1)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ChartCard>
      )}

      {/* Recent Activity */}
      <ChartCard title="Recent Admin Actions">
        <div className="space-y-3">
          {analyticsData?.recentActions?.length > 0 ? (
            analyticsData.recentActions.map((action, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-3 ${
                    action.action === 'approve' ? 'bg-green-500' :
                    action.action === 'reject' ? 'bg-red-500' :
                    action.action === 'suspend' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {action.action?.charAt(0).toUpperCase() + (action.action?.slice(1) || '')}d user
                    </p>
                    <p className="text-xs text-gray-500">{action.targetUser}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">By {action.adminName || 'Unknown'}</p>
                  <p className="text-xs text-gray-400">
                    {action.timestamp ? new Date(action.timestamp).toLocaleString() : 'Unknown time'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>No recent admin actions</p>
            </div>
          )}
        </div>
      </ChartCard>
    </div>
  );
};

export default Analytics;
