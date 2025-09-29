import React from 'react';
import DisasterMap from '../../components/map/DisasterMap';
import { useMap } from '../../contexts/MapContext';

const MapPage = () => {
  const { error, clearError } = useMap();

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Resource Map</h1>
        <p className="text-gray-600 mt-2">
          View all resource requests and offerings on the interactive map. Click on markers to see details.
        </p>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <button 
            onClick={clearError}
            className="mt-2 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <DisasterMap height="70vh" />
      </div>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-3">Map Legend</h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-6 h-6 mr-2 rounded-full bg-red-500"></div>
              <span>Resource Requests</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 mr-2 rounded-full bg-green-500"></div>
              <span>Resource Offerings</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 mr-2 rounded-full bg-blue-300"></div>
              <span>Your Location</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-3">Status Colors</h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-6 h-6 mr-2 rounded-full bg-amber-500"></div>
              <span>Pending</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 mr-2 rounded-full bg-blue-500"></div>
              <span>Matched</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 mr-2 rounded-full bg-green-500"></div>
              <span>Fulfilled</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 mr-2 rounded-full bg-red-500"></div>
              <span>Canceled/Expired</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;