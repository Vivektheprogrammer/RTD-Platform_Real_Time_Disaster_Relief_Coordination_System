import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useRequest } from '../../contexts/RequestContext';

const RequestDetail = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { fetchRequest, currentRequest, loading, error, cancelRequest, getRequestMatches, matchRequestWithOffer, acceptOffer, rejectOffer, fulfillRequest } = useRequest();
  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Fetch request details
  useEffect(() => {
    fetchRequest(requestId);
  }, [fetchRequest, requestId]);

  // Fetch matches when request is loaded
  useEffect(() => {
    if (currentRequest && ['pending', 'matched', 'accepted'].includes(currentRequest.status)) {
      loadMatches();
    }
  }, [currentRequest]);

  // Load matches for the request
  const loadMatches = async () => {
    setMatchesLoading(true);
    try {
      const matchesData = await getRequestMatches(requestId);
      setMatches(matchesData);
    } catch (err) {
      console.error('Error loading matches:', err);
    } finally {
      setMatchesLoading(false);
    }
  };

  // Handle cancel request
  const handleCancelRequest = async () => {
    setActionInProgress(true);
    try {
      await cancelRequest(requestId);
      setShowConfirmCancel(false);
    } catch (err) {
      console.error('Error cancelling request:', err);
    } finally {
      setActionInProgress(false);
    }
  };

  // Handle accept offer
  const handleAcceptOffer = async (offerId) => {
    setActionInProgress(true);
    try {
      // First, create the match
      await matchRequestWithOffer(requestId, offerId);
      // Then, accept the match
      await acceptOffer(requestId, offerId);
      // Refresh matches
      loadMatches();
    } catch (err) {
      console.error('Error accepting offer:', err);
    } finally {
      setActionInProgress(false);
    }
  };

  // Handle reject offer
  const handleRejectOffer = async (offerId) => {
    setActionInProgress(true);
    try {
      // First, create the match if it doesn't exist
      await matchRequestWithOffer(requestId, offerId);
      // Then, reject the match
      await rejectOffer(requestId, offerId);
      // Refresh matches
      loadMatches();
    } catch (err) {
      console.error('Error rejecting offer:', err);
    } finally {
      setActionInProgress(false);
    }
  };

  // Handle fulfill request
  const handleFulfillRequest = async (offerId) => {
    setActionInProgress(true);
    try {
      await fulfillRequest(requestId, offerId);
    } catch (err) {
      console.error('Error marking request as fulfilled:', err);
    } finally {
      setActionInProgress(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge color
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

  // Get urgency badge color
  const getUrgencyBadgeColor = (urgency) => {
    switch (urgency) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-2 text-gray-500">Loading request details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <div className="mt-4">
                <button
                  onClick={() => navigate('/victim/dashboard')}
                  className="text-sm text-red-700 hover:text-red-600 font-medium"
                >
                  Go back to dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentRequest) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto bg-yellow-50 border-l-4 border-yellow-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">Request not found</p>
              <div className="mt-4">
                <button
                  onClick={() => navigate('/victim/dashboard')}
                  className="text-sm text-yellow-700 hover:text-yellow-600 font-medium"
                >
                  Go back to dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/victim/dashboard')}
            className="mr-4 text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Request Details</h1>
        </div>

        {/* Request details card */}
        <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                {currentRequest.type} Request
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Created on {formatDate(currentRequest.createdAt)}
              </p>
            </div>
            <div className="flex items-center">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(currentRequest.status)}`}>
                {currentRequest.status ? currentRequest.status.charAt(0).toUpperCase() + currentRequest.status.slice(1) : 'Unknown'}
              </span>
              <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getUrgencyBadgeColor(currentRequest.urgency)}`}>
                {currentRequest.urgency ? currentRequest.urgency.charAt(0).toUpperCase() + currentRequest.urgency.slice(1) : 'Unknown'} Urgency
              </span>
            </div>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{currentRequest.description}</dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">People Affected</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{currentRequest.peopleCount}</dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {currentRequest.location?.address || 'Address not provided'}
                  {currentRequest.location?.coordinates && (
                    <p className="text-xs text-gray-500 mt-1">
                      Coordinates: {currentRequest.location.coordinates[1]}, {currentRequest.location.coordinates[0]}
                    </p>
                  )}
                </dd>
              </div>
              {currentRequest.additionalInfo && (
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Additional Information</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{currentRequest.additionalInfo}</dd>
                </div>
              )}
              {currentRequest.matchedWith && (
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Matched With</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <span className="font-medium">{currentRequest.matchedWith.ngoName || 'NGO'}</span>
                    {currentRequest.matchedWith.status && (
                      <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(currentRequest.matchedWith.status)}`}>
                        {currentRequest.matchedWith.status ? currentRequest.matchedWith.status.charAt(0).toUpperCase() + currentRequest.matchedWith.status.slice(1) : 'Unknown'}
                      </span>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </div>
          
          {/* Action buttons */}
          <div className="px-4 py-4 sm:px-6 border-t border-gray-200 flex justify-end space-x-3">
            {['pending', 'matched'].includes(currentRequest.status) && (
              <button
                onClick={() => setShowConfirmCancel(true)}
                disabled={actionInProgress}
                className="inline-flex items-center px-3 py-2 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                Cancel Request
              </button>
            )}
            {currentRequest.status === 'accepted' && (
              <button
                onClick={() => handleFulfillRequest(currentRequest.matchedWith._id)}
                disabled={actionInProgress}
                className="inline-flex items-center px-3 py-2 border border-green-300 text-sm leading-4 font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                Mark as Fulfilled
              </button>
            )}
            {['pending', 'matched'].includes(currentRequest.status) && (
              <Link
                to={`/victim/requests/${requestId}/edit`}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Edit Request
              </Link>
            )}
          </div>
        </div>

        {/* Matches section */}
        {['pending', 'matched'].includes(currentRequest.status) && (
          <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium text-gray-900">Available Matches</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                NGOs that can help with your request
              </p>
            </div>
            
            {matchesLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
                <p className="mt-2 text-gray-500">Loading matches...</p>
              </div>
            ) : matches.length === 0 ? (
              <div className="px-4 py-5 sm:px-6 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No matches found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  We're still looking for NGOs that can help with your request.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {matches.map((match) => (
                  <li key={match._id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-blue-600">{match.ngoName || match.title || 'NGO Organization'}</h4>
                        <p className="text-sm text-gray-500 mt-1">{match.description || 'No description available'}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAcceptOffer(match._id)}
                          disabled={actionInProgress}
                          className="inline-flex items-center px-2.5 py-1.5 border border-green-300 text-xs font-medium rounded text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectOffer(match._id)}
                          disabled={actionInProgress}
                          className="inline-flex items-center px-2.5 py-1.5 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">
                        {match.distance ? `${match.distance.toFixed(1)} km away` : 'Distance unknown'}
                      </span>
                      <span className="mx-2 text-gray-300">|</span>
                      <span className="text-xs text-gray-500">
                        Offered on {match.createdAt ? formatDate(match.createdAt) : 'Unknown date'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Cancel confirmation modal */}
        {showConfirmCancel && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Cancel Request</h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to cancel this request? This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={handleCancelRequest}
                    disabled={actionInProgress}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {actionInProgress ? 'Cancelling...' : 'Cancel Request'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmCancel(false)}
                    disabled={actionInProgress}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestDetail;