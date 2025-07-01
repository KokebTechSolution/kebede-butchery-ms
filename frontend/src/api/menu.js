// src/api/menu.js

import axiosInstance from './axiosInstance';

// ========== API METHODS ========== //

// Fetch all menus
export const fetchMenus = async () => {
    try {
        const response = await axiosInstance.get('menu/menus/');
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching menus:', error);
        throw error;
    }
};

// Fetch available items for a specific menu
export const fetchMenuAvailableItems = async (menuId) => {
    try {
        const response = await axiosInstance.get(`menu/menus/${menuId}/available_items/`);
        return response.data;
    } catch (error) {
        console.error(`❌ Error fetching available items for menu ${menuId}:`, error);
        throw error;
    }
};

// Fetch a single menu by ID
export const fetchMenuById = async (menuId) => {
    try {
        const response = await axiosInstance.get(`menu/menus/${menuId}/`);
        return response.data;
    } catch (error) {
        console.error(`❌ Error fetching menu with ID ${menuId}:`, error);
        throw error;
    }
};

// Create a new menu
export const createMenu = async (menuData) => {
    try {
        const response = await axiosInstance.post('menu/menus/', menuData);
        return response.data;
    } catch (error) {
        console.error('❌ Error creating menu:', error);
        throw error;
    }
};

// Update an existing menu
export const updateMenu = async (menuId, menuData) => {
    try {
        const response = await axiosInstance.patch(`menu/menus/${menuId}/`, menuData);
        return response.data;
    } catch (error) {
        console.error(`❌ Error updating menu with ID ${menuId}:`, error);
        throw error;
    }
};

// Delete a menu
export const deleteMenu = async (menuId) => {
    try {
        const response = await axiosInstance.delete(`menu/menus/${menuId}/`);
        return response.data;
    } catch (error) {
        console.error(`❌ Error deleting menu with ID ${menuId}:`, error);
        throw error;
    }
};

// Fetch all menu items
export const fetchMenuItems = async () => {
    try {
        const response = await axiosInstance.get('menu/menuitems/');
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching menu items:', error);
        throw error;
    }
};

// Create a new menu item
export const createMenuItem = async (menuItemData) => {
    try {
        const response = await axiosInstance.post('menu/menuitems/', menuItemData);
        return response.data;
    } catch (error) {
        console.error('❌ Error creating menu item:', error);
        throw error;
    }
};

// Update a menu item
export const updateMenuItem = async (id, menuItemData) => {
    try {
        const response = await axiosInstance.patch(`menu/menuitems/${id}/`, menuItemData);
        return response.data;
    } catch (error) {
        console.error(`❌ Error updating menu item with ID ${id}:`, error);
        throw error;
    }
};

// Delete a menu item
export const deleteMenuItem = async (id) => {
    try {
        const response = await axiosInstance.delete(`menu/menuitems/${id}/`);
        return response.data;
    } catch (error) {
        console.error(`❌ Error deleting menu item with ID ${id}:`, error);
        throw error;
    }
};

// Fetch all menu categories
export const fetchMenuCategories = async () => {
    try {
        const response = await axiosInstance.get('menu/menucategories/');
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching menu categories:', error);
        throw error;
    }
};

// Create a new menu category
export const createMenuCategory = async (categoryData) => {
    try {
        const response = await axiosInstance.post('menu/menucategories/', categoryData);
        return response.data;
    } catch (error) {
        console.error('❌ Error creating menu category:', error);
        throw error;
    }
};


