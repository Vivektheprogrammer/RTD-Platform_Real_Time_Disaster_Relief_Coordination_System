import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { requestService, messageService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const NgoRequestDetail = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contactSent, setContactSent] = useState(false);

  useEffect(() => {
    fetchRequestDetail();
  }, [requestId]);

  const fetchRequestDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the new view endpoint that allows NGOs to access request details
      const response = await requestService.getRequestForView(requestId);
      setRequest(response);
    } catch (err) {
      console.error('Error fetching request:', err);
      setError(err.response?.data?.msg || 'Failed to load request details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleContact = async () => {
    try {
      // Check if request and user data exist
      if (!request || !request.userId) {
        console.error('Request or user data not available');
        return;
      }

      // Send a message to the requester
      const messageData = {
        recipientId: request.userId._id,
        content: `Hello ${request.userId.name}, I'm ${currentUser.name} from ${currentUser.organization || 'our organization'}. I saw your request for ${request.resourceType} and would like to help. Please let me know how we can assist you.`,
        relatedResource: {
          resourceType: 'request',
          resourceId: request._id
        }
      };

      await messageService.sendMessage(messageData);
      setContactSent(true);
      
      console.log(`${currentUser.role?.toUpperCase() || 'USER'} ${currentUser.name} contacted requester for request ${requestId}`);
      
      // Reset the contact sent status after 3 seconds
      setTimeout(() => setContactSent(false), 3000);
    } catch (err) {
      console.error('Error contacting requester:', err);
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'matched':
        return 'bg-purple-100 text-purple-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getResourceTypeIcon = (type) => {
    const iconClasses = "h-8 w-8";
    switch (type) {
      case 'food':
        return <svg className={iconClasses} fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/></svg>;
      case 'shelter':
        return <svg className={iconClasses} fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>;
      case 'medical':
        return <svg className={iconClasses} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd"/></svg>;
      case 'transport':
        return <svg className={iconClasses} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" clipRule="evenodd"/></svg>;
      default:
        return <svg className={iconClasses} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></svg>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
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
        <button
          onClick={() => navigate('/ngo/requests')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Back to Requests
        </button>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">Request not found</h3>
          <p className="mt-1 text-sm text-gray-500">The requested help request could not be found.</p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/ngo/requests')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Requests
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/ngo/requests')}
          className="mr-4 text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Help Request Details</h1>
          <p className="mt-1 text-gray-600">Review and respond to this help request</p>
        </div>
      </div>

      {/* Contact Success Message */}
      {contactSent && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">Your contact request has been sent to the requester!</p>
            </div>
          </div>
        </div>
      )}

      {/* Request Details Card */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Header Section */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                {getResourceTypeIcon(request.requestType)}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {request.title || `${request.requestType.charAt(0).toUpperCase() + request.requestType.slice(1)} Request`}
                </h2>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(request.urgency)}`}>
                    {request.urgency ? request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1) : 'Normal'} Priority
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleContact}
              disabled={contactSent}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                contactSent 
                  ? 'bg-green-600 cursor-default' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {contactSent ? (
                <>
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Contact Sent
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact Requester
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-6 py-4 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700 leading-relaxed">{request.description}</p>
          </div>

          {/* Request Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Request Information</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Resource Type</dt>
                  <dd className="text-sm text-gray-900 capitalize">{request.requestType}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Quantity Needed</dt>
                  <dd className="text-sm text-gray-900">{request.quantity}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Urgency Level</dt>
                  <dd className="text-sm text-gray-900 capitalize">{request.urgency || 'Normal'}</dd>
                </div>
                {request.requiredBy && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Required By</dt>
                    <dd className="text-sm text-gray-900">{new Date(request.requiredBy).toLocaleDateString()}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Location & Contact</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Requested By</dt>
                  <dd className="text-sm text-gray-900">{request.userId?.name || 'Anonymous'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Contact Email</dt>
                  <dd className="text-sm text-gray-900">{request.userId?.email || 'Not available'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="text-sm text-gray-900">{request.location?.address || 'Location not specified'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Request Date</dt>
                  <dd className="text-sm text-gray-900">{new Date(request.createdAt).toLocaleDateString()}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Additional Information */}
          {request.additionalInfo && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Additional Information</h3>
              <p className="text-gray-700">{request.additionalInfo}</p>
            </div>
          )}

          {/* Matching Information */}
          {request.matchedWith && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-purple-900 mb-2">Matching Information</h3>
              <p className="text-purple-700">This request has been matched with an offer.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NgoRequestDetail;
