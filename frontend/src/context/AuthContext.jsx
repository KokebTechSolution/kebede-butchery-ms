// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api/config';

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
      const res = await fetch(`${API_BASE_URL}/api/users/me/`, {
        credentials: 'include', // important to send cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Not authenticated');
      const data = await res.json();
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
  const login = async () => {
    await fetchSessionUser();
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/users/logout/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
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
