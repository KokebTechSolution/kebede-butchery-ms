// LOCAL NETWORK - Use your computer's IP address
const API_BASE_URL = 'http://192.168.1.2:8000';

console.log('🔧 FORCED DEVELOPMENT MODE');
console.log('🌐 API_BASE_URL:', API_BASE_URL);

console.log('Environment Info:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  API_BASE_URL
});

export { API_BASE_URL }; 