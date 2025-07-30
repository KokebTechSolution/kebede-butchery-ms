// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';

const LoginPage = () => {
  const { login, user, logout } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState(null);

  useEffect(() => {
    // Always clear user state and localStorage on login page load
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
    // Fetch CSRF cookie using axiosInstance
    axiosInstance.get('users/csrf/').catch(err => {
      console.error('Failed to fetch CSRF token:', err);
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
      console.log('[DEBUG] Attempting login...');
      const response = await axiosInstance.post('users/login/', formData);
      const userData = response.data;
      console.log('[DEBUG] Login successful:', userData);
      
      await login(); // Call AuthContext login
      navigate('/');
    } catch (err) {
      console.error('[DEBUG] Login error:', err);
      setError(err.response?.data?.error || err.message || 'Something went wrong');
    }
  };

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
