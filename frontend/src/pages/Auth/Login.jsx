// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingPage from '../../components/LoadingPage/LoadingPage';
import axiosInstance from '../../api/axiosInstance';

const LoginPage = () => {
  const { login, user, logout } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState(null);
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    // Always clear user state and localStorage on login page load
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
    // Optionally, if setUser is available:
    // setUser && setUser(null);
    // Fetch CSRF cookie
    axiosInstance.get('users/csrf/').catch(err => {
      console.log('CSRF fetch error (expected on first load):', err);
    });
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      console.log('Attempting login with:', formData);
      
      const response = await axiosInstance.post('users/login/', formData);
      console.log('Login response:', response.data);
      
      login(response.data); // Call AuthContext login
      setShowLoading(true); // Show loading page instead of immediate navigation
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || err.message || 'Something went wrong');
    }
  };

  // Show loading page if loading is active
  if (showLoading) {
    return (
      <LoadingPage 
        onComplete={() => {
          setShowLoading(false);
          navigate('/');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-96 space-y-4"
      >
        <h2 className="text-2xl font-semibold mb-4 text-center">Login</h2>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <div>
          <label className="block mb-1">Username</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
