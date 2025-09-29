import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';

const RegisterNGO = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    
    try {
      // Format the data for the API
      const userData = {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        role: 'ngo',
        location: {
          type: 'Point',
          coordinates: [0, 0], // Will be updated with geolocation
          address: data.address
        },
        profileData: {
          organizationName: data.organizationName,
          registrationNumber: data.registrationNumber,
          organizationType: data.organizationType,
          website: data.website || '',
          resourceTypes: getSelectedResourceTypes(data)
        }
      };
      
      // Try to get user's location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            userData.location.coordinates = [
              position.coords.longitude,
              position.coords.latitude
            ];
            registerAndRedirect(userData);
          },
          (error) => {
            console.error('Geolocation error:', error);
            registerAndRedirect(userData);
          }
        );
      } else {
        registerAndRedirect(userData);
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
      setLoading(false);
    }
  };
  
  const getSelectedResourceTypes = (data) => {
    const resourceTypes = [];
    if (data.resourceFood) resourceTypes.push('food');
    if (data.resourceShelter) resourceTypes.push('shelter');
    if (data.resourceMedical) resourceTypes.push('medical');
    if (data.resourceTransport) resourceTypes.push('transport');
    if (data.resourceOther) resourceTypes.push('other');
    return resourceTypes;
  };
  
  const registerAndRedirect = async (userData) => {
    try {
      const result = await registerUser(userData);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error);
        setLoading(false);
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Register as an NGO</h2>
      
      {error && (
        <div className="mb-4 bg-danger-50 border-l-4 border-danger-500 p-4">
          <p className="text-danger-700">{error}</p>
        </div>
      )}
      
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Contact Person Information</h3>
          
          <div>
            <label htmlFor="name" className="form-label">Contact Person Name *</label>
            <input
              id="name"
              type="text"
              className={`form-input ${errors.name ? 'border-danger-500' : ''}`}
              {...register('name', { required: 'Contact person name is required' })}
            />
            {errors.name && <p className="form-error">{errors.name.message}</p>}
          </div>
          
          <div>
            <label htmlFor="email" className="form-label">Email Address *</label>
            <input
              id="email"
              type="email"
              className={`form-input ${errors.email ? 'border-danger-500' : ''}`}
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
            />
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>
          
          <div>
            <label htmlFor="password" className="form-label">Password *</label>
            <input
              id="password"
              type="password"
              className={`form-input ${errors.password ? 'border-danger-500' : ''}`}
              {...register('password', { 
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
            />
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>
          
          <div>
            <label htmlFor="phone" className="form-label">Phone Number *</label>
            <input
              id="phone"
              type="tel"
              className={`form-input ${errors.phone ? 'border-danger-500' : ''}`}
              {...register('phone', { required: 'Phone number is required' })}
            />
            {errors.phone && <p className="form-error">{errors.phone.message}</p>}
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Organization Details</h3>
          
          <div>
            <label htmlFor="organizationName" className="form-label">Organization Name *</label>
            <input
              id="organizationName"
              type="text"
              className={`form-input ${errors.organizationName ? 'border-danger-500' : ''}`}
              {...register('organizationName', { required: 'Organization name is required' })}
            />
            {errors.organizationName && <p className="form-error">{errors.organizationName.message}</p>}
          </div>
          
          <div>
            <label htmlFor="registrationNumber" className="form-label">Registration Number *</label>
            <input
              id="registrationNumber"
              type="text"
              className={`form-input ${errors.registrationNumber ? 'border-danger-500' : ''}`}
              {...register('registrationNumber', { required: 'Registration number is required' })}
            />
            {errors.registrationNumber && <p className="form-error">{errors.registrationNumber.message}</p>}
          </div>
          
          <div>
            <label htmlFor="organizationType" className="form-label">Organization Type *</label>
            <select
              id="organizationType"
              className={`form-input ${errors.organizationType ? 'border-danger-500' : ''}`}
              {...register('organizationType', { required: 'Organization type is required' })}
            >
              <option value="">Select organization type</option>
              <option value="international">International</option>
              <option value="national">National</option>
              <option value="local">Local</option>
              <option value="other">Other</option>
            </select>
            {errors.organizationType && <p className="form-error">{errors.organizationType.message}</p>}
          </div>
          
          <div>
            <label htmlFor="website" className="form-label">Website (optional)</label>
            <input
              id="website"
              type="url"
              className="form-input"
              placeholder="https://"
              {...register('website')}
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Location</h3>
          
          <div>
            <label htmlFor="address" className="form-label">Organization Address *</label>
            <textarea
              id="address"
              rows="3"
              className={`form-input ${errors.address ? 'border-danger-500' : ''}`}
              {...register('address', { required: 'Address is required' })}
            ></textarea>
            {errors.address && <p className="form-error">{errors.address.message}</p>}
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Resource Types</h3>
          <p className="text-sm text-gray-500">Select the types of resources your organization can provide:</p>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                id="resourceFood"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                {...register('resourceFood')}
              />
              <label htmlFor="resourceFood" className="ml-2 block text-sm text-gray-700">Food</label>
            </div>
            
            <div className="flex items-center">
              <input
                id="resourceShelter"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                {...register('resourceShelter')}
              />
              <label htmlFor="resourceShelter" className="ml-2 block text-sm text-gray-700">Shelter</label>
            </div>
            
            <div className="flex items-center">
              <input
                id="resourceMedical"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                {...register('resourceMedical')}
              />
              <label htmlFor="resourceMedical" className="ml-2 block text-sm text-gray-700">Medical</label>
            </div>
            
            <div className="flex items-center">
              <input
                id="resourceTransport"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                {...register('resourceTransport')}
              />
              <label htmlFor="resourceTransport" className="ml-2 block text-sm text-gray-700">Transport</label>
            </div>
            
            <div className="flex items-center">
              <input
                id="resourceOther"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                {...register('resourceOther')}
              />
              <label htmlFor="resourceOther" className="ml-2 block text-sm text-gray-700">Other</label>
            </div>
          </div>
        </div>
        
        <div className="pt-4">
          <p className="text-sm text-gray-500 mb-4">
            Note: Your NGO registration will need to be verified by government authorities before you can provide resources.
          </p>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </div>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterNGO;