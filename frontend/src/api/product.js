import axios from 'axios';

import { API_BASE_URL } from '../config/api';
const PRODUCTS_API_URL = `${API_BASE_URL}/api/products/products/`;

// Helper to get CSRF token from cookie
function getCSRFToken() {
  const match = document.cookie.match(new RegExp('(^| )csrftoken=([^;]+)'));
  return match ? match[2] : null;
}

// Axios config for session auth with CSRF
const axiosConfig = () => ({
  headers: {
    'Content-Type': 'application/json',
    'X-CSRFToken': getCSRFToken(),
  },
  withCredentials: true, // important: send cookies on cross-origin requests
});

// Get all products
export const fetchProducts = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}`, axiosConfig());
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Get single product by ID
export const fetchProductById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}${id}/`, axiosConfig());
    return response.data;
  } catch (error) {
    console.error(`Error fetching product with ID ${id}:`, error);
    throw error;
  }
};

// Create new product
export const createProduct = async (productData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}`, productData, axiosConfig());
    return response.data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

// Update product
export const updateProduct = async (id, productData) => {
  try {
    const response = await axios.patch(`${API_BASE_URL}${id}/`, productData, axiosConfig());
    return response.data;
  } catch (error) {
    console.error(`Error updating product with ID ${id}:`, error.response?.data || error);
    throw error;
  }
};

// Delete product
export const deleteProduct = async (id) => {
  try {
    await axios.delete(`${API_BASE_URL}${id}/`, axiosConfig());
  } catch (error) {
    console.error(`Error deleting product with ID ${id}:`, error);
    throw error;
  }
};

export const fetchItemTypes = async () => {
  try {
    const response = await axios.get('`${API_BASE_URL}/api/products/item-types/`', axiosConfig());
    return response.data;
  } catch (error) {
    console.error('Error fetching item types:', error);
    throw error;
  }
};
