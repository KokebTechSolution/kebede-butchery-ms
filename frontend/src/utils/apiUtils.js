// Utility functions for API operations
import { API_BASE_URL } from '../config/api';

// Helper to get CSRF token from cookie
export function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.startsWith(name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// Get CSRF token
export const getCSRFToken = () => getCookie('csrftoken');

// Build API URL
export const buildApiUrl = (endpoint) => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

// Common axios configs
export const getConfig = {
  withCredentials: true,
};

export const postConfig = {
  withCredentials: true,
  headers: {
    'X-CSRFToken': getCSRFToken(),
    'Content-Type': 'application/json',
  },
};

export const multipartConfig = {
  withCredentials: true,
  headers: {
    'X-CSRFToken': getCSRFToken(),
    'Content-Type': 'multipart/form-data',
  },
};

// API URL constants
export const API_ENDPOINTS = {
  // Inventory endpoints
  INVENTORY_PRODUCTS: 'inventory/products/',
  INVENTORY_STOCKS: 'inventory/stocks/',
  INVENTORY_CATEGORIES: 'inventory/categories/',
  INVENTORY_ITEMTYPES: 'inventory/itemtypes/',
  INVENTORY_PRODUCT_UNITS: 'inventory/productunits/',
  INVENTORY_BRANCHES: 'inventory/branches/',
  
  // User endpoints
  USERS_LOGIN: 'users/login/',
  USERS_LOGOUT: 'users/logout/',
  USERS_ME: 'users/me/',
  USERS_CSRF: 'users/csrf/',
};
