import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const AdminLayout = () => {
  const [adminData, setAdminData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const storedAdminData = localStorage.getItem('admin_data');

    if (!token) {
      navigate('/admin/login');
      return;
    }

    // Set axios default header
    axios.defaults.headers.common['x-admin-token'] = token;

    if (storedAdminData) {
      try {
        setAdminData(JSON.parse(storedAdminData));
        setLoading(false);
      } catch (err) {
        console.error('Error parsing admin data:', err);
        handleLogout();
      }
    } else {
      // Fetch admin data from API
      fetchAdminData();
    }
  }, [navigate]);

  const fetchAdminData = async () => {
    try {
      const res = await axios.get('/admin/auth/me');
      setAdminData(res.data);
      localStorage.setItem('admin_data', JSON.stringify(res.data));
      setLoading(false);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      handleLogout();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_data');
    delete axios.defaults.headers.common['x-admin-token'];
    navigate('/admin/login');
    toast.info('Logged out successfully');
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2zm0 0V9a2 2 0 012-2h4m0 0V5a2 2 0 012-2h4a2 2 0 012 2v2m0 0v2a2 2 0 01-2 2H9a2 2 0 01-2-2V7"></path>
        </svg>
      ),
      permission: 'view_analytics'
    },
    {
      name: 'User Management',
      href: '/admin/users',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
        </svg>
      ),
      permission: 'user_management'
    },

    {
      name: 'Requests & Offers',
      href: '/admin/content',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
      ),
      permission: 'manage_requests'
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
        </svg>
      ),
      permission: 'view_analytics'
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
      ),
      permission: 'system_settings'
    }
  ];

  const hasPermission = (permission) => {
    return adminData?.permissions?.includes(permission) || false;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 overflow-hidden flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-center h-16 bg-gray-900">
          <img className="h-8 w-auto" src="/images/rtd-logo-small-clean.svg" alt="RTD Admin" />
          <span className="ml-2 text-white font-semibold text-lg">RTD Admin</span>
        </div>
        
        <nav className="mt-5 px-2">
          <div className="space-y-1">
            {navigation.map((item) => {
              if (item.permission && !hasPermission(item.permission)) return null;
              
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    isActive
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150`}
                >
                  <div className="mr-3 flex-shrink-0">
                    {item.icon}
                  </div>
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center justify-between text-gray-300 text-sm">
            <div>
              <p className="font-medium">{adminData?.name}</p>
              <p className="text-gray-400 text-xs">{adminData?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-md hover:bg-gray-700 transition-colors duration-150"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <button
                  className="text-gray-500 hover:text-gray-900 lg:hidden"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"></path>
                  </svg>
                </button>
                
                <div className="hidden lg:flex lg:items-center lg:ml-6">
                  <nav className="flex space-x-8">
                    <Link
                      to="/"
                      className="text-gray-500 hover:text-gray-900 inline-flex items-center text-sm font-medium"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                      </svg>
                      Back to Site
                    </Link>
                  </nav>
                </div>
              </div>

              <div className="flex items-center">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">
                    Welcome, <span className="font-medium">{adminData?.name}</span>
                  </span>
                  <div className="relative">
                    <button className="bg-gray-800 flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                      <div className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {adminData?.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;
