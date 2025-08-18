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
    
    // Check if user is authenticated
    const sessionKey = localStorage.getItem('session_key');
    const user = localStorage.getItem('user');
    
    console.log('🔍 Request interceptor - Session check:', {
      url: config.url,
      method: config.method,
      hasSessionKey: !!sessionKey,
      hasUser: !!user,
      cookies: document.cookie,
      withCredentials: config.withCredentials
    });
    
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
    
    // Add session validation header if available
    if (sessionKey) {
      config.headers = config.headers || {};
      config.headers['X-Session-Key'] = sessionKey;
      console.log('✅ Session key added to request:', config.url);
    }
    
    // Ensure withCredentials is set for all requests
    config.withCredentials = true;
    
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
    // Handle authentication errors
    if (error.response?.status === 401) {
      console.error('❌ Authentication error (401):', error.response.data);
      console.error('❌ Request details:', {
        url: error.config?.url,
        method: error.config?.method,
        cookies: document.cookie,
        withCredentials: error.config?.withCredentials
      });
      
      // Clear stored session data
      localStorage.removeItem('session_key');
      localStorage.removeItem('user');
      localStorage.removeItem('csrf_token');
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        console.log('🔄 Redirecting to login due to authentication error');
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      console.error('❌ Permission denied (403):', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
