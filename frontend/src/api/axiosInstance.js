import axios from 'axios';
import mockAxiosInstance from './mockApiService';

// Helper to read CSRF token from cookie
function getCookie(name) {
  const match = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return match ? match.pop() : '';
}

// Check if we're in production (deployed) or development
const isProduction = process.env.NODE_ENV === 'production' || 
                    window.location.hostname !== 'localhost';

// Use real API in production (deployed backend), mock data only if no backend
const getBackendUrl = () => {
  if (process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL;
  }
  return isProduction ? 'https://your-backend-domain.onrender.com/api/' : 'http://localhost:8000/api/';
};

const axiosInstance = isProduction ? 
  (process.env.REACT_APP_BACKEND_URL ? axios.create({
    baseURL: getBackendUrl(),
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  }) : mockAxiosInstance) : 
  axios.create({
    baseURL: getBackendUrl(),
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  });

// Only add interceptors for real axios instance
if (!isProduction) {
  axiosInstance.interceptors.request.use(
    config => {
      const csrfToken = getCookie('csrftoken');
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
      return config;
    },
    error => Promise.reject(error)
  );
}

export default axiosInstance;
