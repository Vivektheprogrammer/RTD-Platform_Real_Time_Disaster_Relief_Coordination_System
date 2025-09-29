import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useRequest } from '../../contexts/RequestContext';
import { useAuth } from '../../contexts/AuthContext';

const CreateRequest = () => {
  const { createRequest, loading, error, clearError } = useRequest();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, setValue } = useForm();
  const [position, setPosition] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [addressFromCoords, setAddressFromCoords] = useState('');

  // Resource types available for request
  const resourceTypes = [
    'food',
    'shelter', 
    'medical',
    'transport',
    'other'
  ];

  // Get current location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setPosition({ latitude, longitude });
          setValue('latitude', latitude);
          setValue('longitude', longitude);
          
          // Reverse geocode to get address
          fetchAddressFromCoords(latitude, longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('Unable to get your current location. Please enter your address manually.');
        },
        { enableHighAccuracy: true }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser. Please enter your address manually.');
    }
  }, [setValue]);

  // Fetch address from coordinates using OpenStreetMap Nominatim API
  const fetchAddressFromCoords = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        setAddressFromCoords(data.display_name);
        setValue('address', data.display_name);
      }
    } catch (error) {
      console.error('Error fetching address:', error);
    }
  };

  // Handle form submission
  const onSubmit = async (data) => {
    // Clear any previous errors
    clearError();
    
    // Prepare request data
    const requestData = {
      requestType: data.type,
      title: `${data.type.charAt(0).toUpperCase() + data.type.slice(1)} assistance needed`,
      description: data.description,
      quantity: parseInt(data.peopleCount, 10) || 1,
      urgency: data.urgency,
      location: {
        type: 'Point',
        coordinates: [parseFloat(data.longitude), parseFloat(data.latitude)],
        address: data.address
      }
    };
    
    try {
      // Create the request
      const createdRequest = await createRequest(requestData);
      
      if (createdRequest) {
        // Redirect to the request details page
        navigate(`/victim/requests/${createdRequest._id}`);
      }
    } catch (err) {
      console.error('Error creating request:', err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Resource Request</h1>
        
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
        
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-md rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resource Type */}
            <div className="col-span-1">
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Resource Type *
              </label>
              <select
                id="type"
                {...register('type', { required: 'Resource type is required' })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">Select a resource type</option>
                {resourceTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>

            {/* Urgency Level */}
            <div className="col-span-1">
              <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-1">
                Urgency Level *
              </label>
              <select
                id="urgency"
                {...register('urgency', { required: 'Urgency level is required' })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">Select urgency level</option>
                <option value="low">Low - Within a few days</option>
                <option value="medium">Medium - Within 24 hours</option>
                <option value="high">High - Within a few hours</option>
                <option value="critical">Critical - Immediate assistance needed</option>
              </select>
              {errors.urgency && (
                <p className="mt-1 text-sm text-red-600">{errors.urgency.message}</p>
              )}
            </div>

            {/* Number of People */}
            <div className="col-span-1">
              <label htmlFor="peopleCount" className="block text-sm font-medium text-gray-700 mb-1">
                Number of People Affected *
              </label>
              <input
                type="number"
                id="peopleCount"
                min="1"
                {...register('peopleCount', { 
                  required: 'Number of people is required',
                  min: { value: 1, message: 'Minimum value is 1' } 
                })}
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
              {errors.peopleCount && (
                <p className="mt-1 text-sm text-red-600">{errors.peopleCount.message}</p>
              )}
            </div>

            {/* Location Fields */}
            <div className="col-span-2">
              <fieldset className="border border-gray-200 rounded-md p-4">
                <legend className="text-sm font-medium text-gray-700 px-2">Location Information</legend>
                
                {locationError && (
                  <div className="mb-4 text-sm text-amber-600">
                    <p>{locationError}</p>
                  </div>
                )}

                {position && (
                  <div className="mb-4 text-sm text-green-600">
                    <p>Location detected successfully!</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
                      Latitude *
                    </label>
                    <input
                      type="text"
                      id="latitude"
                      {...register('latitude', { required: 'Latitude is required' })}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      readOnly={!!position}
                    />
                  </div>
                  <div>
                    <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
                      Longitude *
                    </label>
                    <input
                      type="text"
                      id="longitude"
                      {...register('longitude', { required: 'Longitude is required' })}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      readOnly={!!position}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    id="address"
                    {...register('address', { required: 'Address is required' })}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    placeholder="Street, City, State, Country"
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                  )}
                </div>
              </fieldset>
            </div>

            {/* Description */}
            <div className="col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                id="description"
                rows="4"
                {...register('description', { 
                  required: 'Description is required',
                  minLength: { value: 10, message: 'Description should be at least 10 characters' } 
                })}
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                placeholder="Please describe your situation and what you need..."
              ></textarea>
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Additional Information */}
            <div className="col-span-2">
              <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 mb-1">
                Additional Information (Optional)
              </label>
              <textarea
                id="additionalInfo"
                rows="3"
                {...register('additionalInfo')}
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                placeholder="Any other details that might help responders..."
              ></textarea>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/victim/dashboard')}
              className="mr-4 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRequest;