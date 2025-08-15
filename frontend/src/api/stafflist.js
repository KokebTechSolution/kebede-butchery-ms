import axiosInstance from './axiosInstance';

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
    const response = await axiosInstance.get('users/users/');
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
    const response = await axiosInstance.post('users/users/', formData);
    return response.data;
  } catch (error) {
    const message = getFriendlyErrorMessage(error);
    throw new Error(message);
  }
};

export const updateUser = async (id, formData) => {
  try {
    const response = await axiosInstance.put(`users/users/${id}/`, formData);
    return response.data;
  } catch (error) {
    const message = getFriendlyErrorMessage(error);
    throw new Error(message);
  }
};

export const deleteUser = async (id) => {
  try {
    await axiosInstance.delete(`users/users/${id}/`);
  } catch (error) {
    const message = getFriendlyErrorMessage(error);
    throw new Error(message);
  }
};

export const resetUserPassword = async (id, newPassword) => {
  try {
    const response = await axiosInstance.post(`users/users/${id}/reset-password/`, { password: newPassword });
    return response.data;
  } catch (error) {
    const message = getFriendlyErrorMessage(error);
    throw new Error(error.response?.data?.error || 'Password reset failed');
  }
};

export const fetchBranches = async () => {
  try {
    const response = await axiosInstance.get('branches/');
    // Defensive: handle array or object
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data && Array.isArray(response.data.results)) {
      return response.data.results;
    }
    if (response.data && Array.isArray(response.data.branches)) {
      return response.data.branches;
    }
    // If not an array, return empty array to avoid .map error
    console.warn('Branches response is not an array:', response.data);
    return [];
  } catch (error) {
    console.warn('Failed to fetch branches:', error);
    // Return empty array instead of throwing error to prevent .map errors
    return [];
  }
};
