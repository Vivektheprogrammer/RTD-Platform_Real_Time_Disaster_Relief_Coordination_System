import React from 'react';
import { Outlet, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthLayout = () => {
  const { currentUser } = useAuth();

  // Redirect to dashboard if already logged in
  if (currentUser) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-secondary-600 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/">
          <img
            className="mx-auto h-16 w-auto"
            src="/images/rtd-logo-small.svg"
            alt="RTD Platform"
          />
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Real-Time Disaster Relief Platform
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Outlet />
        </div>
        
        {/* Back to Home Button */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md text-white bg-transparent hover:bg-white hover:text-primary-600 transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;