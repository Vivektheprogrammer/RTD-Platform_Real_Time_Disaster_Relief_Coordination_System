import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { requestService } from '../services/api';
import socketService from '../services/socket';

const RequestContext = createContext();

export const useRequest = () => useContext(RequestContext);

export const RequestProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentRequest, setCurrentRequest] = useState(null);

  // Fetch all requests for the current user
  const fetchRequests = useCallback(async () => {
    if (!currentUser) {
      console.log('RequestContext: No currentUser, skipping fetch');
      return;
    }
    
    // Only allow victims to fetch requests
    if (currentUser.role !== 'victim') {
      console.log('RequestContext: User role is not victim:', currentUser.role);
      setError('Access denied. Only victims can view requests.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('RequestContext: Fetching requests for user:', currentUser.id);
      const data = await requestService.getUserRequests();
      console.log('RequestContext: Received requests:', data);
      setRequests(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch requests');
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Fetch a specific request
  const fetchRequest = useCallback(async (requestId) => {
    if (!currentUser || !requestId) return;
    
    // Only allow victims to fetch requests
    if (currentUser.role !== 'victim') {
      setError('Access denied. Only victims can view requests.');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await requestService.getRequest(requestId);
      setCurrentRequest(data);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to fetch request');
      console.error('Error fetching request:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Create a new request
  const createRequest = useCallback(async (requestData) => {
    if (!currentUser) return null;
    
    // Only allow victims to create requests
    if (currentUser.role !== 'victim') {
      setError('Access denied. Only victims can create requests.');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await requestService.createRequest(requestData);
      setRequests(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to create request');
      console.error('Error creating request:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Update a request
  const updateRequest = useCallback(async (requestId, requestData) => {
    if (!currentUser || !requestId) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await requestService.updateRequest(requestId, requestData);
      setRequests(prev => prev.map(req => req._id === requestId ? data : req));
      if (currentRequest && currentRequest._id === requestId) {
        setCurrentRequest(data);
      }
      return data;
    } catch (err) {
      setError(err.message || 'Failed to update request');
      console.error('Error updating request:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser, currentRequest]);

  // Delete a request
  const deleteRequest = useCallback(async (requestId) => {
    if (!currentUser || !requestId) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      await requestService.deleteRequest(requestId);
      setRequests(prev => prev.filter(req => req._id !== requestId));
      if (currentRequest && currentRequest._id === requestId) {
        setCurrentRequest(null);
      }
      return true;
    } catch (err) {
      setError(err.message || 'Failed to delete request');
      console.error('Error deleting request:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentUser, currentRequest]);

  // Cancel a request
  const cancelRequest = useCallback(async (requestId) => {
    if (!currentUser || !requestId) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await requestService.cancelRequest(requestId);
      setRequests(prev => prev.map(req => req._id === requestId ? data : req));
      if (currentRequest && currentRequest._id === requestId) {
        setCurrentRequest(data);
      }
      return data;
    } catch (err) {
      setError(err.message || 'Failed to cancel request');
      console.error('Error canceling request:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser, currentRequest]);

  // Get matches for a request
  const getRequestMatches = useCallback(async (requestId) => {
    if (!currentUser || !requestId) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await requestService.getRequestMatches(requestId);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to fetch matches');
      console.error('Error fetching matches:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Match a request with an offer
  const matchRequestWithOffer = useCallback(async (requestId, offerId) => {
    if (!currentUser || !requestId || !offerId) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await requestService.matchRequestWithOffer(requestId, offerId);
      setRequests(prev => prev.map(req => req._id === requestId ? data : req));
      if (currentRequest && currentRequest._id === requestId) {
        setCurrentRequest(data);
      }
      return data;
    } catch (err) {
      setError(err.message || 'Failed to match with offer');
      console.error('Error matching with offer:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Accept an offer for a request
  const acceptOffer = useCallback(async (requestId, offerId) => {
    if (!currentUser || !requestId || !offerId) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await requestService.acceptOffer(requestId, offerId);
      setRequests(prev => prev.map(req => req._id === requestId ? data : req));
      if (currentRequest && currentRequest._id === requestId) {
        setCurrentRequest(data);
      }
      return data;
    } catch (err) {
      setError(err.message || 'Failed to accept offer');
      console.error('Error accepting offer:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser, currentRequest]);

  // Reject an offer for a request
  const rejectOffer = useCallback(async (requestId, offerId) => {
    if (!currentUser || !requestId || !offerId) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await requestService.rejectOffer(requestId, offerId);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to reject offer');
      console.error('Error rejecting offer:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Mark a request as fulfilled
  const fulfillRequest = useCallback(async (requestId, offerId) => {
    if (!currentUser || !requestId || !offerId) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await requestService.fulfillRequest(requestId, offerId);
      setRequests(prev => prev.map(req => req._id === requestId ? data : req));
      if (currentRequest && currentRequest._id === requestId) {
        setCurrentRequest(data);
      }
      return data;
    } catch (err) {
      setError(err.message || 'Failed to fulfill request');
      console.error('Error fulfilling request:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser, currentRequest]);

  // Clear current request
  const clearCurrentRequest = () => {
    setCurrentRequest(null);
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Setup socket listeners for real-time updates
  useEffect(() => {
    if (!currentUser) return;
    
    // Only set up socket listeners for victims
    if (currentUser.role !== 'victim') {
      return;
    }

    // Connect to socket
    socketService.connect();
    socketService.joinUserRoom(currentUser._id);

    // Listen for request updates
    const handleRequestUpdate = (updatedRequest) => {
      setRequests(prev => prev.map(req => 
        req._id === updatedRequest._id ? updatedRequest : req
      ));
      
      if (currentRequest && currentRequest._id === updatedRequest._id) {
        setCurrentRequest(updatedRequest);
      }
    };

    // Listen for new matches
    const handleNewMatch = (data) => {
      if (data.requestId) {
        // Update the request if it's in our list
        setRequests(prev => prev.map(req => 
          req._id === data.requestId ? { ...req, hasNewMatches: true } : req
        ));
      }
    };

    // Register socket event listeners
    socketService.on('requestUpdated', handleRequestUpdate);
    socketService.on('requestMatched', handleNewMatch);

    // Fetch initial data
    fetchRequests();

    // Cleanup function
    return () => {
      socketService.off('requestUpdated', handleRequestUpdate);
      socketService.off('requestMatched', handleNewMatch);
    };
  }, [currentUser, fetchRequests]);

  const value = useMemo(() => ({
    requests,
    currentRequest,
    loading,
    error,
    fetchRequests,
    fetchRequest,
    createRequest,
    updateRequest,
    deleteRequest,
    cancelRequest,
    getRequestMatches,
    matchRequestWithOffer,
    acceptOffer,
    rejectOffer,
    fulfillRequest,
    clearCurrentRequest,
    clearError
  }), [
    requests,
    currentRequest,
    loading,
    error,
    fetchRequests,
    fetchRequest,
    createRequest,
    updateRequest,
    deleteRequest,
    cancelRequest,
    getRequestMatches,
    acceptOffer,
    rejectOffer,
    fulfillRequest,
    clearCurrentRequest,
    clearError
  ]);

  return (
    <RequestContext.Provider value={value}>
      {children}
    </RequestContext.Provider>
  );
};