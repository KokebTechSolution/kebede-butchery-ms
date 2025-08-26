import axios from 'axios';
import axiosInstance from './axiosInstance';
// Base URL for inventory API
import { API_BASE_URL } from '../config/api';
const BASE_URL = `${API_BASE_URL}/api/inventory/`;

// Utility to read cookie by name (for CSRF token)
function getCookie(name) {
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

// CSRF token from cookie
const csrfToken = getCookie('csrftoken');

// Axios config for GET requests (with credentials)
const getConfig = {
  withCredentials: true,
};

// Axios config for POST/PUT/PATCH requests (with credentials + CSRF token)
const modifyConfig = {
  withCredentials: true,
  headers: {
    'X-CSRFToken': csrfToken,
    'Content-Type': 'application/json',
  },
};

// Fetch all inventory items
export const fetchInventory = async () => {
  const response = await axios.get(`${BASE_URL}products/`, getConfig);
  return response.data;
};

// Fetch single inventory item by ID
export const fetchInventoryById = async (id) => {
  const response = await axios.get(`${BASE_URL}products/${id}/`, getConfig);
  return response.data;
};

// Restock an inventory item
export const restockInventory = async (id, restockData) => {
  const response = await axios.post(`${BASE_URL}products/${id}/restock/`, restockData, modifyConfig);
  return response.data;
};

// Record a sale for an inventory item
export const sellInventory = async (id, saleData) => {
  const response = await axios.post(`${BASE_URL}products/${id}/sale/`, saleData, modifyConfig);
  return response.data;
};

// Fetch item types
export const fetchItemTypes = async () => {
  const response = await axios.get(`${BASE_URL}itemtypes/`, getConfig);
  return response.data;
};

// Fetch categories
export const fetchCategories = async () => {
  const response = await axios.get(`${BASE_URL}categories/`, getConfig);
  return response.data;
};

// Fetch branches
export const fetchBranches = async () => {
  const response = await axios.get(`${BASE_URL}branches/`, getConfig);
  return response.data;
};

// Fetch inventory requests
export const fetchRequests = async () => {
  const response = await axios.get(`${BASE_URL}requests/`, getConfig);
  return response.data;
};

// Accept inventory request
export const acceptRequest = async (requestId, amount) => {
  const response = await axios.post(
    `${BASE_URL}requests/${requestId}/accept/`,
    { amount },  // ✅ Send amount in request body
    modifyConfig
  );
  return response.data;
};


// Reject inventory request
export const rejectRequest = async (requestId) => {
  const response = await axios.post(`${BASE_URL}requests/${requestId}/reject/`, {}, modifyConfig);
  return response.data;
};

// Cancel inventory request
export const cancelRequest = async (requestId) => {
  // If you have a cancel endpoint, use it. Otherwise, fallback to PATCH status.
  try {
    // Try POST to /requests/<id>/cancel/
    const response = await axios.post(
      `${BASE_URL}requests/${requestId}/cancel/`,
      {},
      modifyConfig
    );
    return response.data;
  } catch (err) {
    // If 404, fallback to PATCH status: 'cancelled'
    if (err.response && err.response.status === 404) {
      const patchRes = await axios.patch(
        `${BASE_URL}requests/${requestId}/`,
        { status: 'cancelled' },
        modifyConfig
      );
      return patchRes.data;
    }
    throw err;
  }
};

// Update inventory request (e.g., change quantity, unit, etc.)
export const updateRequest = async (requestId, updateData) => {
  const response = await axios.patch(
    `${BASE_URL}requests/${requestId}/`,
    updateData,
    modifyConfig
  );
  return response.data;
};

// Fetch stocks
export const fetchStocks = async () => {
  const response = await axios.get(`${BASE_URL}stocks/`, getConfig);
  return response.data;
};

// Mark request as reached
export const ReachRequest = async (id) => {
  const response = await axios.post(`${BASE_URL}requests/${id}/reach/`, null, modifyConfig);
  return response.data;
};

// Mark request as not reached
export const NotReachRequest = async (id) => {
  const response = await axios.post(`${BASE_URL}requests/${id}/not_reach/`, null, modifyConfig);
  return response.data;
};
export const createItemType = async (typeName) => {
  const response = await axiosInstance.post('/api/inventory/itemtypes/', {
    type_name: typeName,
  });
  return response.data;
};

const addNewCategory = async (categoryName, itemTypeId) => {
  try {
    const response = await axiosInstance.post('/inventory/categories/', {
      category_name: categoryName,
      item_type: itemTypeId,
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error creating category:', error.response?.data || error.message);
    throw error;
  }
};

export const fetchProductMeasurements = async (productId) => {
  const response = await axios.get(`${BASE_URL}productmeasurements/?product=${productId}`, getConfig);
  return response.data;
};

// Reduce bartender inventory when order is printed
export const reduceBartenderInventory = async (orderId) => {
  const response = await axios.post(`${BASE_URL}reduce-bartender-inventory/`, {
    order_id: orderId
  }, modifyConfig);
  return response.data;
};

// Fetch barman stock for beverages
export const fetchBarmanStock = async () => {
  const response = await axios.get(`${BASE_URL}barman-stock/`, getConfig);
  return response.data;
};