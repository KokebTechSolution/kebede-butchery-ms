// api/stafflist.js
import axios from 'axios';

const API_URL = 'http://localhost:8000/api/users/users/';

const getToken = () => localStorage.getItem('access');

// ✅ Axios instance for cleaner code
const axiosInstance = () => {
  const token = getToken();
  return axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` },
  });
};

// ✅ Fetch Staff List
export const fetchStaffList = async () => {
  try {
    const response = await axiosInstance().get('/');
    console.log('[API] Staff list response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API] Error fetching staff list:', error);
    throw error;
  }
};

// ✅ Add User
export const addUser = async (formData) => {
  console.log('[API] Adding new user with data:', formData);

  try {
    const response = await axiosInstance().post('/', formData);
    console.log('[API] Add user response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API] Error adding user:', error.response?.data || error);

    let friendlyMessage = 'An error occurred while adding the user.';

    if (error.response && error.response.data) {
      const errors = error.response.data;

      if (typeof errors === 'object') {
        // Collect detailed messages from each field
        const messages = Object.entries(errors).map(
          ([field, messages]) => `${field}: ${messages.join(' ')}`
        );
        friendlyMessage = messages.join(' | ');
      } else if (typeof errors === 'string') {
        friendlyMessage = errors;
      }
    }

    // Throw a user-friendly error message
    throw new Error(friendlyMessage);
  }
};

// ✅ Update User
export const updateUser = async (id, formData) => {
  console.log(`[API] Updating user ${id} with data:`, formData);

  try {
    const response = await axiosInstance().put(`${id}/`, formData);
    console.log(`[API] Update response for user ${id}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[API] Error updating user ${id}:`, error.response?.data || error);
    throw error;
  }
};

// ✅ Delete User
export const deleteUser = async (id) => {
  console.log(`[API] Deleting user ${id}`);

  try {
    const response = await axiosInstance().delete(`${id}/`);
    console.log(`[API] Delete successful for user ${id}`, response.status);
  } catch (error) {
    console.error(`[API] Error deleting user ${id}:`, error.response?.data || error);
    throw error;
  }
};

// ✅ Reset User Password (Secure and Separate)
export const resetUserPassword = async (id, newPassword) => {
  console.log(`[API] Resetting password for user ${id}`);

  try {
    const response = await axiosInstance().post(`${id}/reset-password/`, { password: newPassword });
    console.log(`[API] Password reset response for user ${id}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[API] Error resetting password for user ${id}:`, error.response?.data || error);
    throw error;
  }
};
// ✅ Fetch Branches (if needed)
export const fetchBranches = async () => { 
  try {
    const response = await axiosInstance().get('branches/');
    console.log('[API] Branches response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API] Error fetching branches:', error);
    throw error;
  }
}