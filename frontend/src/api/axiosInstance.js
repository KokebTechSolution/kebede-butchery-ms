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
    const baseURL = API_BASE_URL;
    console.log('Refreshing CSRF token from:', `${baseURL}/api/users/csrf/`);
    
    const response = await axios.get(`${baseURL}/api/users/csrf/`, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('CSRF token refreshed successfully');
    return true;
  } catch (error) {
    console.error('CSRF refresh error:', error);
    return false;
  }
}

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
    
    // Refresh CSRF token before each request
    const csrfRefreshed = await refreshCSRFToken();
    
    if (csrfRefreshed) {
      // Get the fresh CSRF token
      const csrfToken = getCookie('csrftoken');
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
        console.log('CSRF token set for request:', config.url);
      } else {
        console.warn('No CSRF token found for request:', config.url);
      }
    } else {
      console.error('Failed to refresh CSRF token for request:', config.url);
    }
  } catch (error) {
    console.error('Error setting CSRF token:', error);
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default axiosInstance;
