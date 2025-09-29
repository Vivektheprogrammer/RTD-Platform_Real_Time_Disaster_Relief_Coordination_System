import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import axios from 'axios';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState('');
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);

  useEffect(() => {
    // For now, just set loading to false since we don't have a dashboard API endpoint
    // In the future, you can add specific API calls based on user role
    if (currentUser) {
      setLoading(false);
      // You can add role-specific data fetching here in the future
      // For example:
      // if (currentUser.role === 'victim') {
      //   fetchVictimData();
      // } else if (currentUser.role === 'ngo') {
      //   fetchNgoData();
      // }
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  // Redirect government users to dedicated dashboard route
  useEffect(() => {
    if (currentUser?.role === 'government') {
      navigate('/government/dashboard');
    }
  }, [currentUser, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-danger-50 border-l-4 border-danger-500 p-4 mb-6">
          <p className="text-danger-700">{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
        >
          Retry
        </button>
      </div>
    );
  }

  // Placeholder dashboard content based on user role
  const renderDashboardContent = () => {
    if (!currentUser) return null;

    switch (currentUser.role) {
      case 'victim':
        return <VictimDashboard user={currentUser} data={dashboardData} />;
      case 'ngo':
        return <NGODashboard user={currentUser} data={dashboardData} />;
      case 'volunteer':
        return <VolunteerDashboard user={currentUser} data={dashboardData} />;
      case 'government':
        return null; // handled via redirect above
      default:
        return (
          <div className="text-center py-8">
            <p className="text-lg text-gray-600">Welcome to the Disaster Relief Platform</p>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
      {renderDashboardContent()}
    </div>
  );
};

// Role-specific dashboard components
const VictimDashboard = ({ user }) => {
  const { notifications } = useNotification();
  
  // Filter emergency alerts from notifications
  const emergencyAlerts = React.useMemo(() => {
    if (!notifications) return [];
    return notifications.filter(notification => 
      notification.type === 'system_alert' || notification.type === 'emergency_contact'
    );
  }, [notifications]);

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Hello, {user.name}</h2>
        <p className="text-gray-600">You are connected to our disaster response system. <span className="font-medium text-green-600">Help is available</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Help Requests</h3>
          <div className="space-y-4">
            <p className="text-gray-600">You haven't requested any assistance yet. We're here to help with your needs.</p>
            <Link 
              to="/victim/dashboard"
              className="inline-block px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
            >
              Request Help
            </Link>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Nearby Resources</h3>
          <div className="space-y-4">
            <p className="text-gray-600">No resources available in your area yet.</p>
            <Link 
              to="/map"
              className="inline-block px-4 py-2 border border-primary-500 text-primary-500 rounded hover:bg-primary-50"
            >
              View Map
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Emergency Alerts</h3>
        {emergencyAlerts.length === 0 ? (
          <div className="p-4 bg-gray-50 border-l-4 border-gray-300 rounded">
            <p className="text-gray-700">No active emergency alerts for your area.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {emergencyAlerts.map((alert) => (
              <div key={alert._id} className={`p-4 border-l-4 rounded ${
                alert.priority === 'urgent' ? 'bg-red-50 border-red-500' :
                alert.priority === 'high' ? 'bg-orange-50 border-orange-500' :
                'bg-yellow-50 border-yellow-500'
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{alert.title}</h4>
                    <p className="text-gray-700 mt-1">{alert.message}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!alert.read && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      New
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const NGODashboard = ({ user }) => {
  const { notifications } = useNotification();
  const [requestCount, setRequestCount] = useState(0);
  
  // Filter emergency alerts from notifications
  const emergencyAlerts = React.useMemo(() => {
    if (!notifications) return [];
    return notifications.filter(notification => 
      notification.type === 'system_alert' || notification.type === 'emergency_contact'
    );
  }, [notifications]);
  
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const requests = await axios.get('http://localhost:5000/api/requests/map');
        setRequestCount(requests.data.length);
      } catch (err) {
        console.error('Error fetching requests:', err);
      }
    };
    
    fetchRequests();
  }, []);

  const getVerificationStatus = () => {
    if (user.isVerified) {
      return <span className="font-medium text-green-600">Verified</span>;
    } else if (user.isRejected) {
      return <span className="font-medium text-red-600">Rejected</span>;
    } else {
      return <span className="font-medium text-yellow-600">Pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Welcome, {user.name} from {user.profileData?.organizationName}</h2>
        <p className="text-gray-600">Verification status: {getVerificationStatus()}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Resource Management</h3>
          <div className="space-y-4">
            <p className="text-gray-600">You haven't added any resources yet.</p>
            <Link 
              to="/ngo/dashboard"
              className="inline-block px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
            >
              Add Resources
            </Link>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Help Requests</h3>
          <div className="space-y-4">
            <p className="text-gray-600">
              {requestCount > 0 
                ? `${requestCount} pending requests available` 
                : 'No pending requests in your area.'
              }
            </p>
            <Link 
              to="/ngo/requests"
              className="inline-block px-4 py-2 border border-primary-500 text-primary-500 rounded hover:bg-primary-50"
            >
              View All Requests
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Disaster Updates</h3>
        <div className="p-4 bg-info-50 border-l-4 border-info-500 rounded">
          <p className="text-info-700">No active disasters in your operational areas.</p>
        </div>
      </div>
    </div>
  );
};

const VolunteerDashboard = ({ user }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Welcome, {user.name}</h2>
        <p className="text-gray-600">Verification status: <span className="font-medium text-warning-600">Pending</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Skills</h3>
          <div className="space-y-4">
            {user.profileData?.skills?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.profileData.skills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No skills added yet.</p>
            )}
            <button className="px-4 py-2 border border-primary-500 text-primary-500 rounded hover:bg-primary-50">
              Update Skills
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Available Tasks</h3>
          <div className="space-y-4">
            <p className="text-gray-600">No tasks available in your area.</p>
            <button className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600">
              Find Tasks
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Emergency Alerts</h3>
        {emergencyAlerts.length === 0 ? (
          <div className="p-4 bg-gray-50 border-l-4 border-gray-300 rounded">
            <p className="text-gray-700">No active emergency alerts for your area.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {emergencyAlerts.map((alert) => (
              <div key={alert._id} className={`p-4 border-l-4 rounded ${
                alert.priority === 'urgent' ? 'bg-red-50 border-red-500' :
                alert.priority === 'high' ? 'bg-orange-50 border-orange-500' :
                'bg-yellow-50 border-yellow-500'
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{alert.title}</h4>
                    <p className="text-gray-700 mt-1">{alert.message}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!alert.read && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      New
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


export default Dashboard;