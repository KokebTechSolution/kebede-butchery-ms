// Environment detection
const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';

// API URL configuration
let API_BASE_URL;

if (process.env.REACT_APP_API_URL) {
  // Use environment variable if set
  API_BASE_URL = process.env.REACT_APP_API_URL;
        } else if (isProd || isVercel) {
          // Production environment
          API_BASE_URL = 'https://kebede-butchery-ms.onrender.com';
        } else {
          // Development environment - check if we're on network
          const hostname = window.location.hostname;
          if (hostname === '192.168.1.2') {
            API_BASE_URL = 'http://192.168.1.2:8000';
          } else {
            API_BASE_URL = 'http://localhost:8000';
          }
        }

console.log('Environment Info:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  isDev,
  isProd,
  isVercel,
  API_BASE_URL
});

export { API_BASE_URL }; 