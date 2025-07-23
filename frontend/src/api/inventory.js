// src/api/inventory.js
import axios from 'axios';

// Utility to read CSRF token from cookies
const getCSRFToken = () => {
  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='));
  return cookie ? cookie.split('=')[1] : null;
};

// Create a custom Axios instance
const api = axios.create({
  baseURL: 'http://localhost:8000/api/inventory/', // Base URL for inventory API
  withCredentials: true, // Ensure cookies (like CSRF) are sent with requests
});

// Axios Interceptor to dynamically set CSRF token for mutating requests
api.interceptors.request.use(
  (config) => {
    const csrfToken = getCSRFToken();
    // Attach CSRF token to all methods except GET, HEAD, OPTIONS
    if (csrfToken && !['GET', 'HEAD', 'OPTIONS'].includes(config.method.toUpperCase())) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
    // Set Content-Type for POST/PUT/PATCH unless it's FormData (which sets its own)
    if (
      (config.method === 'post' || config.method === 'put' || config.method === 'patch') &&
      !(config.data instanceof FormData) &&
      !config.headers['Content-Type'] // Only set if not already specified (e.g., for FormData)
    ) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Products Endpoints (Product Definitions) ---
// Note: Using 'product/' (singular) as per your Django URLconf output
export const getProducts = () => api.get('products/');
export const getProduct = (id) => api.get(`products/${id}/`);
export const createProduct = (data) => api.post('products/', data); // data can be FormData for image upload
export const updateProduct = (id, data) => api.patch(`products/${id}/`, data); // Using PATCH for partial updates
export const deleteProduct = (id) => api.delete(`products/${id}/`);
export const searchProducts = (query) => api.get(`products/?search=${query}`); // Assuming search is on 'product' endpoint
export const restockProduct = (id, data) => api.post(`products/${id}/restock/`, data);
export const saleProduct = (id, data) => api.post(`products/${id}/sale/`, data);
export const wastageProduct = (id, data) => api.post(`products/${id}/wastage/`, data); // Added wastage

// Aliases for compatibility with older component imports
export const fetchProducts = getProducts;
export const performSale = saleProduct;
export const performRestock = restockProduct; // Added for consistency
export const performWastage = wastageProduct; // Added for consistency


// --- Stocks Endpoints (Branch-specific Stock Levels) ---
export const getStocks = () => api.get('stocks/');
export const getStock = (id) => api.get(`stocks/${id}/`);
export const createStock = (data) => api.post('stocks/', data);
export const updateStock = (id, data) => api.patch(`stocks/${id}/`, data); // Using PATCH
export const deleteStock = (id) => api.delete(`stocks/${id}/`);

// Aliases
export const fetchStocks = getStocks;


// --- Transactions Endpoints (Inventory Movements) ---
export const getTransactions = () => api.get('transactions/');
export const getTransaction = (id) => api.get(`transactions/${id}/`);
export const createTransaction = (data) => api.post('transactions/', data); // For direct transaction creation if needed


// --- Inventory Requests Endpoints (Requests between Branches/Barman) ---
export const getRequests = () => api.get('requests/');
export const getRequest = (id) => api.get(`requests/${id}/`);
export const createInventoryRequest = (data) => api.post('requests/', data); // Renamed from createRequest
export const updateRequest = (id, data) => api.patch(`requests/${id}/`, data); // Using PATCH
export const deleteRequest = (id) => api.delete(`requests/${id}/`);

// Custom actions on Inventory Requests
export const acceptAndFulfillRequest = (id, data) => api.post(`requests/${id}/accept_and_fulfill/`, data); // Expects data payload (e.g., { quantity_in_sellable_units: num })
export const rejectRequest = (id) => api.post(`requests/${id}/reject/`, {}); // Empty payload for reject
export const allocateToBarman = (id, data) => api.post(`requests/${id}/allocate_to_barman/`, data); // For transferring stock to barman from a request

// Aliases for compatibility
export const fetchRequests = getRequests;
export const acceptRequest = acceptAndFulfillRequest; // Frontend components might still use acceptRequest


// --- Barman Stock Endpoints ---
// This endpoint typically lists stocks for the currently authenticated barman.
// If you need to filter by branch, the backend's get_queryset should handle it,
// or you can add a query parameter here if your backend supports it:
// export const getBarmanStock = (branchId) => api.get(`barman-stock/?branch=${branchId}`);
export const getBarmanStock = () => api.get('barman-stock/'); // Assuming backend filters by authenticated user

export const getBarmanStockById = (id) => api.get(`barman-stock/${id}/`);
export const deductBarmanSale = (barmanStockId, data) => api.post(`barman-stock/${barmanStockId}/deduct_sale/`, data);
export const deductBarmanWastage = (barmanStockId, data) => api.post(`barman-stock/${barmanStockId}/deduct_wastage/`, data);


// --- Categories, Item Types, Branches Endpoints (Lookup Data) ---
export const fetchCategories = () => api.get('categories/');
export const fetchItemTypes = () => api.get('itemtypes/'); // Corrected from item-types/
export const fetchBranches = () => api.get('branches/');

export const createCategory = (data) => api.post('categories/', data);
export const createItemType = (data) => api.post('itemtypes/', data);


// Export all functions as named exports
export default {
  // Products
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  searchProducts, restockProduct, saleProduct, wastageProduct,
  fetchProducts, performSale, performRestock, performWastage,

  // Stocks
  getStocks, getStock, createStock, updateStock, deleteStock, fetchStocks,

  // Transactions
  getTransactions, getTransaction, createTransaction,

  // Inventory Requests
  getRequests, getRequest, createInventoryRequest, updateRequest, deleteRequest,
  acceptAndFulfillRequest, rejectRequest, allocateToBarman, fetchRequests, acceptRequest,

  // Barman Stock
  getBarmanStock, getBarmanStockById, deductBarmanSale, deductBarmanWastage,

  // Lookup Data
  fetchCategories, fetchItemTypes, fetchBranches, createCategory, createItemType,
};