import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasNext: false,
    hasPrev: false
  });
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    isVerified: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Modal states
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspensionData, setSuspensionData] = useState({
    reason: '',
    duration: ''
  });

  useEffect(() => {
    fetchUsers();
  }, [filters, pagination.currentPage]);

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...filters
      });

      const res = await axios.get(`/admin/users?${params}`);
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApproveUser = async (userId) => {
    try {
      await axios.put(`/admin/users/${userId}/approve`);
      toast.success('User approved successfully');
      fetchUsers(pagination.currentPage);
    } catch (err) {
      console.error('Error approving user:', err);
      toast.error(err.response?.data?.msg || 'Failed to approve user');
    }
  };

  const handleRejectUser = async (userId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      await axios.put(`/admin/users/${userId}/reject`, { rejectionReason: reason });
      toast.success('User rejected successfully');
      fetchUsers(pagination.currentPage);
    } catch (err) {
      console.error('Error rejecting user:', err);
      toast.error(err.response?.data?.msg || 'Failed to reject user');
    }
  };

  const handleSuspendUser = async () => {
    if (!selectedUser || !suspensionData.reason) {
      toast.error('Please provide suspension reason');
      return;
    }

    try {
      await axios.put(`/admin/users/${selectedUser._id}/suspend`, {
        suspensionReason: suspensionData.reason,
        suspensionDuration: suspensionData.duration ? parseInt(suspensionData.duration) : null
      });
      toast.success('User suspended successfully');
      setShowSuspendModal(false);
      setSuspensionData({ reason: '', duration: '' });
      fetchUsers(pagination.currentPage);
    } catch (err) {
      console.error('Error suspending user:', err);
      toast.error(err.response?.data?.msg || 'Failed to suspend user');
    }
  };

  const handleUnsuspendUser = async (userId) => {
    try {
      await axios.put(`/admin/users/${userId}/unsuspend`);
      toast.success('User unsuspended successfully');
      fetchUsers(pagination.currentPage);
    } catch (err) {
      console.error('Error unsuspending user:', err);
      toast.error(err.response?.data?.msg || 'Failed to unsuspend user');
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'victim': return 'bg-blue-100 text-blue-800';
      case 'ngo': return 'bg-green-100 text-green-800';
      case 'volunteer': return 'bg-purple-100 text-purple-800';
      case 'government': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (user) => {
    if (user.isSuspended) return 'bg-red-100 text-red-800';
    if (user.isRejected) return 'bg-gray-100 text-gray-800';
    if (user.isVerified) return 'bg-green-100 text-green-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStatusText = (user) => {
    if (user.isSuspended) return 'Suspended';
    if (user.isRejected) return 'Rejected';
    if (user.isVerified) return 'Verified';
    return 'Pending';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            User Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage all users in the system - approve, reject, suspend, or view details
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              placeholder="Search by name or email"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="victim">Victim</option>
              <option value="ngo">NGO</option>
              <option value="volunteer">Volunteer</option>
              <option value="government">Government</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={filters.isVerified}
              onChange={(e) => handleFilterChange('isVerified', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="true">Verified</option>
              <option value="false">Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Sort By</label>
            <select
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                handleFilterChange('sortBy', sortBy);
                handleFilterChange('sortOrder', sortOrder);
              }}
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Users ({pagination.totalUsers})
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user)}`}>
                          {getStatusText(user)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </button>
                          
                          {!user.isVerified && !user.isRejected && (
                            <>
                              <button
                                onClick={() => handleApproveUser(user._id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectUser(user._id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          
                          {user.isVerified && (
                            <>
                              {user.isSuspended ? (
                                <button
                                  onClick={() => handleUnsuspendUser(user._id)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Unsuspend
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowSuspendModal(true);
                                  }}
                                  className="text-yellow-600 hover:text-yellow-900"
                                >
                                  Suspend
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => fetchUsers(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchUsers(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{pagination.currentPage}</span> of{' '}
                      <span className="font-medium">{pagination.totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => fetchUsers(pagination.currentPage - 1)}
                        disabled={!pagination.hasPrev}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => fetchUsers(pagination.currentPage + 1)}
                        disabled={!pagination.hasNext}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">User Details</h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.phone}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <p className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(selectedUser.role)}`}>
                      {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                    </span>
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedUser)}`}>
                      {getStatusText(selectedUser)}
                    </span>
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Joined</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedUser.createdAt).toLocaleDateString()} at {new Date(selectedUser.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                
                {selectedUser.location?.address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.location.address}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suspend User Modal */}
      {showSuspendModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Suspend User</h3>
                <button
                  onClick={() => {
                    setShowSuspendModal(false);
                    setSuspensionData({ reason: '', duration: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  You are about to suspend <strong>{selectedUser.name}</strong>. Please provide a reason.
                </p>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reason for Suspension *</label>
                  <textarea
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={suspensionData.reason}
                    onChange={(e) => setSuspensionData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Enter the reason for suspension..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Duration (days)</label>
                  <input
                    type="number"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={suspensionData.duration}
                    onChange={(e) => setSuspensionData(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="Leave empty for permanent suspension"
                  />
                  <p className="mt-1 text-sm text-gray-500">Leave empty for permanent suspension</p>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowSuspendModal(false);
                      setSuspensionData({ reason: '', duration: '' });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSuspendUser}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                  >
                    Suspend User
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
