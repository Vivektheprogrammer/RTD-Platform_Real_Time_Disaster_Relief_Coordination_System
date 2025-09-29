import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { offerService } from '../../services/api';
import socketService from '../../services/socket';
import { useAuth } from '../../contexts/AuthContext';

const CreateOffer = () => {
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [locationError, setLocationError] = useState('');
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Resource types available for offering (must match backend enum)
  const resourceTypes = [
    { value: 'food', label: 'Food' },
    { value: 'shelter', label: 'Shelter' },
    { value: 'medical', label: 'Medical' },
    { value: 'transport', label: 'Transport' },
    { value: 'other', label: 'Other' }
  ];

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Set form values using React Hook Form's setValue
        setValue('latitude', latitude.toString());
        setValue('longitude', longitude.toString());
        
        // Try to get address from coordinates using reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          if (data && data.display_name) {
            setValue('address', data.display_name);
          }
        } catch (err) {
          console.error('Error getting address:', err);
          // Continue without setting address
        }
      },
      (error) => {
        setLocationError(`Error getting location: ${error.message}`);
      }
    );
  };

  // Handle form submission
  const onSubmit = async (data) => {
    // Prevent multiple submissions
    if (loading) {
      console.log('Already submitting, ignoring...');
      return;
    }

    try {
      console.log('Form data received:', data);
      setLoading(true);
      setError(null);

      // Validate required fields manually
      if (!data.type || !data.description || !data.quantity || !data.expiresIn || !data.latitude || !data.longitude || !data.address) {
        const missingFields = [];
        if (!data.type) missingFields.push('Resource Type');
        if (!data.description) missingFields.push('Description');
        if (!data.quantity) missingFields.push('Quantity');
        if (!data.expiresIn) missingFields.push('Expires In');
        if (!data.latitude) missingFields.push('Latitude');
        if (!data.longitude) missingFields.push('Longitude');
        if (!data.address) missingFields.push('Address');
        
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        setLoading(false);
        return;
      }

      // Prepare offer data
      const offerData = {
        type: data.type,
        description: data.description,
        quantity: parseInt(data.quantity, 10),
        expiresIn: parseInt(data.expiresIn, 10),
        location: {
          type: 'Point',
          coordinates: [parseFloat(data.longitude), parseFloat(data.latitude)],
          address: data.address
        },
        additionalInfo: data.additionalInfo || ''
      };

      console.log('Sending offer data:', offerData);

      // Create the offer
      const response = await offerService.createOffer(offerData);
      
      console.log('Offer created successfully:', response);
      
      // Emit socket event for real-time updates
      socketService.connect();
      socketService.emit('new_offer', { 
        offerId: response.data?._id || response._id,
        ngoId: currentUser.id
      });

      // Reset form and navigate to dashboard
      reset();
      navigate('/ngo/dashboard');
    } catch (err) {
      console.error('Error creating offer:', err);
      console.error('Error response:', err.response?.data);
      
      if (err.response?.data?.errors) {
        // Handle validation errors
        const validationErrors = err.response.data.errors;
        let errorMessage = 'Validation failed:\n';
        Object.keys(validationErrors).forEach(field => {
          errorMessage += `- ${field}: ${validationErrors[field]}\n`;
        });
        setError(errorMessage);
      } else {
        setError(err.response?.data?.msg || 'Failed to create offer. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
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
          <h1 className="text-3xl font-bold text-gray-900">Create Resource Offer</h1>
        </div>

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
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>

            {/* Quantity */}
            <div className="col-span-1">
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                id="quantity"
                min="1"
                {...register('quantity', { 
                  required: 'Quantity is required',
                  min: { value: 1, message: 'Minimum value is 1' } 
                })}
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
              )}
            </div>

            {/* Expires In */}
            <div className="col-span-1">
              <label htmlFor="expiresIn" className="block text-sm font-medium text-gray-700 mb-1">
                Expires In (hours) *
              </label>
              <input
                type="number"
                id="expiresIn"
                min="1"
                max="168"
                {...register('expiresIn', { 
                  required: 'Expiration time is required',
                  min: { value: 1, message: 'Minimum value is 1 hour' },
                  max: { value: 168, message: 'Maximum value is 168 hours (7 days)' } 
                })}
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
              {errors.expiresIn && (
                <p className="mt-1 text-sm text-red-600">{errors.expiresIn.message}</p>
              )}
            </div>

            {/* Location Fields */}
            <div className="col-span-2">
              <fieldset className="border border-gray-200 rounded-md p-4">
                <legend className="text-sm font-medium text-gray-700 px-2">Location Information</legend>
                
                <div className="flex justify-end mb-4">
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Use Current Location
                  </button>
                </div>
                
                {locationError && (
                  <div className="mb-4 text-sm text-amber-600">
                    <p>{locationError}</p>
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
                    />
                    {errors.latitude && (
                      <p className="mt-1 text-sm text-red-600">{errors.latitude.message}</p>
                    )}
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
                    />
                    {errors.longitude && (
                      <p className="mt-1 text-sm text-red-600">{errors.longitude.message}</p>
                    )}
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
                placeholder="Please describe the resources you are offering..."
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
                placeholder="Any other details that might help match your resources with those in need..."
              ></textarea>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/ngo/dashboard')}
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
                  Creating...
                </>
              ) : (
                'Create Offer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOffer;