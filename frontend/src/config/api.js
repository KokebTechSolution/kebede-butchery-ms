// API Configuration
const API_CONFIG = {
  // Development (local)
  development: {
    baseURL: 'http://localhost:8000',
    wsURL: 'ws://localhost:8000'
  },
  // Production (Render)
  production: {
    baseURL: 'https://kebede-butchery-ms-2.onrender.com',
    wsURL: 'wss://kebede-butchery-ms-2.onrender.com'
  }
};

// Force production URLs for now (since we're deployed)
const currentConfig = API_CONFIG.production;

export const API_BASE_URL = currentConfig.baseURL;
export const WS_BASE_URL = currentConfig.wsURL;

// Full API endpoints
export const API_ENDPOINTS = {
  // Auth
  login: `${API_BASE_URL}/api/users/login/`,
  logout: `${API_BASE_URL}/api/users/logout/`,
  csrf: `${API_BASE_URL}/api/users/csrf/`,
  me: `${API_BASE_URL}/api/users/me/`,
  
  // Users
  users: `${API_BASE_URL}/api/users/users/`,
  
  // Products
  products: `${API_BASE_URL}/api/products/products/`,
  itemTypes: `${API_BASE_URL}/api/products/item-types/`,
  
  // Inventory
  inventory: `${API_BASE_URL}/api/inventory/`,
  inventoryProducts: `${API_BASE_URL}/api/inventory/products/`,
  inventoryStocks: `${API_BASE_URL}/api/inventory/stocks/`,
  inventoryCategories: `${API_BASE_URL}/api/inventory/categories/`,
  inventoryItemTypes: `${API_BASE_URL}/api/inventory/itemtypes/`,
  inventoryProductUnits: `${API_BASE_URL}/api/inventory/productunits/`,
  inventoryRequests: `${API_BASE_URL}/api/inventory/requests/`,
  inventoryBranches: `${API_BASE_URL}/api/inventory/branches/`,
  
  // Orders
  orders: `${API_BASE_URL}/api/orders/`,
  orderList: `${API_BASE_URL}/api/orders/order-list/`,
  orderItems: `${API_BASE_URL}/api/orders/order-item/`,
  foodOrders: `${API_BASE_URL}/api/orders/food/`,
  
  // Branches
  branches: `${API_BASE_URL}/api/branches/`,
  
  // Reports
  reports: `${API_BASE_URL}/api/reports/`,
  
  // Activity
  activity: `${API_BASE_URL}/api/activity/`,
  
  // Menu
  menu: `${API_BASE_URL}/api/menu/`,
  
  // Payments
  payments: `${API_BASE_URL}/api/payments/`,
  
  // Owner
  owner: `${API_BASE_URL}/api/owner/`,
  
  // Notifications
  notifications: `${WS_BASE_URL}/ws/notifications/`
};

export default API_CONFIG;
