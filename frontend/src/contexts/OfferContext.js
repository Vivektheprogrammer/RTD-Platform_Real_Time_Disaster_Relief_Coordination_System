import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { offerService } from '../services/api';
import socketService from '../services/socket';
import { useAuth } from './AuthContext';

// Create context
const OfferContext = createContext();

// Provider component
export const OfferProvider = ({ children }) => {
  const [offers, setOffers] = useState([]);
  const [currentOffer, setCurrentOffer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  // Clear any errors
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch all offers for the current NGO
  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      const response = await offerService.getMyOffers();
      setOffers(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching offers:', err);
      setError(err.response?.data?.message || 'Failed to fetch offers');
      return [];
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  // Fetch a single offer by ID
  const fetchOffer = useCallback(async (offerId) => {
    try {
      setLoading(true);
      clearError();
      const response = await offerService.getOfferById(offerId);
      setCurrentOffer(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching offer:', err);
      setError(err.response?.data?.message || 'Failed to fetch offer details');
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  // Create a new offer
  const createOffer = useCallback(async (offerData) => {
    try {
      setLoading(true);
      clearError();
      const response = await offerService.createOffer(offerData);
      
      // Update local state
      setOffers(prevOffers => [response.data, ...prevOffers]);
      
      // Emit socket event only if currentUser exists
      if (currentUser && currentUser.id) {
        socketService.connect();
        socketService.emit('new_offer', { 
          offerId: response.data._id,
          ngoId: currentUser.id
        });
      }
      
      return response.data;
    } catch (err) {
      console.error('Error creating offer:', err);
      setError(err.response?.data?.message || 'Failed to create offer');
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearError, currentUser && currentUser.id]);

  // Update an existing offer
  const updateOffer = useCallback(async (offerId, offerData) => {
    try {
      setLoading(true);
      clearError();
      const response = await offerService.updateOffer(offerId, offerData);
      // Update local state
      setOffers(prevOffers => 
        prevOffers.map(offer => 
          offer._id === offerId ? response.data : offer
        )
      );
      if (currentOffer && currentOffer._id === offerId) {
        setCurrentOffer(response.data);
      }
      // Emit socket event
      if (currentUser && currentUser.id) {
        socketService.connect();
        socketService.emit('offer_updated', { 
          offerId,
          ngoId: currentUser.id,
          offer: response.data
        });
      }
      return response.data;
    } catch (err) {
      console.error('Error updating offer:', err);
      setError(err.response?.data?.message || 'Failed to update offer');
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearError, currentOffer, currentUser && currentUser.id]);

  // Delete an offer
  const deleteOffer = useCallback(async (offerId) => {
    try {
      setLoading(true);
      clearError();
      await offerService.deleteOffer(offerId);
      // Update local state
      setOffers(prevOffers => prevOffers.filter(offer => offer._id !== offerId));
      if (currentOffer && currentOffer._id === offerId) {
        setCurrentOffer(null);
      }
      return true;
    } catch (err) {
      console.error('Error deleting offer:', err);
      setError(err.response?.data?.message || 'Failed to delete offer');
      return false;
    } finally {
      setLoading(false);
    }
  }, [clearError, currentOffer]);

  // Expire an offer
  const expireOffer = useCallback(async (offerId) => {
    try {
      setLoading(true);
      clearError();
      const response = await offerService.expireOffer(offerId);
      
      // Update local state
      setOffers(prevOffers => 
        prevOffers.map(offer => 
          offer._id === offerId ? { ...offer, status: 'expired' } : offer
        )
      );
      
      if (currentOffer && currentOffer._id === offerId) {
        setCurrentOffer({ ...currentOffer, status: 'expired' });
      }
      
      // Emit socket event
  if (currentUser && currentUser.id) {
        socketService.connect();
        socketService.emit('offer_expired', { 
          offerId,
          ngoId: currentUser.id
        });
      }
      
      return response.data;
    } catch (err) {
      console.error('Error expiring offer:', err);
      setError(err.response?.data?.message || 'Failed to expire offer');
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearError, currentOffer, currentUser && currentUser.id]);

  // Fulfill an offer
  const fulfillOffer = useCallback(async (offerId) => {
    try {
      setLoading(true);
      clearError();
      const response = await offerService.fulfillOffer(offerId);
      
      // Update local state
      setOffers(prevOffers => 
        prevOffers.map(offer => 
          offer._id === offerId ? { ...offer, status: 'fulfilled' } : offer
        )
      );
      
      if (currentOffer && currentOffer._id === offerId) {
        setCurrentOffer({ ...currentOffer, status: 'fulfilled' });
      }
      
      // Emit socket event
  if (currentUser && currentUser.id) {
        socketService.connect();
        socketService.emit('offer_fulfilled', { 
          offerId,
          ngoId: currentUser.id
        });
      }
      
      return response.data;
    } catch (err) {
      console.error('Error fulfilling offer:', err);
      setError(err.response?.data?.message || 'Failed to fulfill offer');
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearError, currentOffer, currentUser && currentUser.id]);

  // Setup socket listeners for real-time updates
  useEffect(() => {
  if (!currentUser || !currentUser.id) return;
  socketService.connect();
  socketService.joinRoom(`ngo_${currentUser.id}`);
    
    // Listen for offer matched events
    socketService.on('offer_matched', (data) => {
      setOffers(prevOffers => 
        prevOffers.map(offer => 
          offer._id === data.offerId ? { ...offer, ...data.offer } : offer
        )
      );
      
      if (currentOffer && currentOffer._id === data.offerId) {
        setCurrentOffer(prev => ({ ...prev, ...data.offer }));
      }
    });

    // Listen for offer updated events
    socketService.on('offer_updated', (data) => {
      setOffers(prevOffers => 
        prevOffers.map(offer => 
          offer._id === data.offerId ? { ...offer, ...data.offer } : offer
        )
      );
      
      if (currentOffer && currentOffer._id === data.offerId) {
        setCurrentOffer(prev => ({ ...prev, ...data.offer }));
      }
    });

    // Listen for offer expired events
    socketService.on('offer_expired', (data) => {
      setOffers(prevOffers => 
        prevOffers.map(offer => 
          offer._id === data.offerId ? { ...offer, status: 'expired' } : offer
        )
      );
      
      if (currentOffer && currentOffer._id === data.offerId) {
        setCurrentOffer(prev => ({ ...prev, status: 'expired' }));
      }
    });

    // Listen for offer fulfilled events
    socketService.on('offer_fulfilled', (data) => {
      setOffers(prevOffers => 
        prevOffers.map(offer => 
          offer._id === data.offerId ? { ...offer, status: 'fulfilled' } : offer
        )
      );
      
      if (currentOffer && currentOffer._id === data.offerId) {
        setCurrentOffer(prev => ({ ...prev, status: 'fulfilled' }));
      }
    });

    return () => {
      socketService.off('offer_matched');
      socketService.off('offer_updated');
      socketService.off('offer_expired');
      socketService.off('offer_fulfilled');
      if (currentUser && currentUser.id) {
        socketService.leaveRoom(`ngo_${currentUser.id}`);
      }
    };
  }, [currentUser && currentUser.id]);

  // Calculate statistics based on offers
  const calculateStats = useCallback((offersList = offers) => {
    const stats = {
      total: offersList.length,
      pending: 0,
      matched: 0,
      fulfilled: 0,
      expired: 0
    };

    offersList.forEach(offer => {
      if (stats[offer.status] !== undefined) {
        stats[offer.status]++;
      }
    });

    return stats;
  }, [offers]);

  return (
    <OfferContext.Provider
      value={{
        offers,
        currentOffer,
        loading,
        error,
        fetchOffers,
        fetchOffer,
        createOffer,
        updateOffer,
        deleteOffer,
        expireOffer,
        fulfillOffer,
        clearError,
        calculateStats
      }}
    >
      {children}
    </OfferContext.Provider>
  );
};

// Custom hook to use the offer context
export const useOffer = () => {
  const context = useContext(OfferContext);
  if (!context) {
    throw new Error('useOffer must be used within an OfferProvider');
  }
  return context;
};