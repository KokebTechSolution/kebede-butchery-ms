import axios from 'axios';
import { API_BASE_URL } from './config';

// Helper to read CSRF token from cookie with better parsing
function getCookie(name) {
  const match = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return match ? match.pop() : '';
}

// Helper to refresh CSRF token
async function refreshCSRFToken() {
  try {
    await axios.get('http://localhost:8000/api/users/csrf/', {
      withCredentials: true
    });
  } catch (error) {
    console.log('CSRF refresh error:', error);
  }
}

const axiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/`,
  withCredentials: true, // IMPORTANT: send cookies on cross-origin requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to always get fresh CSRF token
axiosInstance.interceptors.request.use(async (config) => {
  // Refresh CSRF token before each request
  await refreshCSRFToken();
  
  // Get the fresh CSRF token
  const csrfToken = getCookie('csrftoken');
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default axiosInstance;
