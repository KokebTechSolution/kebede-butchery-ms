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

// Add request interceptor to always get fresh CSRF token and handle network session
axiosInstance.interceptors.request.use(async (config) => {
  try {
    // Check if we're accessing from network IP
    const isNetworkAccess = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    
    // For network access, include session key in headers
    if (isNetworkAccess) {
      const networkSessionKey = localStorage.getItem('network_session_key');
      if (networkSessionKey) {
        config.headers = config.headers || {};
        config.headers['X-Session-Key'] = networkSessionKey;
        console.log('🌐 Network session key set for request:', config.url);
      }
    }
    
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

// Add response interceptor to handle network authentication
axiosInstance.interceptors.response.use(
  (response) => {
    // If this is a network login response, store session data
    if (response.config.url?.includes('network-login') && response.data.session_key) {
      console.log('🌐 Network login successful, storing session data');
      localStorage.setItem('network_session_key', response.data.session_key);
      if (response.data.csrf_token) {
        localStorage.setItem('network_csrf_token', response.data.csrf_token);
      }
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
