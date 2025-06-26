import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateTokens } from '../api/auth';

// Create the context
const AuthContext = createContext();

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider
export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const access = localStorage.getItem('access');
    const refresh = localStorage.getItem('refresh');

    if (storedUser && access && refresh) {
      setUser({ ...JSON.parse(storedUser), isAuthenticated: true });
      setTokens({ access, refresh });
    }
  }, []);

  const login = ({ access, refresh, user }) => {
    updateTokens({ access, refresh });
    localStorage.setItem('user', JSON.stringify(user));

    setUser({ ...user, isAuthenticated: true });
  };

  const logout = () => {
    updateTokens(null);
    localStorage.removeItem('user');

    setUser(null);
    navigate('/login');
  };

  const value = {
    user,
    tokens,
    login,
    logout,
    isAuthenticated: !!user?.isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};