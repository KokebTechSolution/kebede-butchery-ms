// Dynamic API URL based on environment and access type
const getApiBaseUrl = () => {
  // Check if we're in development mode
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
  
  // Production mode - use environment variable or default
  const productionUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  console.log('🚀 Production mode, using:', productionUrl);
  return productionUrl;
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔧 Final API Configuration:');
console.log('🌐 NODE_ENV:', process.env.NODE_ENV);
console.log('🌐 REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('🌐 REACT_APP_ENABLE_NETWORK_ACCESS:', process.env.REACT_APP_ENABLE_NETWORK_ACCESS);
console.log('🌐 Current hostname:', window.location.hostname);
console.log('🌐 Final API_BASE_URL:', API_BASE_URL);

export { API_BASE_URL }; 