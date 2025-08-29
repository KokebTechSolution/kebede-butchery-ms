// API Configuration
const getApiBaseUrl = () => {
  // In production (when built and served), use relative URLs
  if (process.env.NODE_ENV === 'production') {
    return '/api/';
  }
  // In development, use localhost
  return 'http://localhost:8000/api/';
};

export const API_BASE_URL = getApiBaseUrl();
export default API_BASE_URL;
