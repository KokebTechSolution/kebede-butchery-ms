// src/api/inventory.js

import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/inventory/inventory/';

// Get token from local storage
const getToken = () => localStorage.getItem('access');

const axiosConfig = () => ({
    headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
    },
});

// ✅ Fetch all inventory items
export const fetchInventory = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}`, axiosConfig());
        return response.data;
    } catch (error) {
        console.error('Error fetching inventory:', error);
        throw error;
    }
};

// ✅ Fetch a single inventory item by ID
export const fetchInventoryById = async (id) => {
    try {
        const response = await axios.get(`${API_BASE_URL}${id}/`, axiosConfig());
        return response.data;
    } catch (error) {
        console.error(`Error fetching inventory item with ID ${id}:`, error);
        throw error;
    }
};

// ✅ Restock an inventory item
export const restockInventory = async (id, restockData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}${id}/restock/`, restockData, axiosConfig());
        return response.data;
    } catch (error) {
        console.error(`Error restocking inventory item with ID ${id}:`, error);
        throw error;
    }
};

// ✅ Record a sale for an inventory item
export const sellInventory = async (id, saleData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}${id}/sale/`, saleData, axiosConfig());
        return response.data;
    } catch (error) {
        console.error(`Error selling inventory item with ID ${id}:`, error);
        throw error;
    }
};

// ✅ Fetch item types (optional)
export const fetchItemTypes = async () => {
    try {
        const response = await axios.get('http://localhost:8000/api/inventory/itemtypes/', axiosConfig());
        return response.data;
    } catch (error) {
        console.error('Error fetching item types:', error);
        throw error;
    }
};

// ✅ Fetch categories (optional)
export const fetchCategories = async () => {
    try {
        const response = await axios.get('http://localhost:8000/api/inventory/categories/', axiosConfig());
        return response.data;  
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }
};
