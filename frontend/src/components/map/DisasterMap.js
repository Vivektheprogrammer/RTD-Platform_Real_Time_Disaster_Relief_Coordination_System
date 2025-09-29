import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMap as useMapContext } from '../../contexts/MapContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom icons for different types
const requestIcon = new L.Icon({
  iconUrl: '/icons/request-marker.svg', // You'll need to create these SVG icons
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const offerIcon = new L.Icon({
  iconUrl: '/icons/offer-marker.svg',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const userLocationIcon = new L.Icon({
  iconUrl: '/icons/user-location.svg',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Component to update map view when center/zoom changes
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center && zoom) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
};

// Main map component
const DisasterMap = ({ height = '500px' }) => {
  const mapRef = useRef(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { 
    mapRequests, 
    mapOffers, 
    selectedItem,
    userLocation, 
    mapCenter, 
    mapZoom,
    loading,
    fetchAllRequests,
    fetchAllOffers,
    selectMapItem,
    clearSelectedItem,
    updateMapView
  } = useMapContext();
  
  const [showRequests, setShowRequests] = useState(true);
  const [showOffers, setShowOffers] = useState(true);
  
  // Fetch map data on component mount
  useEffect(() => {
    fetchAllRequests();
    fetchAllOffers();
  }, [fetchAllRequests, fetchAllOffers]);
  
  // Handle marker click
  const handleMarkerClick = (item, type) => {
    selectMapItem({ ...item, type });
  };
  
  // Navigate to detail page
  const navigateToDetail = (item, type) => {
    if (type === 'request') {
      navigate(`/victim/requests/${item._id}`);
    } else if (type === 'offer') {
      navigate(`/ngo/offers/${item._id}`);
    }
  };
  
  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FFC107'; // amber
      case 'matched': return '#2196F3'; // blue
      case 'fulfilled': return '#4CAF50'; // green
      case 'canceled': 
      case 'expired': return '#F44336'; // red
      default: return '#9E9E9E'; // grey
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  return (
    <div className="relative">
      <MapContainer 
        center={mapCenter} 
        zoom={mapZoom} 
        style={{ height, width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Update map when center/zoom changes */}
        <MapUpdater center={mapCenter} zoom={mapZoom} />
        
        {/* User location marker */}
        {userLocation && (
          <Marker 
            position={[userLocation.lat, userLocation.lng]}
            icon={userLocationIcon}
          >
            <Popup>
              <div className="text-center">
                <p className="font-semibold">Your Location</p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Request markers */}
        {showRequests && mapRequests.map(request => (
          <Marker 
            key={`request-${request._id}`}
            position={[request.location.coordinates[1], request.location.coordinates[0]]}
            icon={requestIcon}
            eventHandlers={{
              click: () => handleMarkerClick(request, 'request')
            }}
          >
            <Popup>
              <div className="p-2">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-lg">{request.resourceType}</h3>
                  <span 
                    className="px-2 py-1 rounded text-xs text-white"
                    style={{ backgroundColor: getStatusColor(request.status) }}
                  >
                    {request.status}
                  </span>
                </div>
                <p className="mb-1"><span className="font-semibold">Quantity:</span> {request.quantity}</p>
                <p className="mb-1"><span className="font-semibold">Urgency:</span> {request.urgency}</p>
                <p className="mb-1"><span className="font-semibold">Created:</span> {formatDate(request.createdAt)}</p>
                <p className="mb-3"><span className="font-semibold">Address:</span> {request.address}</p>
                <button
                  onClick={() => navigateToDetail(request, 'request')}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-sm"
                >
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Offer markers */}
        {showOffers && mapOffers.map(offer => (
          <Marker 
            key={`offer-${offer._id}`}
            position={[offer.location.coordinates[1], offer.location.coordinates[0]]}
            icon={offerIcon}
            eventHandlers={{
              click: () => handleMarkerClick(offer, 'offer')
            }}
          >
            <Popup>
              <div className="p-2">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-lg">{offer.resourceType}</h3>
                  <span 
                    className="px-2 py-1 rounded text-xs text-white"
                    style={{ backgroundColor: getStatusColor(offer.status) }}
                  >
                    {offer.status}
                  </span>
                </div>
                <p className="mb-1"><span className="font-semibold">Quantity:</span> {offer.quantity}</p>
                <p className="mb-1"><span className="font-semibold">Created:</span> {formatDate(offer.createdAt)}</p>
                <p className="mb-1"><span className="font-semibold">NGO:</span> {offer.ngo?.name || 'Unknown'}</p>
                <p className="mb-3"><span className="font-semibold">Address:</span> {offer.address}</p>
                <button
                  onClick={() => navigateToDetail(offer, 'offer')}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded text-sm"
                >
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Map controls */}
      <div className="absolute top-4 right-4 z-[1000] bg-white p-2 rounded shadow-md">
        <div className="flex flex-col space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showRequests}
              onChange={() => setShowRequests(!showRequests)}
              className="form-checkbox h-4 w-4 text-blue-600"
            />
            <span className="text-sm">Show Requests</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showOffers}
              onChange={() => setShowOffers(!showOffers)}
              className="form-checkbox h-4 w-4 text-green-600"
            />
            <span className="text-sm">Show Offers</span>
          </label>
        </div>
      </div>
      
      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-[1001]">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <p className="text-lg font-semibold">Loading map data...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisasterMap;