// Dynamic API URL based on access type
const isNetworkAccess = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_BASE_URL = isNetworkAccess ? 'http://10.240.69.22:8000' : 'http://localhost:8000';

console.log('🔧 FORCED DEVELOPMENT MODE');
console.log('🌐 API_BASE_URL:', API_BASE_URL);

console.log('Environment Info:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  API_BASE_URL
});

export { API_BASE_URL }; 