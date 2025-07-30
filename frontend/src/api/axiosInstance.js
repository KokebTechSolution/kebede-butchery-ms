import axios from 'axios';
import { API_BASE_URL } from './config';

// Helper to read CSRF token from cookie
function getCookie(name) {
  const match = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return match ? match.pop() : '';
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
    // Update CSRF token for each request
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
    
    // Add CORS headers for production
    if (process.env.NODE_ENV === 'production') {
      config.headers['Access-Control-Allow-Credentials'] = 'true';
    }
    
    console.log('[DEBUG] Request config:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      withCredentials: config.withCredentials
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
