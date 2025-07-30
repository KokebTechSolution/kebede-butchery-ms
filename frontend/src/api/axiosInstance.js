import axios from 'axios';
import { API_BASE_URL } from './config';

// Helper to read CSRF token from cookie
function getCookie(name) {
  const match = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return match ? match.pop() : '';
}

// Helper to fetch CSRF token from server
async function fetchCSRFToken() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/users/csrf/`, {
      withCredentials: true
    });
    return getCookie('csrftoken');
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
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
      console.log('[DEBUG] No CSRF token found, fetching...');
      csrfToken = await fetchCSRFToken();
    }
    
    // Set CSRF token if available
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
      console.log('[DEBUG] CSRF token set:', csrfToken.substring(0, 10) + '...');
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
      hasCSRF: !!csrfToken
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
      // Fetch new CSRF token and retry
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

export default axiosInstance;
