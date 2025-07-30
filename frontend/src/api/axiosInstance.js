import axios from 'axios';
import { API_BASE_URL } from './config';

// Helper to read CSRF token from cookie with better parsing
function getCookie(name) {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(name + '=')) {
      const value = decodeURIComponent(cookie.substring(name.length + 1));
      console.log(`[DEBUG] getCookie('${name}'): ${value ? value.substring(0, 10) + '...' : 'not found'}`);
      return value;
    }
  }
  console.log(`[DEBUG] getCookie('${name}'): not found`);
  return '';
}

// Helper to fetch CSRF token from server
async function fetchCSRFToken() {
  try {
    console.log('[DEBUG] Fetching CSRF token from server...');
    const response = await fetch(`${API_BASE_URL}/api/users/csrf/`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const token = getCookie('csrftoken');
      console.log('[DEBUG] CSRF token fetched:', token ? token.substring(0, 10) + '...' : 'not found');
      return token;
    } else {
      console.error('[DEBUG] Failed to fetch CSRF token:', response.status);
      return null;
    }
  } catch (error) {
    console.error('[DEBUG] Error fetching CSRF token:', error);
    return null;
  }
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
  async (config) => {
    // Get CSRF token from cookie
    let csrfToken = getCookie('csrftoken');
    
    // If no CSRF token and this is a POST/PUT/PATCH/DELETE request, fetch it
    if (!csrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
      console.log('[DEBUG] No CSRF token found, fetching from server...');
      csrfToken = await fetchCSRFToken();
    }
    
    // Set CSRF token if available
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
      console.log('[DEBUG] CSRF token set in header:', csrfToken.substring(0, 10) + '...');
    } else {
      console.warn('[DEBUG] No CSRF token available for request');
    }
    
    // Ensure we don't send any CORS-related headers in requests
    // These should only be in response headers from the server
    const headersToRemove = [
      'access-control-allow-credentials',
      'Access-Control-Allow-Credentials',
      'access-control-allow-origin',
      'Access-Control-Allow-Origin',
      'access-control-allow-methods',
      'Access-Control-Allow-Methods',
      'access-control-allow-headers',
      'Access-Control-Allow-Headers',
      'Access-Control-Expose-Headers',
      'access-control-expose-headers'
    ];
    
    headersToRemove.forEach(header => {
      delete config.headers[header];
    });
    
    // Ensure we have the correct content type
    if (config.method !== 'get' && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    
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
      console.log('[DEBUG] CSRF error detected, fetching new token...');
      // Fetch new CSRF token
      fetchCSRFToken().then(() => {
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

// Test function to verify CSRF token
export function testCSRFToken() {
  const token = getCookie('csrftoken');
  console.log('[DEBUG] CSRF Token Test:');
  console.log('[DEBUG] - Token found:', !!token);
  console.log('[DEBUG] - Token value:', token ? token.substring(0, 10) + '...' : 'none');
  console.log('[DEBUG] - All cookies:', document.cookie);
  return token;
}

export default axiosInstance;
