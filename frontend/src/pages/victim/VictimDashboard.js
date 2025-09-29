import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRequest } from '../../contexts/RequestContext';
import { useNotification } from '../../contexts/NotificationContext';
import { messageService, requestService } from '../../services/api';

const VictimDashboard = () => {
  const { currentUser } = useAuth();
  const { requests, loading, error, fetchRequests } = useRequest();
  const { unreadCount, notifications } = useNotification();
  const [activeTab, setActiveTab] = useState('active');
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  
  // Filter emergency alerts from notifications
  const emergencyAlerts = useMemo(() => {
    if (!notifications) return [];
    return notifications.filter(notification => 
      notification.type === 'system_alert' || notification.type === 'emergency_dispatch'
    );
  }, [notifications]);

  useEffect(() => {
    console.log('VictimDashboard: Fetching requests and messages...');
    fetchRequests();
    fetchMessages();
    fetchMatches();
  }, [fetchRequests]);

  const fetchMessages = async () => {
    try {
      setMessagesLoading(true);
      const response = await messageService.getReceivedMessages();
      setMessages(response);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const fetchMatches = async () => {
    try {
      setMatchesLoading(true);
      const matchesData = await requestService.getUserMatches();
      setMatches(matchesData);
      console.log('Fetched matches:', matchesData);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setMatchesLoading(false);
    }
  };

  // Filter requests based on active tab
  const filteredRequests = requests.filter(request => {
    if (activeTab === 'active') {
      return request.status === 'pending' || request.status === 'in_progress';
    } else if (activeTab === 'fulfilled') {
      return request.status === 'fulfilled';
    } else if (activeTab === 'cancelled') {
      return request.status === 'cancelled';
    }
    return false;
  });

  // Filter matches for help status tab
  const filteredMatches = matches.filter(match => {
    return match.status === 'accepted' || match.status === 'rejected';
  });  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'matched':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'fulfilled':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Emergency Alerts Section */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Help Request Center</h1>
          <p className="text-gray-600 mt-1">Hello {currentUser?.name || 'User'}, we're here to help you get the assistance you need.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link 
            to="/victim/requests/create" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md inline-flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Request Help
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="font-semibold text-gray-600">Help Requests in Progress</h2>
              <p className="text-2xl font-bold text-gray-900">
                {requests.filter(r => ['pending', 'matched', 'accepted'].includes(r.status)).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="font-semibold text-gray-600">Help Received</h2>
              <p className="text-2xl font-bold text-gray-900">
                {requests.filter(r => r.status === 'fulfilled').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="font-semibold text-gray-600">Help Responses</h2>
              <p className="text-2xl font-bold text-gray-900">
                {matches.filter(m => m.status === 'accepted' || m.status === 'rejected').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="font-semibold text-gray-600">Notifications</h2>
              <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('active')}
            className={`${activeTab === 'active' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Pending Help
          </button>
          <button
            onClick={() => setActiveTab('help-status')}
            className={`${activeTab === 'help-status' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Help Status
          </button>
          <button
            onClick={() => setActiveTab('fulfilled')}
            className={`${activeTab === 'fulfilled' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Help Received
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`${activeTab === 'cancelled' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Cancelled
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'help-status' ? (
        // Help Status Tab - Show accepted/rejected matches
        <>
          {matchesLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
              <p className="mt-2 text-gray-500">Loading help status...</p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No help responses yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Once organizations respond to your help requests, you'll see accepted and rejected offers here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMatches.map((match) => (
                <div key={`${match.requestId}-${match.offerId}`} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium text-gray-900">
                          Help Offer for {match.requestTitle}
                        </h3>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          match.status === 'accepted' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {match.status === 'accepted' ? 'Accepted' : 'Rejected'}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">
                        <strong>Offer:</strong> {match.offerTitle || 'Help Offered'}
                      </p>
                      {match.offerDescription && (
                        <p className="text-gray-600 mb-2">
                          {match.offerDescription}
                        </p>
                      )}
                      <p className="text-gray-500 text-sm">
                        <strong>Your Request:</strong> {match.requestDescription || match.requestType}
                      </p>
                      <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                        <span>
                          Response: {new Date(match.matchedAt).toLocaleDateString()} at {new Date(match.matchedAt).toLocaleTimeString()}
                        </span>
                        <span className="text-blue-600">
                          Request Type: {match.requestType}
                        </span>
                      </div>
                    </div>
                    {match.status === 'accepted' && (
                      <div className="ml-4">
                        <Link
                          to={`/victim/requests/${match.requestId}`}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          View Details
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        // Regular tabs - Show requests
        <>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
              <p className="mt-2 text-gray-500">Loading requests...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No help requests yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeTab === 'active' ? 'You haven\'t requested any help yet. Create your first request to get started.' : 
                 activeTab === 'fulfilled' ? 'You haven\'t received any help yet.' : 
                 'You don\'t have any cancelled requests.'}
              </p>
              <div className="mt-6">
                <Link to="/victim/requests/create" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Request Help Now
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden rounded-md">
              <ul className="divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <li key={request._id}>
                    <Link to={`/victim/requests/${request._id}`} className="block hover:bg-gray-50">
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-blue-600 truncate">{request.type}</p>
                            <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(request.status)}`}>
                              {request.status && request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                            {request.hasNewMatches && (
                              <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                New Matches
                              </span>
                            )}
                          </div>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className="text-sm text-gray-500">
                              {formatDate(request.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              {request.location?.address || 'Location not specified'}
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            {request.description ? (
                              request.description.length > 50 ? 
                                `${request.description.substring(0, 50)}...` : 
                                request.description
                            ) : 'No description'}
                          </div>
                        </div>
                        {/* Show fulfillment info for fulfilled requests */}
                        {request.status === 'fulfilled' && request.fulfilledAt && (
                          <div className="mt-3 p-3 bg-green-50 rounded-md">
                            <div className="flex items-center">
                              <svg className="flex-shrink-0 mr-2 h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <div>
                                <p className="text-sm font-medium text-green-800">
                                  Help received on {new Date(request.fulfilledAt).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-green-600">
                                  Thank you for using our platform! We hope the help you received was valuable.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Messages from NGOs Section */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Messages from Organizations</h2>
          <span className="text-sm text-gray-500">{messages.length} messages</span>
        </div>

        {messagesLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Messages Yet</h3>
            <p className="text-gray-500">No organizations have contacted you yet. When they do, their messages will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-medium text-gray-900">
                        {message.sender?.name || 'Organization'}
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {message.sender?.role || 'NGO'}
                      </span>
                      {!message.read && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 mb-3">
                      {message.content}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>
                        {new Date(message.createdAt).toLocaleDateString()} at {new Date(message.createdAt).toLocaleTimeString()}
                      </span>
                      {message.relatedResource?.resourceType === 'request' && (
                        <span className="text-blue-600">
                          Related to your help request
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => {
                        if (message.sender?.email) {
                          window.location.href = `mailto:${message.sender.email}?subject=Re: Help Request&body=Hi ${message.sender.name}, thank you for reaching out. `;
                        }
                      }}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VictimDashboard;