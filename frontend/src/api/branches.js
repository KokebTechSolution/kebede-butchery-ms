import axios from 'axios';
import { API_BASE_URL as BASE_URL } from '../config/api';

const API_BASE_URL = `${BASE_URL}inventory/branches/`;

// ✅ Helper to get CSRF token from cookies
const getCookie = (name) => {
  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith(name + '='));
  return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
};

// ✅ Axios config for session-based auth
const axiosConfig = () => ({
  withCredentials: true, // send session cookie
  headers: {
    'Content-Type': 'application/json',
    'X-CSRFToken': getCookie('csrftoken'),
  },
});

export const fetchBranches = async () => {
  try {
    const response = await axios.get(API_BASE_URL, axiosConfig());
    return response.data;
  } catch (error) {
    console.error('Error fetching branches:', error);
    throw error;
  }
};
