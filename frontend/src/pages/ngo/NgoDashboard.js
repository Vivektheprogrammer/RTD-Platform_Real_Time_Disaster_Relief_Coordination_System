import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { requestService, offerService } from '../../services/api';
import socketService from '../../services/socket';

const NgoDashboard = () => {
  const { currentUser } = useAuth();
  const { notifications } = useNotification();
  const [offers, setOffers] = useState([]);
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('offers');
  const [loading, setLoading] = useState(true);
  const [acceptedLoading, setAcceptedLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    matched: 0,
    fulfilled: 0,
    expired: 0
  });
  
  // Filter emergency alerts from notifications
  const disasterUpdates = React.useMemo(() => {
    if (!notifications) return [];
    return notifications.filter(notification => 
      notification.type === 'system_alert' || notification.type === 'emergency_dispatch'
    );
  }, [notifications]);

  // Fetch all offers on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch offers
        const offerData = await offerService.getUserOffers();
        console.log('Received offers data:', offerData);
        setOffers(Array.isArray(offerData) ? offerData : []);
        calculateStats(offerData);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load your resource offerings. Please try again later.');
        setOffers([]);
        calculateStats([]);
        setLoading(false);
      }
    };

    fetchData();

    // Setup socket listeners for real-time updates
    socketService.connect();
    socketService.joinRoom(`ngo_${currentUser.id}`);
    
    socketService.on('offer_matched', (data) => {
      updateOfferInState(data.offerId, data.offer);
    });

    socketService.on('offer_updated', (data) => {
      updateOfferInState(data.offerId, data.offer);
    });

    socketService.on('offer_expired', (data) => {
      updateOfferInState(data.offerId, { status: 'expired' });
    });

    return () => {
      socketService.off('offer_matched');
      socketService.off('offer_updated');
      socketService.off('offer_expired');
      socketService.leaveRoom(`ngo_${currentUser.id}`);
    };
  }, [currentUser.id]);

  // Fetch accepted requests when the tab is activated
  useEffect(() => {
    if (activeTab === 'accepted-requests') {
      fetchAcceptedRequests();
    }
  }, [activeTab]);

  // Fetch accepted requests that need completion
  const fetchAcceptedRequests = async () => {
    setAcceptedLoading(true);
    try {
      // This will get requests where this NGO's offers have been accepted
      const response = await requestService.getAcceptedRequestsForNGO();
      setAcceptedRequests(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error('Error fetching accepted requests:', err);
      setError('Failed to load accepted requests. Please try again later.');
      setAcceptedRequests([]);
    } finally {
      setAcceptedLoading(false);
    }
  };

  // Calculate statistics based on offers
  const calculateStats = (offersList) => {
    // Handle undefined or null offersList
    const offers = Array.isArray(offersList) ? offersList : [];
    
    const stats = {
      total: offers.length,
      pending: 0,
      matched: 0,
      fulfilled: 0,
      expired: 0
    };

    offers.forEach(offer => {
      if (offer && offer.status && stats[offer.status] !== undefined) {
        stats[offer.status]++;
      }
    });

    setStats(stats);
  };

  // Update a single offer in the state
  const updateOfferInState = (offerId, updatedData) => {
    setOffers(prevOffers => {
      const updatedOffers = prevOffers.map(offer => {
        if (offer._id === offerId) {
          return { ...offer, ...updatedData };
        }
        return offer;
      });
      
      calculateStats(updatedOffers);
      return updatedOffers;
    });
  };

  // Filter offers based on active tab - only filter when viewing offers
  const filteredOffers = (['all', 'pending', 'matched', 'fulfilled', 'expired'].includes(activeTab))
    ? (activeTab === 'all' ? offers : offers.filter(offer => offer.status === activeTab))
    : offers;

  // Handle offer expiration
  const handleExpireOffer = async (offerId) => {
    try {
      await offerService.expireOffer(offerId);
      updateOfferInState(offerId, { status: 'expired' });
    } catch (err) {
      console.error('Error expiring offer:', err);
      setError('Failed to expire the offer. Please try again.');
    }
  };

  // Handle offer fulfillment (mark help as given)
  const handleFulfillOffer = async (offerId) => {
    if (!window.confirm('Are you sure you want to mark this help as given? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await offerService.fulfillOffer(offerId);
      updateOfferInState(offerId, { status: 'fulfilled', fulfilledAt: new Date() });
      
      // Show success message
      alert(`Help successfully provided! ${response.fulfilledRequests || 0} recipients have been notified.`);
    } catch (err) {
      console.error('Error fulfilling offer:', err);
      const errorMsg = err.msg || err.message || 'Failed to mark the offer as fulfilled. Please try again.';
      setError(errorMsg);
      alert(errorMsg);
    }
  };

  // Handle request completion (mark request as fulfilled from NGO side)
  const handleCompleteRequest = async (requestId, offerId) => {
    if (!window.confirm('Are you sure you want to mark this request as completed? This will notify the victim that help has been provided.')) {
      return;
    }

    try {
      const response = await offerService.fulfillOffer(offerId);
      
      // Remove from accepted requests list
      setAcceptedRequests(prev => prev.filter(req => req._id !== requestId));
      
      // Show success message
      alert('Request marked as completed! The victim has been notified that help was provided.');
      
      // Refresh the offers list to show updated status
      const offerData = await offerService.getUserOffers();
      setOffers(Array.isArray(offerData) ? offerData : []);
      calculateStats(offerData);
      
    } catch (err) {
      console.error('Error completing request:', err);
      const errorMsg = err.msg || err.message || 'Failed to mark the request as completed. Please try again.';
      setError(errorMsg);
      alert(errorMsg);
    }
  };

  // Get appropriate status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'matched':
        return 'bg-yellow-100 text-yellow-800';
      case 'fulfilled':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">NGO Dashboard</h1>
          <p className="mt-1 text-gray-600">Manage your resource offerings and track their status</p>
        </div>
        <Link
          to="/ngo/offers/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create New Offer
        </Link>
      </div>
      
      {/* Disaster Updates Section */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Disaster Updates</h3>
        {disasterUpdates.length === 0 ? (
          <div className="p-4 bg-gray-50 border-l-4 border-gray-300 rounded">
            <p className="text-gray-700">No active disasters in your operational areas.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {disasterUpdates.map((alert) => (
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <p className="text-sm font-medium text-gray-500">Total Offers</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <p className="text-sm font-medium text-gray-500">Pending</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <p className="text-sm font-medium text-gray-500">Matched</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.matched}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <p className="text-sm font-medium text-gray-500">Fulfilled</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.fulfilled}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-500">
          <p className="text-sm font-medium text-gray-500">Expired</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.expired}</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
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
      )}

      {/* Content Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Resource Management</h2>
      </div>

      {/* Offers Tab */}
      {(activeTab === 'offers' || ['all', 'pending', 'matched', 'fulfilled', 'expired'].includes(activeTab)) && (
        <>
        </>
      )}

      {/* Content Area */}
      {activeTab === 'accepted-requests' ? (
        /* Accepted Requests Content */
        <>
          {acceptedLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
              <p className="mt-2 text-gray-500">Loading accepted requests...</p>
            </div>
          ) : acceptedRequests.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No accepted requests</h3>
              <p className="mt-1 text-sm text-gray-500">
                When victims accept your offers, they will appear here for you to complete.
              </p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <ul className="divide-y divide-gray-200">
                {acceptedRequests.map((request) => (
                  <li key={request._id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4">
                            <h4 className="text-lg font-medium text-gray-900">{request.title || request.requestType}</h4>
                            <div className="flex items-center mt-1">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Accepted
                              </span>
                              <span className="ml-2 text-sm text-gray-500">
                                by {request.requestedBy?.name || 'Victim'}
                              </span>
                              <span className="ml-2 text-sm text-gray-500">
                                on {new Date(request.acceptedMatch.acceptedAt || request.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                          {request.quantity && (
                            <p className="text-sm text-gray-500">
                              <strong>Quantity needed:</strong> {request.quantity}
                            </p>
                          )}
                          <p className="text-sm text-gray-500">
                            <strong>Urgency:</strong> {request.urgency?.charAt(0).toUpperCase() + request.urgency?.slice(1)}
                          </p>
                          <p className="text-sm text-gray-500">
                            <strong>Location:</strong> {request.location?.address || 'Not specified'}
                          </p>
                          {request.requiredBy && (
                            <p className="text-sm text-gray-500">
                              <strong>Required by:</strong> {new Date(request.requiredBy).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        {request.acceptedMatch && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-md">
                            <h5 className="text-sm font-medium text-blue-900">Your Accepted Offer:</h5>
                            <p className="text-sm text-blue-700 mt-1">
                              {request.acceptedMatch.offerTitle || request.acceptedMatch.offerDescription || 'Help offered'}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="ml-6 flex flex-col space-y-2">
                        <button
                          onClick={() => handleCompleteRequest(request._id, request.acceptedMatch.offerId)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Mark as Completed
                        </button>
                        <Link
                          to={`/ngo/requests/${request._id}`}
                          className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        /* Offers Content */
        <>
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <div className="mt-6">
              <Link
                to="/ngo/offers/create"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Create New Offer
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NgoDashboard;