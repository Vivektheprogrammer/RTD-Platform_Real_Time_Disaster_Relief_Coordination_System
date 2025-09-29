import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const PendingApprovals = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkReason, setBulkReason] = useState('');
  
  // Filters
  const [filters, setFilters] = useState({
    role: '',
    sortBy: 'createdAt',
    sortOrder: 'asc'
  });

  useEffect(() => {
    fetchPendingUsers();
  }, [filters]);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        isVerified: 'false',
        ...filters
      });

      const res = await axios.get(`/admin/users?${params}`);
      setPendingUsers(res.data.users.filter(user => !user.isRejected));
    } catch (err) {
      console.error('Error fetching pending users:', err);
      toast.error('Failed to fetch pending users');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === pendingUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(pendingUsers.map(user => user._id));
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      await axios.put(`/admin/users/${userId}/approve`);
      toast.success('User approved successfully');
      fetchPendingUsers();
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
      fetchPendingUsers();
    } catch (err) {
      console.error('Error rejecting user:', err);
      toast.error(err.response?.data?.msg || 'Failed to reject user');
    }
  };

  const handleBulkAction = () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }
    setShowBulkModal(true);
  };

  const executeBulkAction = async () => {
    if (bulkAction === 'reject' && !bulkReason) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      const promises = selectedUsers.map(userId => {
        if (bulkAction === 'approve') {
          return axios.put(`/admin/users/${userId}/approve`);
        } else if (bulkAction === 'reject') {
          return axios.put(`/admin/users/${userId}/reject`, { rejectionReason: bulkReason });
        }
      });

      await Promise.all(promises);
      toast.success(`${selectedUsers.length} users ${bulkAction}d successfully`);
      setSelectedUsers([]);
      setBulkAction('');
      setBulkReason('');
      setShowBulkModal(false);
      fetchPendingUsers();
    } catch (err) {
      console.error('Error executing bulk action:', err);
      toast.error('Failed to execute bulk action');
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

  const getWaitingTime = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInHours = Math.floor((now - created) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours} hours`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Pending Approvals
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Review and approve new user registrations ({pendingUsers.length} pending)
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Pending</p>
              <p className="text-lg font-semibold text-gray-900">{pendingUsers.length}</p>
            </div>
          </div>
        </div>

        {['ngo', 'volunteer', 'government'].map(role => (
          <div key={role} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getRoleColor(role)}`}>
                  <span className="text-sm font-medium">{role.charAt(0).toUpperCase()}</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">{role.charAt(0).toUpperCase() + role.slice(1)}</p>
                <p className="text-lg font-semibold text-gray-900">
                  {pendingUsers.filter(user => user.role === role).length}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Bulk Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Role</label>
              <select
                className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="ngo">NGO</option>
                <option value="volunteer">Volunteer</option>
                <option value="government">Government</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  handleFilterChange('sortBy', sortBy);
                  handleFilterChange('sortOrder', sortOrder);
                }}
              >
                <option value="createdAt-asc">Oldest First</option>
                <option value="createdAt-desc">Newest First</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
              </select>
            </div>
          </div>

          {selectedUsers.length > 0 && (
            <div className="flex items-center space-x-2">
              <select
                className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
              >
                <option value="">Bulk Action</option>
                <option value="approve">Approve Selected</option>
                <option value="reject">Reject Selected</option>
              </select>
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pending Users List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">All caught up!</h3>
            <p className="mt-2 text-sm text-gray-500">No pending user approvals at the moment.</p>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Pending Users ({pendingUsers.length})
                </h3>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === pendingUsers.length}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Select All</span>
                </div>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200">
              {pendingUsers.map((user) => (
                <div key={user._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => handleSelectUser(user._id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="ml-4 flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-lg font-medium text-gray-700">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <h4 className="text-lg font-medium text-gray-900">{user.name}</h4>
                            <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          <p className="text-sm text-gray-500">{user.phone}</p>
                          {user.location?.address && (
                            <p className="text-sm text-gray-500">📍 {user.location.address}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Waiting for</p>
                        <p className="text-sm font-medium text-gray-900">{getWaitingTime(user.createdAt)}</p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleApproveUser(user._id)}
                          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectUser(user._id)}
                          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bulk Action Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {bulkAction === 'approve' ? 'Approve Users' : 'Reject Users'}
                </h3>
                <button
                  onClick={() => {
                    setShowBulkModal(false);
                    setBulkAction('');
                    setBulkReason('');
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
                  You are about to {bulkAction} <strong>{selectedUsers.length}</strong> users.
                </p>
                
                {bulkAction === 'reject' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reason for Rejection *</label>
                    <textarea
                      rows={3}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={bulkReason}
                      onChange={(e) => setBulkReason(e.target.value)}
                      placeholder="Enter the reason for rejection..."
                    />
                  </div>
                )}
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowBulkModal(false);
                      setBulkAction('');
                      setBulkReason('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeBulkAction}
                    className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      bulkAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {bulkAction === 'approve' ? 'Approve Users' : 'Reject Users'}
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

export default PendingApprovals;
