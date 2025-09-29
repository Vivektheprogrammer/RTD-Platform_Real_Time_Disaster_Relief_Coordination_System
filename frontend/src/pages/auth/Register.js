import React from 'react';
import { Link } from 'react-router-dom';

const Register = () => {
  return (
    <div>
      <div className="flex justify-center mb-6">
        <img
          className="h-16 w-16"
          src="/images/rtd-logo.svg"
          alt="RTD Platform"
        />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Create an account</h2>
      <p className="text-gray-600 mb-8">Please select your user type to register:</p>
      
      <div className="space-y-4">
        <Link
          to="/register/victim"
          className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <div>
            <h3 className="text-lg font-medium text-gray-900">Victim</h3>
            <p className="text-sm text-gray-500">Register as someone affected by a disaster seeking help</p>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </Link>
        
        <Link
          to="/register/ngo"
          className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <div>
            <h3 className="text-lg font-medium text-gray-900">NGO</h3>
            <p className="text-sm text-gray-500">Register as an organization providing disaster relief resources</p>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </Link>
        
        <Link
          to="/register/government"
          className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <div>
            <h3 className="text-lg font-medium text-gray-900">Government</h3>
            <p className="text-sm text-gray-500">Register as a government official coordinating disaster relief</p>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>
      
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

export default Register;