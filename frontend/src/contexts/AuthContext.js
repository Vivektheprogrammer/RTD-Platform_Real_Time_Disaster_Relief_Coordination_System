import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Set up axios defaults
  axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    // Check if user is logged in on page load
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const res = await axios.get('/auth/user');
      setCurrentUser(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user data:', err);
      logout();
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError('');
      const res = await axios.post('/auth/register', userData);
      localStorage.setItem('token', res.data.token);
      axios.defaults.headers.common['x-auth-token'] = res.data.token;
      await fetchUserData();
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed');
      return { success: false, error: err.response?.data?.msg || 'Registration failed' };
    }
  };

  const login = async (email, password) => {
    try {
      setError('');
      const res = await axios.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      axios.defaults.headers.common['x-auth-token'] = res.data.token;
      await fetchUserData();
      return { success: true, user: currentUser };
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed');
      return { success: false, error: err.response?.data?.msg || 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['x-auth-token'];
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    loading,
    error,
    register,
    login,
    logout,
    fetchUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}