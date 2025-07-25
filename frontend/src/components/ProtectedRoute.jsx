import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If user is null (not yet loaded), show login prompt
  if (user === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-green-100 text-center px-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Session Expired or Not Logged In</h1>
        <p className="text-gray-600 mb-6">Please log in to continue.</p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium rounded-xl shadow-md transition duration-300"
        >
          Go to Login
        </button>
      </div>
    );
  }

  // If user is loaded but not authenticated, redirect
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user role is not allowed
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Everything is fine, render the children
  return children;
};

export default ProtectedRoute;
