import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';

const RegisterVolunteer = () => {
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
        role: 'volunteer',
        location: {
          type: 'Point',
          coordinates: [0, 0], // Will be updated with geolocation
          address: data.address
        },
        profileData: {
          skills: getSelectedSkills(data),
          availability: data.availability,
          transportMode: data.transportMode,
          emergencyContact: {
            name: data.emergencyContactName,
            phone: data.emergencyContactPhone,
            relationship: data.emergencyContactRelationship
          },
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
  
  const getSelectedSkills = (data) => {
    const skills = [];
    if (data.skillMedical) skills.push('medical');
    if (data.skillRescue) skills.push('rescue');
    if (data.skillLogistics) skills.push('logistics');
    if (data.skillCommunication) skills.push('communication');
    if (data.skillTechnical) skills.push('technical');
    if (data.skillOther) skills.push('other');
    return skills;
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
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Register as a Volunteer</h2>
      
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
              {...register('name', { required: 'Full name is required' })}
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
            <label htmlFor="address" className="form-label">Address *</label>
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
          <h3 className="text-lg font-medium text-gray-900">Skills & Availability</h3>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-700 font-medium">Skills (select all that apply)</p>
            
            <div className="flex items-center">
              <input
                id="skillMedical"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                {...register('skillMedical')}
              />
              <label htmlFor="skillMedical" className="ml-2 block text-sm text-gray-700">Medical/First Aid</label>
            </div>
            
            <div className="flex items-center">
              <input
                id="skillRescue"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                {...register('skillRescue')}
              />
              <label htmlFor="skillRescue" className="ml-2 block text-sm text-gray-700">Search & Rescue</label>
            </div>
            
            <div className="flex items-center">
              <input
                id="skillLogistics"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                {...register('skillLogistics')}
              />
              <label htmlFor="skillLogistics" className="ml-2 block text-sm text-gray-700">Logistics & Distribution</label>
            </div>
            
            <div className="flex items-center">
              <input
                id="skillCommunication"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                {...register('skillCommunication')}
              />
              <label htmlFor="skillCommunication" className="ml-2 block text-sm text-gray-700">Communication</label>
            </div>
            
            <div className="flex items-center">
              <input
                id="skillTechnical"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                {...register('skillTechnical')}
              />
              <label htmlFor="skillTechnical" className="ml-2 block text-sm text-gray-700">Technical/IT</label>
            </div>
            
            <div className="flex items-center">
              <input
                id="skillOther"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                {...register('skillOther')}
              />
              <label htmlFor="skillOther" className="ml-2 block text-sm text-gray-700">Other</label>
            </div>
          </div>
          
          <div>
            <label htmlFor="availability" className="form-label">Availability *</label>
            <select
              id="availability"
              className={`form-input ${errors.availability ? 'border-danger-500' : ''}`}
              {...register('availability', { required: 'Availability is required' })}
            >
              <option value="">Select availability</option>
              <option value="fulltime">Full-time</option>
              <option value="parttime">Part-time</option>
              <option value="weekends">Weekends only</option>
              <option value="oncall">On-call</option>
            </select>
            {errors.availability && <p className="form-error">{errors.availability.message}</p>}
          </div>
          
          <div>
            <label htmlFor="transportMode" className="form-label">Mode of Transport *</label>
            <select
              id="transportMode"
              className={`form-input ${errors.transportMode ? 'border-danger-500' : ''}`}
              {...register('transportMode', { required: 'Mode of transport is required' })}
            >
              <option value="">Select transport mode</option>
              <option value="car">Car</option>
              <option value="motorcycle">Motorcycle</option>
              <option value="bicycle">Bicycle</option>
              <option value="public">Public Transport</option>
              <option value="none">None</option>
            </select>
            {errors.transportMode && <p className="form-error">{errors.transportMode.message}</p>}
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
            <label htmlFor="emergencyContactRelationship" className="form-label">Relationship *</label>
            <input
              id="emergencyContactRelationship"
              type="text"
              className={`form-input ${errors.emergencyContactRelationship ? 'border-danger-500' : ''}`}
              {...register('emergencyContactRelationship', { required: 'Relationship is required' })}
            />
            {errors.emergencyContactRelationship && <p className="form-error">{errors.emergencyContactRelationship.message}</p>}
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Resource Types</h3>
          <p className="text-sm text-gray-500">Select the types of resources you can provide:</p>
          
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
            Note: Your volunteer registration will need to be verified before you can provide assistance.
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

export default RegisterVolunteer;