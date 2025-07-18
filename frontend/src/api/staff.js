import axios from 'axios';

const API_URL = 'http://localhost:8000/api/users/users/';

// Helper to get CSRF token from cookie
function getCSRFToken() {
  const match = document.cookie.match(new RegExp('(^| )csrftoken=([^;]+)'));
  return match ? match[2] : null;
}

// Common Axios config with CSRF and cookies enabled
const axiosConfig = {
  headers: {
    'Content-Type': 'application/json',
    'X-CSRFToken': getCSRFToken(),
  },
  withCredentials: true,
};

export const fetchStaffList = async () => {
  const response = await axios.get(API_URL, axiosConfig);
  return response.data;
};

export const updateUser = async (id, formData) => {
  const response = await axios.put(`${API_URL}${id}/`, formData, axiosConfig);
  return response.data;
};

export const deleteUser = async (id) => {
  await axios.delete(`${API_URL}${id}/`, axiosConfig);
};
