import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { offerService } from '../../services/api';
import socketService from '../../services/socket';
import { useAuth } from '../../contexts/AuthContext';

const OfferDetail = () => {
  const { offerId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch offer data on component mount
  useEffect(() => {
    const fetchOffer = async () => {
      try {
        setLoading(true);
        const response = await offerService.getOfferById(offerId);
        setOffer(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching offer:', err);
        setError('Failed to load offer details. Please try again later.');
        setLoading(false);
      }
    };

    fetchOffer();

    // Setup socket listeners for real-time updates
    socketService.connect();
    socketService.joinRoom(`ngo_${currentUser.id}`);
    
    socketService.on('offer_matched', (data) => {
      if (data.offerId === offerId) {
        updateOfferState(data.offer);
      }
    });

    socketService.on('offer_updated', (data) => {
      if (data.offerId === offerId) {
        updateOfferState(data.offer);
      }
    });

    socketService.on('offer_expired', (data) => {
      if (data.offerId === offerId) {
        updateOfferState({ status: 'expired' });
      }
    });

    return () => {
      socketService.off('offer_matched');
      socketService.off('offer_updated');
      socketService.off('offer_expired');
      socketService.leaveRoom(`ngo_${currentUser.id}`);
    };
  }, [offerId, currentUser.id]);

  // Update offer state with new data
  const updateOfferState = (updatedData) => {
    setOffer(prevOffer => {
      if (!prevOffer) return prevOffer;
      return { ...prevOffer, ...updatedData };
    });
  };

  // Handle offer expiration
  const handleExpireOffer = async () => {
    try {
      setActionLoading(true);
      await offerService.expireOffer(offerId);
      updateOfferState({ status: 'expired' });
      setActionLoading(false);
    } catch (err) {
      console.error('Error expiring offer:', err);
      setError('Failed to expire the offer. Please try again.');
      setActionLoading(false);
    }
  };

  // Handle fulfilling a matched offer
  const handleFulfillOffer = async () => {
    try {
      setActionLoading(true);
      await offerService.fulfillOffer(offerId);
      updateOfferState({ status: 'fulfilled' });
      setActionLoading(false);
    } catch (err) {
      console.error('Error fulfilling offer:', err);
      setError('Failed to fulfill the offer. Please try again.');
      setActionLoading(false);
    }
  };

  // Get status badge color
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

  // Format date
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-2 text-gray-500">Loading offer details...</p>
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
                  onClick={() => navigate('/ngo/dashboard')}
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

  if (!offer) {
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
              <p className="text-sm text-yellow-700">
                Offer not found or you don't have permission to view it.
              </p>
              <div className="mt-4">
                <button
                  onClick={() => navigate('/ngo/dashboard')}
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
            onClick={() => navigate('/ngo/dashboard')}
            className="mr-4 text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Resource Offer Details</h1>
        </div>

        {/* Offer Status Banner */}
        <div className={`mb-6 p-4 rounded-md ${offer.status === 'pending' ? 'bg-blue-50' : offer.status === 'matched' ? 'bg-yellow-50' : offer.status === 'fulfilled' ? 'bg-green-50' : 'bg-gray-50'}`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {offer.status === 'pending' && (
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              )}
              {offer.status === 'matched' && (
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {offer.status === 'fulfilled' && (
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {offer.status === 'expired' && (
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${offer.status === 'pending' ? 'text-blue-800' : offer.status === 'matched' ? 'text-yellow-800' : offer.status === 'fulfilled' ? 'text-green-800' : 'text-gray-800'}`}>
                Status: {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
              </h3>
              <div className="mt-2 text-sm">
                <p className={offer.status === 'pending' ? 'text-blue-700' : offer.status === 'matched' ? 'text-yellow-700' : offer.status === 'fulfilled' ? 'text-green-700' : 'text-gray-700'}>
                  {offer.status === 'pending' && 'This offer is available for matching with victim requests.'}
                  {offer.status === 'matched' && 'This offer has been matched with a victim request.'}
                  {offer.status === 'fulfilled' && 'This offer has been fulfilled successfully.'}
                  {offer.status === 'expired' && 'This offer has expired and is no longer available.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white shadow overflow-hidden rounded-lg">
          {/* Offer Details */}
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {offer.type} Resource Offer
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Created on {formatDate(offer.createdAt)}
            </p>
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Resource Type</dt>
                <dd className="mt-1 text-sm text-gray-900">{offer.type}</dd>
              </div>

              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Quantity</dt>
                <dd className="mt-1 text-sm text-gray-900">{offer.quantity}</dd>
              </div>

              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(offer.status)}`}>
                    {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                  </span>
                </dd>
              </div>

              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Expires In</dt>
                <dd className="mt-1 text-sm text-gray-900">{offer.expiresIn} hours</dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900">{offer.description}</dd>
              </div>

              {offer.additionalInfo && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Additional Information</dt>
                  <dd className="mt-1 text-sm text-gray-900">{offer.additionalInfo}</dd>
                </div>
              )}

              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {offer.location?.address || 'No address provided'}
                  {offer.location?.coordinates && (
                    <p className="text-xs text-gray-500 mt-1">
                      Coordinates: {offer.location.coordinates[1]}, {offer.location.coordinates[0]}
                    </p>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {/* Matched Request Section */}
          {offer.matchedWith && (
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Matched Request
              </h3>
              <div className="bg-yellow-50 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      {offer.matchedWith.type} Request
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>{offer.matchedWith.description}</p>
                    </div>
                    <div className="mt-3">
                      <div className="-mx-2 -my-1.5 flex">
                        {offer.status === 'matched' && (
                          <button
                            onClick={handleFulfillOffer}
                            disabled={actionLoading}
                            className="px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                          >
                            {actionLoading ? 'Processing...' : 'Mark as Fulfilled'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => navigate('/ngo/dashboard')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Dashboard
              </button>
              
              {offer.status === 'pending' && (
                <>
                  <Link
                    to={`/ngo/offers/${offerId}/edit`}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Edit Offer
                  </Link>
                  <button
                    onClick={handleExpireOffer}
                    disabled={actionLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Expire Offer'}
                  </button>
                </>
              )}
              
              {offer.status === 'matched' && (
                <button
                  onClick={handleFulfillOffer}
                  disabled={actionLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Mark as Fulfilled'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferDetail;