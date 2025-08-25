// Production Configuration
export const PRODUCTION_CONFIG = {
  API_BASE_URL: 'https://your-backend-name.onrender.com',
  ENVIRONMENT: 'production'
};

// Update this URL after deploying your backend to Render
export const getApiBaseUrl = () => {
  return PRODUCTION_CONFIG.API_BASE_URL;
};
