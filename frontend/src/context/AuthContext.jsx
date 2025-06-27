import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Create the context
const AuthContext = createContext();

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const navigate = useNavigate();

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

  const login = (authData) => {
    localStorage.setItem('access_token', authData.access);
    localStorage.setItem('refresh_token', authData.refresh);
    localStorage.setItem('user', JSON.stringify(authData.user));
    setUser(authData.user);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    const handleLogoutEvent = () => logout();
    
    window.addEventListener('logout', handleLogoutEvent);
    
    return () => {
      window.removeEventListener('logout', handleLogoutEvent);
    };
  }, []);

  const value = {
    user,
    tokens,
    login,
    logout,
    isAuthenticated: !!user?.isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};