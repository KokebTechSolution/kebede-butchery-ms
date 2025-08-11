import axios from 'axios';
import { API_BASE_URL } from './config';
import { ensureCSRFToken } from '../utils/csrfManager';

const axiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/`,
  withCredentials: true, // IMPORTANT: send cookies on cross-origin requests
  headers: {
    'Content-Type': 'application/json',
  },
  // Ensure cookies are sent with requests
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});

// Add request interceptor to always get fresh CSRF token
axiosInstance.interceptors.request.use(async (config) => {
  try {
    // Skip CSRF for GET requests and CSRF endpoint itself
    if (config.method === 'get' || config.url?.includes('csrf')) {
      return config;
    }
    
    // Ensure CSRF token is available
    const csrfToken = await ensureCSRFToken();
    
    // Set the CSRF token in headers
    if (csrfToken) {
      config.headers = config.headers || {};
      config.headers['X-CSRFToken'] = csrfToken;
      console.log('✅ CSRF token set for request:', config.url, 'Token:', csrfToken.substring(0, 10) + '...');
    } else {
      console.warn('⚠️ No CSRF token found for request:', config.url);
    }
  } catch (error) {
    console.error('❌ Error setting CSRF token:', error);
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add response interceptor to handle login session data
axiosInstance.interceptors.response.use(
  (response) => {
    // If this is a login response with session data, store it
    if (response.config.url?.includes('login') && response.data.session_key) {
      console.log('✅ Login successful, storing session data');
      localStorage.setItem('session_key', response.data.session_key);
      if (response.data.csrf_token) {
        localStorage.setItem('csrf_token', response.data.csrf_token);
      }
      
      // Force refresh CSRF token after login
      setTimeout(async () => {
        try {
          const { refreshCSRFToken } = await import('../utils/csrfManager');
          await refreshCSRFToken();
          console.log('✅ CSRF token refreshed after login');
        } catch (error) {
          console.error('❌ Error refreshing CSRF token after login:', error);
        }
      }, 100);
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
