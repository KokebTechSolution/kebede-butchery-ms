// Dynamic API URL based on environment and access type
const getApiBaseUrl = () => {
  // Check if we're in production mode first
  if (process.env.NODE_ENV === 'production') {
    // Use environment variable if set
    if (process.env.REACT_APP_API_URL) {
      console.log('🚀 Production mode, using REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
      return process.env.REACT_APP_API_URL;
    }
    
    // Fallback for production
    console.log('🚀 Production mode, using fallback URL');
    return 'https://kebede-butchery-ms.onrender.com';
  }
  
  // Development mode
  if (process.env.NODE_ENV === 'development') {
    // Use environment variable if set
    if (process.env.REACT_APP_API_URL) {
      console.log('🌐 Using REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
      return process.env.REACT_APP_API_URL;
    }
    
    // Check if we're accessing from network IP
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    console.log('🌐 Current hostname:', hostname);
    console.log('🌐 Current port:', port);
    
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // Network access - use the same hostname with port 8000
      const networkApiUrl = `http://${hostname}:8000`;
      console.log('🌐 Network access detected, using:', networkApiUrl);
      return networkApiUrl;
    } else {
      // Local access
      console.log('🏠 Local access detected, using localhost:8000');
      return 'http://localhost:8000';
    }
  }
  
  // Fallback
  const fallbackUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  console.log('🔧 Fallback mode, using:', fallbackUrl);
  return fallbackUrl;
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔧 Final API Configuration:');
console.log('🌐 NODE_ENV:', process.env.NODE_ENV);
console.log('🌐 REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('🌐 REACT_APP_ENABLE_NETWORK_ACCESS:', process.env.REACT_APP_ENABLE_NETWORK_ACCESS);
console.log('🌐 Current hostname:', window.location.hostname);
console.log('🌐 Final API_BASE_URL:', API_BASE_URL);

export { API_BASE_URL }; 