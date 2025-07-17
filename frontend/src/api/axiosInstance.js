import axios from 'axios';

// Helper to read CSRF token from cookie
function getCookie(name) {
  const match = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return match ? match.pop() : '';
}

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api/',
  withCredentials: true, // IMPORTANT: send cookies on cross-origin requests
  headers: {
    'Content-Type': 'application/json',
    'X-CSRFToken': getCookie('csrftoken'), // attach CSRF token header
  },
});

// Remove JWT token interceptors since sessions handle auth state

export default axiosInstance;
