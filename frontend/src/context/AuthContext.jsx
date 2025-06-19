import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Create the context
const AuthContext = createContext();

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider
export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const access = localStorage.getItem('access');

    if (storedUser && access) {
      setUser({ ...JSON.parse(storedUser), isAuthenticated: true });
      setAccessToken(access);
    }
  }, []);

  const login = ({ access, refresh, user }) => {
    localStorage.setItem('access', access);
    localStorage.setItem('refresh', refresh);
    localStorage.setItem('user', JSON.stringify(user));

    setAccessToken(access);
    setUser({ ...user, isAuthenticated: true });
  };

  const logout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');

    setAccessToken(null);
    setUser(null);
    navigate('/login');
  };

  const value = {
    user,
    accessToken,
    login,
    logout,
    isAuthenticated: !!user?.isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
