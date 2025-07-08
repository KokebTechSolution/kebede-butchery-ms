// src/pages/Auth/Logout.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Logout() {
  const { logout } = useAuth(); // assumes logout() clears auth and user data
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Logging out...'); // <- Add this
    logout(); // Clear session
    const timeout = setTimeout(() => {
      navigate('/login', { replace: true }); // Redirect to login
    }, 1500); // 1.5 second delay to show message

    return () => clearTimeout(timeout);
  }, [logout, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-semibold text-gray-700">Logging you out...</h2>
        <p className="text-gray-500 mt-2">Please wait while we end your session.</p>
      </div>
    </div>
  );
}
