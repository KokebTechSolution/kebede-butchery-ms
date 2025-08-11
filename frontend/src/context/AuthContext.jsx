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

  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();

  // Fetch the current logged-in user from the backend session
  const fetchSessionUser = async () => {
    try {
      console.log('[DEBUG] Fetching session user...');
      
      // Use unified endpoint for both local and network access
      const meEndpoint = 'users/me/';
      
      console.log('[DEBUG] Using endpoint:', meEndpoint);
      
      const response = await axiosInstance.get(meEndpoint);
      const data = response.data;
      console.log('[DEBUG] Session user data:', data);
      
      // Update user state and localStorage
      const userData = { ...data, isAuthenticated: true };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Also store session key if provided
      if (data.session_key) {
        localStorage.setItem('session_key', data.session_key);
      }
      
      return data;
    } catch (error) {
      console.error('Authentication error:', error);
      
      // Only clear user if it's a 401 (unauthorized) error
      if (error.response && error.response.status === 401) {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('session_key');
      }
      // For other errors, keep the existing user state
      throw error;
    }
  };

  useEffect(() => {
    // Try to restore user from localStorage first
    const storedUser = localStorage.getItem('user');
    const storedSessionKey = localStorage.getItem('session_key');
    
    if (storedUser && storedSessionKey) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        console.log('[DEBUG] User restored from localStorage:', userData.username);
        
        // Validate session with backend
        fetchSessionUser().catch(error => {
          console.log('[DEBUG] Session validation failed, will retry:', error.message);
          // Don't clear user immediately, let the retry mechanism handle it
        });
      } catch (error) {
        console.error('[DEBUG] Error parsing stored user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('session_key');
        setUser(null);
      }
    }
    
    // Mark as initialized - don't automatically fetch user from backend
    setIsInitialized(true);
  }, []);

  // Called after login to update user state
  const login = async (userData) => {
    try {
      if (userData && userData.username) {
        // If we have user data from login response, use it temporarily
        const tempUser = { ...userData, isAuthenticated: true };
        setUser(tempUser);
        localStorage.setItem('user', JSON.stringify(tempUser));
        
        // Then fetch fresh user data from /me endpoint to ensure we have complete user info
        console.log('[DEBUG] Login successful, fetching fresh user data from /me...');
        await fetchSessionUser();
      } else {
        // If no user data provided, fetch from backend
        await fetchSessionUser();
      }
    } catch (error) {
      console.error('[DEBUG] Error during login:', error);
      // If fetching from /me fails, keep the temporary user data
      if (userData && userData.username) {
        console.log('[DEBUG] Keeping temporary user data due to /me fetch failure');
      } else {
        throw error;
      }
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
        isInitialized,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
