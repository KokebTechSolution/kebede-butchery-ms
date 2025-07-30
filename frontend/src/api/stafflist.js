import axios from 'axios';
import { API_BASE_URL } from './config';

// Helper to get CSRF token from cookie
function getCSRFToken() {
  const match = document.cookie.match(new RegExp('(^| )csrftoken=([^;]+)'));
  return match ? match[2] : null;
}

// Create axios instance with session auth support
const createAxiosInstance = () => {
  return axios.create({
    baseURL: `${API_BASE_URL}/api/users/`,
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCSRFToken(),
    },
    withCredentials: true,  // Important for sending cookies
  });
};

const getFriendlyErrorMessage = (error) => {
  if (error.response?.data) {
    const data = error.response.data;
    if (typeof data === 'object' && !Array.isArray(data)) {
      return Object.entries(data)
        .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(' ') : messages}`)
        .join(' | ');
    }
    if (typeof data === 'string') {
      return data;
    }
  }
  return 'An unexpected error occurred. Please try again.';
};

export const fetchStaffList = async () => {
  try {
    const response = await createAxiosInstance().get('/');
    // Defensive: handle array or object
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data && Array.isArray(response.data.results)) {
      return response.data.results;
    }
    if (response.data && Array.isArray(response.data.users)) {
      return response.data.users;
    }
    // If not an array, return empty array to avoid .map error
    return [];
  } catch (error) {
    console.warn('Failed to fetch staff list:', error);
    throw new Error('Unable to load staff list. Please refresh or try again later.');
  }
};

export const addUser = async (formData) => {
  try {
    const response = await createAxiosInstance().post('/', formData);
    return response.data;
  } catch (error) {
    const message = getFriendlyErrorMessage(error);
    throw new Error(message);
  }
};

export const updateUser = async (id, formData) => {
  try {
    const response = await createAxiosInstance().put(`${id}/`, formData);
    return response.data;
  } catch (error) {
    const message = getFriendlyErrorMessage(error);
    throw new Error(message);
  }
};

export const deleteUser = async (id) => {
  try {
    await createAxiosInstance().delete(`${id}/`);
  } catch (error) {
    const message = getFriendlyErrorMessage(error);
    throw new Error(message);
  }
};

export const resetUserPassword = async (id, newPassword) => {
  try {
    const response = await createAxiosInstance().post(`${id}/reset-password/`, { password: newPassword });
    return response.data;
  } catch (error) {
    const message = getFriendlyErrorMessage(error);
    throw new Error(message);
  }
};

export const fetchBranches = async () => {
  try {
    const response = await createAxiosInstance().get('branches/');
    return response.data;
  } catch (error) {
    console.warn('Failed to fetch branches:', error);
    throw new Error('Unable to load branches. Please refresh or try again later.');
  }
};
