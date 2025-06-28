// src/api/menu.js

import axios from 'axios';

// Base URLs
const API_BASE_URL = 'http://localhost:8000/api/menu/menus/';
const MENU_ITEMS_URL = 'http://localhost:8000/api/menu/menuitems/';

// Get token from local storage
const getToken = () => {
    const token = localStorage.getItem('access');
    if (!token) {
        console.warn('⚠️ No access token found in local storage.');
    }
    return token;
};

// Global Axios instance
const api = axios.create({
    baseURL: 'http://localhost:8000/api/menu/',
    headers: { 'Content-Type': 'application/json' }
});

// Automatically add Authorization header to every request
api.interceptors.request.use(
    config => {
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            console.warn('⚠️ Request sent without Authorization header.');
        }
        return config;
    },
    error => Promise.reject(error)
);

// Global error handler (optional)
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            console.warn('⚠️ Unauthorized: Please login again.');
            // Optional: Add logout or redirect logic here
        }
        return Promise.reject(error);
    }
);

// ========== API METHODS ========== //

// Fetch all menus
export const fetchMenus = async () => {
    try {
        const response = await api.get('menus/');
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching menus:', error);
        throw error;
    }
};

// Fetch available items for a specific menu
export const fetchMenuAvailableItems = async (menuId) => {
    try {
        const response = await api.get(`menus/${menuId}/available_items/`);
        return response.data;
    } catch (error) {
        console.error(`❌ Error fetching available items for menu ${menuId}:`, error);
        throw error;
    }
};

// Fetch a single menu by ID
export const fetchMenuById = async (menuId) => {
    try {
        const response = await api.get(`menus/${menuId}/`);
        return response.data;
    } catch (error) {
        console.error(`❌ Error fetching menu with ID ${menuId}:`, error);
        throw error;
    }
};

// Create a new menu
export const createMenu = async (menuData) => {
    try {
        const response = await api.post('menus/', menuData);
        return response.data;
    } catch (error) {
        console.error('❌ Error creating menu:', error);
        throw error;
    }
};

// Update an existing menu
export const updateMenu = async (menuId, menuData) => {
    try {
        const response = await api.patch(`menus/${menuId}/`, menuData);
        return response.data;
    } catch (error) {
        console.error(`❌ Error updating menu with ID ${menuId}:`, error);
        throw error;
    }
};

// Delete a menu
export const deleteMenu = async (menuId) => {
    try {
        const response = await api.delete(`menus/${menuId}/`);
        return response.data;
    } catch (error) {
        console.error(`❌ Error deleting menu with ID ${menuId}:`, error);
        throw error;
    }
};

// Fetch all menu items
export const fetchMenuItems = async () => {
    try {
        const response = await api.get('menuitems/');
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching menu items:', error);
        throw error;
    }
};

// Create a new menu item
export const createMenuItem = async (menuItemData) => {
    try {
        const response = await api.post('menuitems/', menuItemData);
        return response.data;
    } catch (error) {
        console.error('❌ Error creating menu item:', error);
        throw error;
    }
};

// Update a menu item
export const updateMenuItem = async (id, menuItemData) => {
    try {
        const response = await api.patch(`menuitems/${id}/`, menuItemData);
        return response.data;
    } catch (error) {
        console.error(`❌ Error updating menu item with ID ${id}:`, error);
        throw error;
    }
};

// Delete a menu item
export const deleteMenuItem = async (id) => {
    try {
        const response = await api.delete(`menuitems/${id}/`);
        return response.data;
    } catch (error) {
        console.error(`❌ Error deleting menu item with ID ${id}:`, error);
        throw error;
    }
};


