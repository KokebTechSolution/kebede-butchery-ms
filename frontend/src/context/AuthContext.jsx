// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

// Create the context
const AuthContext = createContext();

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Try to load user from localStorage on init (optional)
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const navigate = useNavigate();

  // Fetch the current logged-in user from the backend session
  const fetchSessionUser = async () => {
    try {
      console.log('[DEBUG] Fetching session user...');
      
      // Check if we're accessing from network IP
      const isNetworkAccess = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      const meEndpoint = isNetworkAccess ? 'users/network-me/' : 'users/me/';
      
      console.log('[DEBUG] Using endpoint:', meEndpoint);
      
      // For network access, include session key in headers if available
      const config = {};
      if (isNetworkAccess) {
        const networkSessionKey = localStorage.getItem('network_session_key');
        if (networkSessionKey) {
          config.headers = { 'X-Session-Key': networkSessionKey };
          console.log('[DEBUG] Using network session key:', networkSessionKey.substring(0, 10) + '...');
        }
      }
      
      const response = await axiosInstance.get(meEndpoint, config);
      const data = response.data;
      console.log('[DEBUG] Session user data:', data);
      setUser({ ...data, isAuthenticated: true });
      localStorage.setItem('user', JSON.stringify({ ...data, isAuthenticated: true }));
    } catch (error) {
      console.error('Authentication error:', error);
      setUser(null);
      localStorage.removeItem('user');
    }
  };

  useEffect(() => {
    fetchSessionUser();
    // On mount, if no valid session, ensure user is null and localStorage is cleared
    if (!localStorage.getItem('user')) {
      setUser(null);
      localStorage.removeItem('user');
    }
  }, []);

  // Called after login to update user state
  const login = async (userData) => {
    if (userData) {
      setUser({ ...userData, isAuthenticated: true });
      localStorage.setItem('user', JSON.stringify({ ...userData, isAuthenticated: true }));
    } else {
      await fetchSessionUser();
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post('users/logout/');
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      // Force a full reload to clear all state and ensure Topbar re-renders
      window.location.href = '/login';
    }
  };

  // Update user state partially (for profile updates, etc.)
  const updateUser = (newUserData) => {
    setUser((prevUser) => {
      const updated = { ...prevUser, ...newUserData };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  // Optional: Listen to custom logout event
  useEffect(() => {
    const handleLogoutEvent = () => logout();
    window.addEventListener('logout', handleLogoutEvent);
    return () => window.removeEventListener('logout', handleLogoutEvent);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        updateUser,
        isAuthenticated: !!user?.isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
