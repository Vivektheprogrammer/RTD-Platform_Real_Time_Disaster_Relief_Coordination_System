import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import socketService from '../services/socket';
import { useAuth } from './AuthContext';

// Create context
const MatchingContext = createContext();

// Create API service for matching
const matchingService = {
  findMatches: (requestId) => axios.get(`/api/matching/find/${requestId}`),
  matchRequestOffer: (requestId, offerId) => axios.post(`/api/matching/match`, { requestId, offerId }),
  acceptMatch: (matchId) => axios.put(`/api/matching/accept/${matchId}`),
  rejectMatch: (matchId) => axios.put(`/api/matching/reject/${matchId}`),
  fulfillMatch: (matchId) => axios.put(`/api/matching/fulfill/${matchId}`),
  getMatchesByRequest: (requestId) => axios.get(`/api/matching/request/${requestId}`),
  getMatchesByOffer: (offerId) => axios.get(`/api/matching/offer/${offerId}`),
  getMyMatches: () => axios.get('/api/matching/my-matches')
};

// Provider component
export const MatchingProvider = ({ children }) => {
  const [matches, setMatches] = useState([]);
  const [currentMatches, setCurrentMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  // Clear any errors
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch all matches for the current user
  const fetchMyMatches = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      const response = await matchingService.getMyMatches();
      setMatches(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError(err.response?.data?.message || 'Failed to fetch matches');
      return [];
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  // Fetch matches for a specific request
  const fetchMatchesByRequest = useCallback(async (requestId) => {
    try {
      setLoading(true);
      clearError();
      const response = await matchingService.getMatchesByRequest(requestId);
      setCurrentMatches(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching matches for request:', err);
      setError(err.response?.data?.message || 'Failed to fetch matches for this request');
      return [];
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  // Fetch matches for a specific offer
  const fetchMatchesByOffer = useCallback(async (offerId) => {
    try {
      setLoading(true);
      clearError();
      const response = await matchingService.getMatchesByOffer(offerId);
      setCurrentMatches(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching matches for offer:', err);
      setError(err.response?.data?.message || 'Failed to fetch matches for this offer');
      return [];
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  // Find potential matches for a request
  const findMatches = useCallback(async (requestId) => {
    try {
      setLoading(true);
      clearError();
      const response = await matchingService.findMatches(requestId);
      return response.data;
    } catch (err) {
      console.error('Error finding matches:', err);
      setError(err.response?.data?.message || 'Failed to find potential matches');
      return [];
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  // Create a match between request and offer
  const matchRequestOffer = useCallback(async (requestId, offerId) => {
    try {
      setLoading(true);
      clearError();
      const response = await matchingService.matchRequestOffer(requestId, offerId);
      
      // Update local state
      setMatches(prevMatches => [response.data, ...prevMatches]);
      setCurrentMatches(prevMatches => [response.data, ...prevMatches]);
      
      // Emit socket event
      socketService.connect();
      socketService.emit('match_created', { 
        matchId: response.data._id,
        requestId,
        offerId
      });
      
      return response.data;
    } catch (err) {
      console.error('Error creating match:', err);
      setError(err.response?.data?.message || 'Failed to create match');
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  // Accept a match
  const acceptMatch = useCallback(async (matchId) => {
    try {
      setLoading(true);
      clearError();
      const response = await matchingService.acceptMatch(matchId);
      
      // Update local state
      setMatches(prevMatches => 
        prevMatches.map(match => 
          match._id === matchId ? { ...match, status: 'accepted' } : match
        )
      );
      
      setCurrentMatches(prevMatches => 
        prevMatches.map(match => 
          match._id === matchId ? { ...match, status: 'accepted' } : match
        )
      );
      
      // Emit socket event
      socketService.connect();
      socketService.emit('match_accepted', { 
        matchId,
        match: response.data
      });
      
      return response.data;
    } catch (err) {
      console.error('Error accepting match:', err);
      setError(err.response?.data?.message || 'Failed to accept match');
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  // Reject a match
  const rejectMatch = useCallback(async (matchId) => {
    try {
      setLoading(true);
      clearError();
      const response = await matchingService.rejectMatch(matchId);
      
      // Update local state
      setMatches(prevMatches => 
        prevMatches.map(match => 
          match._id === matchId ? { ...match, status: 'rejected' } : match
        )
      );
      
      setCurrentMatches(prevMatches => 
        prevMatches.map(match => 
          match._id === matchId ? { ...match, status: 'rejected' } : match
        )
      );
      
      // Emit socket event
      socketService.connect();
      socketService.emit('match_rejected', { 
        matchId,
        match: response.data
      });
      
      return response.data;
    } catch (err) {
      console.error('Error rejecting match:', err);
      setError(err.response?.data?.message || 'Failed to reject match');
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  // Fulfill a match
  const fulfillMatch = useCallback(async (matchId) => {
    try {
      setLoading(true);
      clearError();
      const response = await matchingService.fulfillMatch(matchId);
      
      // Update local state
      setMatches(prevMatches => 
        prevMatches.map(match => 
          match._id === matchId ? { ...match, status: 'fulfilled' } : match
        )
      );
      
      setCurrentMatches(prevMatches => 
        prevMatches.map(match => 
          match._id === matchId ? { ...match, status: 'fulfilled' } : match
        )
      );
      
      // Emit socket event
      socketService.connect();
      socketService.emit('match_fulfilled', { 
        matchId,
        match: response.data
      });
      
      return response.data;
    } catch (err) {
      console.error('Error fulfilling match:', err);
      setError(err.response?.data?.message || 'Failed to fulfill match');
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  // Setup socket listeners for real-time updates
  useEffect(() => {
    if (!currentUser || !currentUser.id) return;

    socketService.connect();
    
    // Join appropriate room based on user role
    if (currentUser.role === 'victim') {
      socketService.joinRoom(`victim_${currentUser.id}`);
    } else if (currentUser.role === 'ngo') {
      socketService.joinRoom(`ngo_${currentUser.id}`);
    }
    
    // Listen for match created events
    socketService.on('match_created', (data) => {
      setMatches(prevMatches => {
        // Check if match already exists
        const exists = prevMatches.some(match => match._id === data.match._id);
        if (exists) return prevMatches;
        return [data.match, ...prevMatches];
      });
      
      setCurrentMatches(prevMatches => {
        // Check if match already exists
        const exists = prevMatches.some(match => match._id === data.match._id);
        if (exists) return prevMatches;
        return [data.match, ...prevMatches];
      });
    });

    // Listen for match status update events
    const updateMatchStatus = (data, status) => {
      setMatches(prevMatches => 
        prevMatches.map(match => 
          match._id === data.matchId ? { ...match, status } : match
        )
      );
      
      setCurrentMatches(prevMatches => 
        prevMatches.map(match => 
          match._id === data.matchId ? { ...match, status } : match
        )
      );
    };

    socketService.on('match_accepted', (data) => updateMatchStatus(data, 'accepted'));
    socketService.on('match_rejected', (data) => updateMatchStatus(data, 'rejected'));
    socketService.on('match_fulfilled', (data) => updateMatchStatus(data, 'fulfilled'));

    return () => {
      socketService.off('match_created');
      socketService.off('match_accepted');
      socketService.off('match_rejected');
      socketService.off('match_fulfilled');
      
      if (currentUser.role === 'victim') {
        socketService.leaveRoom(`victim_${currentUser.id}`);
      } else if (currentUser.role === 'ngo') {
        socketService.leaveRoom(`ngo_${currentUser.id}`);
      }
    };
  }, [currentUser]);

  // Calculate statistics based on matches
  const calculateStats = useCallback((matchesList = matches) => {
    const stats = {
      total: matchesList.length,
      pending: 0,
      accepted: 0,
      rejected: 0,
      fulfilled: 0
    };

    matchesList.forEach(match => {
      if (stats[match.status] !== undefined) {
        stats[match.status]++;
      }
    });

    return stats;
  }, [matches]);

  return (
    <MatchingContext.Provider
      value={{
        matches,
        currentMatches,
        loading,
        error,
        fetchMyMatches,
        fetchMatchesByRequest,
        fetchMatchesByOffer,
        findMatches,
        matchRequestOffer,
        acceptMatch,
        rejectMatch,
        fulfillMatch,
        clearError,
        calculateStats
      }}
    >
      {children}
    </MatchingContext.Provider>
  );
};

// Custom hook to use the matching context
export const useMatching = () => {
  const context = useContext(MatchingContext);
  if (!context) {
    throw new Error('useMatching must be used within a MatchingProvider');
  }
  return context;
};