import axios from 'axios';
import { API_BASE_URL } from '../api/config';

// Helper to read CSRF token from cookie
function getCookie(name) {
  const match = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return match ? match.pop() : '';
}

// Helper to set CSRF token in cookie
function setCSRFToken(token) {
  document.cookie = `csrftoken=${token}; path=/; SameSite=Lax`;
}

// Get CSRF token from cookie
export function getCSRFToken() {
  return getCookie('csrftoken');
}

// Refresh CSRF token from backend
export async function refreshCSRFToken() {
  try {
    console.log('🔄 Refreshing CSRF token...');
    
    const response = await axios.get(`${API_BASE_URL}/api/users/csrf/`, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('✅ CSRF token refreshed successfully');
    
    // Get the token from the response
    const csrfToken = response.data.csrf_token;
    if (csrfToken) {
      setCSRFToken(csrfToken);
      console.log('✅ CSRF token set in cookie:', csrfToken.substring(0, 10) + '...');
      return csrfToken;
    }
    
    return null;
  } catch (error) {
    console.error('❌ CSRF refresh error:', error);
    return null;
  }
}

// Ensure CSRF token is available
export async function ensureCSRFToken() {
  let csrfToken = getCSRFToken();
  
  if (!csrfToken) {
    console.log('🔄 No CSRF token found, refreshing...');
    csrfToken = await refreshCSRFToken();
  }
  
  return csrfToken;
}

// Get CSRF token for headers
export async function getCSRFHeader() {
  const token = await ensureCSRFToken();
  return token ? { 'X-CSRFToken': token } : {};
} 