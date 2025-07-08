// src/api/inventory.js

import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api/inventory/';
const INVENTORY_URL = `${BASE_URL}inventory/`;
const getToken = () => localStorage.getItem('access');

const axiosConfig = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
  },
});

// Fetch all inventory items
export const fetchInventory = async () => {
  const response = await axios.get(INVENTORY_URL, axiosConfig());
  return response.data;
};

// Fetch single inventory item by ID
export const fetchInventoryById = async (id) => {
  const response = await axios.get(`${INVENTORY_URL}${id}/`, axiosConfig());
  return response.data;
};

// Restock an inventory item
export const restockInventory = async (id, restockData) => {
  const response = await axios.post(`${INVENTORY_URL}${id}/restock/`, restockData, axiosConfig());
  return response.data;
};

// Record a sale for an inventory item
export const sellInventory = async (id, saleData) => {
  const response = await axios.post(`${INVENTORY_URL}${id}/sale/`, saleData, axiosConfig());
  return response.data;
};

// Fetch item types
export const fetchItemTypes = async () => {
  const response = await axios.get(`${BASE_URL}itemtypes/`, axiosConfig());
  return response.data;
};

// Fetch categories
export const fetchCategories = async () => {
  const response = await axios.get(`${BASE_URL}categories/`, axiosConfig());
  return response.data;
};

// Fetch branches
export const fetchBranches = async () => {
  const response = await axios.get(`${BASE_URL}branches/`, axiosConfig());
  return response.data;
};

// Fetch inventory requests
export const fetchRequests = async () => {
  const response = await axios.get(`${BASE_URL}requests/`, axiosConfig());
  return response.data;
};

// Accept inventory request
export const acceptRequest = async (requestId) => {
  const response = await axios.post(
    `${BASE_URL}requests/${requestId}/accept/`,
    {}, // empty POST body
    axiosConfig()
  );
  return response.data;
};

// Reject inventory request
export const rejectRequest = async (requestId) => {
  const response = await axios.post(
    `${BASE_URL}requests/${requestId}/reject/`,
    {}, // empty POST body
    axiosConfig()
  );
  return response.data;
};

// Fetch stocks
export const fetchStocks = async () => {
  const response = await axios.get(`${BASE_URL}stocks/`, axiosConfig());
  return response.data;
};
