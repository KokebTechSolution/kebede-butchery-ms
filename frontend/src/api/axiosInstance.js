import axios from 'axios';
import { API_BASE_URL } from './config';

// Helper to read CSRF token from cookie
function getCookie(name) {
  const match = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  const value = match ? match.pop() : '';
  console.log(`[DEBUG] getCookie('${name}'): ${value ? value.substring(0, 10) + '...' : 'not found'}`);
  return value;
}

// Test function to verify CSRF token
export function testCSRFToken() {
  const token = getCookie('csrftoken');
  console.log('[DEBUG] CSRF Token Test:');
  console.log('[DEBUG] - Token found:', !!token);
  console.log('[DEBUG] - Token value:', token ? token.substring(0, 10) + '...' : 'none');
  console.log('[DEBUG] - All cookies:', document.cookie);
  return token;
}

const axiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/`,
  withCredentials: true, // IMPORTANT: send cookies on cross-origin requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to update CSRF token on each request
axiosInstance.interceptors.request.use(
  (config) => {
    // Get CSRF token from cookie
    const csrfToken = getCookie('csrftoken');
    
    // Set CSRF token if available
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
      console.log('[DEBUG] CSRF token set in header:', csrfToken.substring(0, 10) + '...');
    } else {
      console.warn('[DEBUG] No CSRF token available for request');
    }
    
    // Ensure we don't send problematic headers
    delete config.headers['access-control-allow-credentials'];
    delete config.headers['Access-Control-Allow-Credentials'];
    
    console.log('[DEBUG] Request config:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      withCredentials: config.withCredentials,
      hasCSRF: !!csrfToken,
      csrfToken: csrfToken ? csrfToken.substring(0, 10) + '...' : 'none'
    });
    
    return config;
  },
  (error) => {
    console.error('[DEBUG] Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('[DEBUG] Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('[DEBUG] Response error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data
    });
    
    // Handle CSRF errors
    if (error.response?.status === 403 && error.response?.data?.detail?.includes('CSRF')) {
      console.log('[DEBUG] CSRF error detected');
      // Try to fetch new CSRF token
      fetch(`${API_BASE_URL}/api/users/csrf/`, {
        method: 'GET',
        credentials: 'include'
      }).then(() => {
        console.log('[DEBUG] New CSRF token fetched, you may need to retry the request');
      });
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Redirect to login or refresh token
      console.log('Authentication error, redirecting to login...');
      window.location.href = '/login';
    }
    
    // Handle CORS errors
    if (error.message === 'Network Error') {
      console.error('CORS Error: Check if the backend is running and CORS is configured properly');
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
