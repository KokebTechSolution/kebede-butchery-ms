// api/stafflist.js
import axios from 'axios';

const API_URL = 'http://localhost:8000/api/users/users/';

const getToken = () => localStorage.getItem('access');

export const fetchStaffList = async () => {
  const token = getToken();
  console.log('[API] Fetching staff list with token:', token);

  try {
    const response = await axios.get(API_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('[API] Staff list response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API] Error fetching staff list:', error);
    throw error;
  }
};

export const updateUser = async (id, formData) => {
  const token = getToken();
  console.log(`[API] Updating user ${id} with data:`, formData);

  try {
    const response = await axios.put(`${API_URL}${id}/`, formData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(`[API] Update response for user ${id}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[API] Error updating user ${id}:`, error);
    throw error;
  }
};

export const deleteUser = async (id) => {
  const token = getToken();
  console.log(`[API] Deleting user ${id}`);

  try {
    const response = await axios.delete(`${API_URL}${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(`[API] Delete successful for user ${id}`, response.status);
  } catch (error) {
    console.error(`[API] Error deleting user ${id}:`, error);
    throw error;
  }
};
export const addUser = async (formData) => {
  const token = getToken();
  console.log('[API] Adding new user with data:', formData);

  try {
    const response = await axios.post(API_URL, formData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('[API] Add user response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API] Error adding user:', error);
    throw error;
  }
};