// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user } = useAuth();

  if (!user || !user.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Case-insensitive check for roles
  const hasRequiredRole =
    !allowedRoles ||
    (user.groups &&
      user.groups.some(group =>
        allowedRoles.includes(group.toLowerCase())
      ));

  if (!hasRequiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
