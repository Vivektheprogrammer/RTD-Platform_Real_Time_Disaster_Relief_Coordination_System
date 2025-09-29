import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';

const RegisterGovernment = () => {
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
        role: 'government',
        location: {
          type: 'Point',
          coordinates: [0, 0], // Will be updated with geolocation
          address: data.address
        },
        profileData: {
          agencyName: data.agencyName,
          agencyType: data.agencyType,
          jurisdictionLevel: data.jurisdictionLevel,
          identificationNumber: data.identificationNumber,
          website: data.website || ''
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
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Register as a Government Agency</h2>
      
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
            <label htmlFor="email" className="form-label">Official Email Address *</label>
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
            <label htmlFor="phone" className="form-label">Official Phone Number *</label>
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
          <h3 className="text-lg font-medium text-gray-900">Agency Details</h3>
          
          <div>
            <label htmlFor="agencyName" className="form-label">Agency Name *</label>
            <input
              id="agencyName"
              type="text"
              className={`form-input ${errors.agencyName ? 'border-danger-500' : ''}`}
              {...register('agencyName', { required: 'Agency name is required' })}
            />
            {errors.agencyName && <p className="form-error">{errors.agencyName.message}</p>}
          </div>
          
          <div>
            <label htmlFor="agencyType" className="form-label">Agency Type *</label>
            <select
              id="agencyType"
              className={`form-input ${errors.agencyType ? 'border-danger-500' : ''}`}
              {...register('agencyType', { required: 'Agency type is required' })}
            >
              <option value="">Select agency type</option>
              <option value="emergency">Emergency Management</option>
              <option value="police">Police/Law Enforcement</option>
              <option value="fire">Fire Department</option>
              <option value="medical">Medical/Health Services</option>
              <option value="military">Military</option>
              <option value="administration">Public Administration</option>
              <option value="other">Other</option>
            </select>
            {errors.agencyType && <p className="form-error">{errors.agencyType.message}</p>}
          </div>
          
          <div>
            <label htmlFor="jurisdictionLevel" className="form-label">Jurisdiction Level *</label>
            <select
              id="jurisdictionLevel"
              className={`form-input ${errors.jurisdictionLevel ? 'border-danger-500' : ''}`}
              {...register('jurisdictionLevel', { required: 'Jurisdiction level is required' })}
            >
              <option value="">Select jurisdiction level</option>
              <option value="local">Local/Municipal</option>
              <option value="district">District</option>
              <option value="state">State/Provincial</option>
              <option value="national">National</option>
              <option value="international">International</option>
            </select>
            {errors.jurisdictionLevel && <p className="form-error">{errors.jurisdictionLevel.message}</p>}
          </div>
          
          <div>
            <label htmlFor="identificationNumber" className="form-label">Official ID/Registration Number *</label>
            <input
              id="identificationNumber"
              type="text"
              className={`form-input ${errors.identificationNumber ? 'border-danger-500' : ''}`}
              {...register('identificationNumber', { required: 'Official ID number is required' })}
            />
            {errors.identificationNumber && <p className="form-error">{errors.identificationNumber.message}</p>}
          </div>
          
          <div>
            <label htmlFor="website" className="form-label">Official Website (optional)</label>
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
            <label htmlFor="address" className="form-label">Official Address *</label>
            <textarea
              id="address"
              rows="3"
              className={`form-input ${errors.address ? 'border-danger-500' : ''}`}
              {...register('address', { required: 'Address is required' })}
            ></textarea>
            {errors.address && <p className="form-error">{errors.address.message}</p>}
          </div>
        </div>
        
        <div className="pt-4">
          <p className="text-sm text-gray-500 mb-4">
            Note: Government agency accounts require additional verification by system administrators before full access is granted.
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

export default RegisterGovernment;