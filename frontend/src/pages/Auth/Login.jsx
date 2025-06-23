// src/pages/Auth/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const roleRedirectMap = {
    manager: '/',
    waiter: '/',
    cashier: '/',
    bartender: '/',
    meat: '/',
    owner: '/',
    admin: '/admin-dashboard',
    staff: '/staff-dashboard',
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log('Submitting login with:', formData);

    try {
      const response = await fetch('http://localhost:8000/api/users/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Login failed:', errorData);
        throw new Error(errorData.detail || 'Invalid credentials');
      }

      const data = await response.json();
      console.log('Login successful, received data:', data);

      // Add isAuthenticated flag here to help ProtectedRoute
      const userWithAuth = { ...data.user, isAuthenticated: true };

      // Update context and localStorage
      login({ ...data, user: userWithAuth });
      localStorage.setItem('access', data.access);
      localStorage.setItem('refresh', data.refresh);
      localStorage.setItem('user', JSON.stringify(userWithAuth));

      // Determine redirect path based on role
      const redirectTo = roleRedirectMap[userWithAuth.role];
      if (redirectTo) {
        console.log(`Redirecting user with role "${userWithAuth.role}" to "${redirectTo}"`);
        navigate(redirectTo);
      } else {
        console.warn(`User role "${userWithAuth.role}" not recognized, redirecting to /unauthorized`);
        navigate('/unauthorized');
      }
    } catch (err) {
      console.error('Login error caught:', err);
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 px-4">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
          Login to Your Account
        </h2>
        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-600">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-200"
              placeholder="Enter your username"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-600">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-200"
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-all font-semibold disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Forgot password?{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Reset here
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;