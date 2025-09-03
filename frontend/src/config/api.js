// API Configuration
const getApiBaseUrl = () => {
  // Check if we're on Render
  const isRender = window.location.hostname.includes('onrender.com');
  
  // In production (when built and served), use relative URLs
  if (process.env.NODE_ENV === 'production') {
    if (isRender) {
      // On Render, use the full URL
      return `${window.location.origin}/api/`;
    }
    // In other production environments, use relative URLs
    return '/api/';
  }
  // In development, use localhost
  return 'http://localhost:8000/api/';
};

export const API_BASE_URL = getApiBaseUrl();
export default API_BASE_URL;
