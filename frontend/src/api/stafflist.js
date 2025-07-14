// api/stafflist.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/users/users/';

/**
 * Get the JWT token from localStorage
 * @returns {string|null}
 */
const getToken = () => localStorage.getItem('access');

/**
 * Create an axios instance with Authorization header
 * @returns {import('axios').AxiosInstance}
 */
const createAxiosInstance = () => {
  const token = getToken();
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  });
};

/**
 * Handle error response and return a user-friendly error message
 * @param {any} error
 * @returns {string}
 */
const getFriendlyErrorMessage = (error) => {
  if (error.response?.data) {
    const data = error.response.data;
    if (typeof data === 'object' && !Array.isArray(data)) {
      // Collect messages from error fields
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

/**
 * Fetch the list of staff users
 * @returns {Promise<any[]>}
 */
export const fetchStaffList = async () => {
  try {
    const response = await createAxiosInstance().get('/');
    return response.data;
  } catch (error) {
    console.warn('Failed to fetch staff list:', error);
    throw new Error('Unable to load staff list. Please refresh or try again later.');
  }
};

/**
 * Add a new user
 * @param {object} formData
 * @returns {Promise<object>}
 */
export const addUser = async (formData) => {
  try {
    const response = await createAxiosInstance().post('/', formData);
    return response.data;
  } catch (error) {
    const message = getFriendlyErrorMessage(error);
    throw new Error(message);
  }
};

/**
 * Update existing user data
 * @param {string|number} id
 * @param {object} formData
 * @returns {Promise<object>}
 */
export const updateUser = async (id, formData) => {
  try {
    const response = await createAxiosInstance().put(`${id}/`, formData);
    return response.data;
  } catch (error) {
    const message = getFriendlyErrorMessage(error);
    throw new Error(message);
  }
};

/**
 * Delete a user by ID
 * @param {string|number} id
 * @returns {Promise<void>}
 */
export const deleteUser = async (id) => {
  try {
    await createAxiosInstance().delete(`${id}/`);
  } catch (error) {
    const message = getFriendlyErrorMessage(error);
    throw new Error(message);
  }
};

/**
 * Reset password for a user
 * @param {string|number} id
 * @param {string} newPassword
 * @returns {Promise<object>}
 */
export const resetUserPassword = async (id, newPassword) => {
  try {
    const response = await createAxiosInstance().post(`${id}/reset-password/`, { password: newPassword });
    return response.data;
  } catch (error) {
    const message = getFriendlyErrorMessage(error);
    throw new Error(message);
  }
};

/**
 * Fetch branch list if needed
 * @returns {Promise<any[]>}
 */
export const fetchBranches = async () => {
  try {
    const response = await createAxiosInstance().get('branches/');
    return response.data;
  } catch (error) {
    console.warn('Failed to fetch branches:', error);
    throw new Error('Unable to load branches. Please try again later.');
  }
};
