import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';

const RegisterVictim = () => {
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
        role: 'victim',
        location: {
          type: 'Point',
          coordinates: [0, 0], // Will be updated with geolocation
          address: data.address
        },
        profileData: {
          familySize: parseInt(data.familySize),
          specialNeeds: data.specialNeeds === 'yes',
          specialNeedsDetails: data.specialNeedsDetails || '',
          emergencyContact: {
            name: data.emergencyContactName,
            phone: data.emergencyContactPhone,
            relation: data.emergencyContactRelation
          }
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
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Register as a Victim</h2>
      
      {error && (
        <div className="mb-4 bg-danger-50 border-l-4 border-danger-500 p-4">
          <p className="text-danger-700">{error}</p>
        </div>
      )}
      
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
          
          <div>
            <label htmlFor="name" className="form-label">Full Name *</label>
            <input
              id="name"
              type="text"
              className={`form-input ${errors.name ? 'border-danger-500' : ''}`}
              {...register('name', { required: 'Name is required' })}
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
          <h3 className="text-lg font-medium text-gray-900">Location</h3>
          
          <div>
            <label htmlFor="address" className="form-label">Current Address *</label>
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
          <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
          
          <div>
            <label htmlFor="familySize" className="form-label">Family Size (including yourself) *</label>
            <input
              id="familySize"
              type="number"
              min="1"
              className={`form-input ${errors.familySize ? 'border-danger-500' : ''}`}
              {...register('familySize', { 
                required: 'Family size is required',
                min: {
                  value: 1,
                  message: 'Family size must be at least 1'
                }
              })}
            />
            {errors.familySize && <p className="form-error">{errors.familySize.message}</p>}
          </div>
          
          <div>
            <label className="form-label">Do you or any family member have special needs?</label>
            <div className="mt-1 space-y-2">
              <div className="flex items-center">
                <input
                  id="specialNeeds-yes"
                  type="radio"
                  value="yes"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  {...register('specialNeeds')}
                />
                <label htmlFor="specialNeeds-yes" className="ml-2 block text-sm text-gray-700">Yes</label>
              </div>
              <div className="flex items-center">
                <input
                  id="specialNeeds-no"
                  type="radio"
                  value="no"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  {...register('specialNeeds')}
                />
                <label htmlFor="specialNeeds-no" className="ml-2 block text-sm text-gray-700">No</label>
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="specialNeedsDetails" className="form-label">If yes, please specify</label>
            <textarea
              id="specialNeedsDetails"
              rows="2"
              className="form-input"
              {...register('specialNeedsDetails')}
            ></textarea>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Emergency Contact</h3>
          
          <div>
            <label htmlFor="emergencyContactName" className="form-label">Contact Name *</label>
            <input
              id="emergencyContactName"
              type="text"
              className={`form-input ${errors.emergencyContactName ? 'border-danger-500' : ''}`}
              {...register('emergencyContactName', { required: 'Emergency contact name is required' })}
            />
            {errors.emergencyContactName && <p className="form-error">{errors.emergencyContactName.message}</p>}
          </div>
          
          <div>
            <label htmlFor="emergencyContactPhone" className="form-label">Contact Phone *</label>
            <input
              id="emergencyContactPhone"
              type="tel"
              className={`form-input ${errors.emergencyContactPhone ? 'border-danger-500' : ''}`}
              {...register('emergencyContactPhone', { required: 'Emergency contact phone is required' })}
            />
            {errors.emergencyContactPhone && <p className="form-error">{errors.emergencyContactPhone.message}</p>}
          </div>
          
          <div>
            <label htmlFor="emergencyContactRelation" className="form-label">Relationship *</label>
            <input
              id="emergencyContactRelation"
              type="text"
              className={`form-input ${errors.emergencyContactRelation ? 'border-danger-500' : ''}`}
              {...register('emergencyContactRelation', { required: 'Relationship is required' })}
            />
            {errors.emergencyContactRelation && <p className="form-error">{errors.emergencyContactRelation.message}</p>}
          </div>
        </div>
        
        <div>
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

export default RegisterVictim;