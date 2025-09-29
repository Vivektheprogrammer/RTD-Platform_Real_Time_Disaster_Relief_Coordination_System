import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import socketService from '../services/socket';
import { useAuth } from './AuthContext';

// Create context
const MapContext = createContext();

// Create API service for map data
const mapService = {
  getAllRequests: () => axios.get('/requests/map'),
  getAllOffers: () => axios.get('/offers/map'),
  getRequestsByLocation: (lat, lng, radius) => 
    axios.get(`/requests/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
  getOffersByLocation: (lat, lng, radius) => 
    axios.get(`/offers/nearby?lat=${lat}&lng=${lng}&radius=${radius}`)
};

// Provider component
export const MapProvider = ({ children }) => {
  const [mapRequests, setMapRequests] = useState([]);
  const [mapOffers, setMapOffers] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 20.5937, lng: 78.9629 }); // Default to center of India
  const [mapZoom, setMapZoom] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  // Clear any errors
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get user's current location
  const getUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setMapCenter({ lat: latitude, lng: longitude });
          setMapZoom(12); // Zoom in when we get user location
        },
        (err) => {
          console.error('Error getting location:', err);
          setError('Unable to retrieve your location. Please enable location services.');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  }, []);

  // Fetch all requests for the map
  const fetchAllRequests = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      const response = await mapService.getAllRequests();
      setMapRequests(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching map requests:', err);
      setError(err.response?.data?.message || 'Failed to fetch requests for map');
      return [];
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  // Fetch all offers for the map
  const fetchAllOffers = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      const response = await mapService.getAllOffers();
      setMapOffers(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching map offers:', err);
      setError(err.response?.data?.message || 'Failed to fetch offers for map');
      return [];
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  // Fetch requests by location and radius
  const fetchNearbyRequests = useCallback(async (lat, lng, radius = 10) => {
    try {
      setLoading(true);
      clearError();
      const response = await mapService.getRequestsByLocation(lat, lng, radius);
      return response.data;
    } catch (err) {
      console.error('Error fetching nearby requests:', err);
      setError(err.response?.data?.message || 'Failed to fetch nearby requests');
      return [];
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  // Fetch offers by location and radius
  const fetchNearbyOffers = useCallback(async (lat, lng, radius = 10) => {
    try {
      setLoading(true);
      clearError();
      const response = await mapService.getOffersByLocation(lat, lng, radius);
      return response.data;
    } catch (err) {
      console.error('Error fetching nearby offers:', err);
      setError(err.response?.data?.message || 'Failed to fetch nearby offers');
      return [];
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  // Select an item on the map
  const selectMapItem = useCallback((item) => {
    setSelectedItem(item);
  }, []);

  // Clear selected item
  const clearSelectedItem = useCallback(() => {
    setSelectedItem(null);
  }, []);

  // Update map center and zoom
  const updateMapView = useCallback((center, zoom) => {
    if (center) setMapCenter(center);
    if (zoom) setMapZoom(zoom);
  }, []);

  // Setup socket listeners for real-time map updates
  useEffect(() => {
    socketService.connect();
    
    // Join map updates room
    socketService.joinRoom('map_updates');
    
    // Listen for new request events
    socketService.on('new_request', (data) => {
      setMapRequests(prevRequests => {
        // Check if request already exists
        const exists = prevRequests.some(req => req._id === data.request._id);
        if (exists) return prevRequests;
        return [...prevRequests, data.request];
      });
    });

    // Listen for request updated events
    socketService.on('request_updated', (data) => {
      setMapRequests(prevRequests => 
        prevRequests.map(req => 
          req._id === data.requestId ? { ...req, ...data.request } : req
        )
      );
    });

    // Listen for request canceled/fulfilled events
    socketService.on('request_status_changed', (data) => {
      setMapRequests(prevRequests => 
        prevRequests.map(req => 
          req._id === data.requestId ? { ...req, status: data.status } : req
        )
      );
    });

    // Listen for new offer events
    socketService.on('new_offer', (data) => {
      setMapOffers(prevOffers => {
        // Check if offer already exists
        const exists = prevOffers.some(offer => offer._id === data.offer._id);
        if (exists) return prevOffers;
        return [...prevOffers, data.offer];
      });
    });

    // Listen for offer updated events
    socketService.on('offer_updated', (data) => {
      setMapOffers(prevOffers => 
        prevOffers.map(offer => 
          offer._id === data.offerId ? { ...offer, ...data.offer } : offer
        )
      );
    });

    // Listen for offer expired/fulfilled events
    socketService.on('offer_status_changed', (data) => {
      setMapOffers(prevOffers => 
        prevOffers.map(offer => 
          offer._id === data.offerId ? { ...offer, status: data.status } : offer
        )
      );
    });

    return () => {
      socketService.off('new_request');
      socketService.off('request_updated');
      socketService.off('request_status_changed');
      socketService.off('new_offer');
      socketService.off('offer_updated');
      socketService.off('offer_status_changed');
      socketService.leaveRoom('map_updates');
    };
  }, []);

  // Get user location on initial load - only for map pages
  // useEffect(() => {
  //   getUserLocation();
  // }, [getUserLocation]);

  return (
    <MapContext.Provider
      value={{
        mapRequests,
        mapOffers,
        selectedItem,
        userLocation,
        mapCenter,
        mapZoom,
        loading,
        error,
        fetchAllRequests,
        fetchAllOffers,
        fetchNearbyRequests,
        fetchNearbyOffers,
        selectMapItem,
        clearSelectedItem,
        updateMapView,
        getUserLocation,
        clearError
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

// Custom hook to use the map context
export const useMap = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
};