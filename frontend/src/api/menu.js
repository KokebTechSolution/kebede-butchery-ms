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
        const response = await axiosInstance.get('/menu/menuitems/');
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching menu items:', error);
        throw error;
    }
};

// Fetch menu items by type (food/beverage)
export const fetchMenuItemsByType = async (itemType) => {
    try {
        const response = await axiosInstance.get(`/menu/menuitems/?item_type=${itemType}`);
        return response.data;
    } catch (error) {
        console.error(`❌ Error fetching ${itemType} menu items:`, error);
        throw error;
    }
};

// Fetch available categories (from inventory)
export const fetchMenuCategories = async (itemType = null) => {
    try {
        const url = itemType 
            ? `/menu/menuitems/categories/?item_type=${itemType}`
            : '/menu/menuitems/categories/';
        const response = await axiosInstance.get(url);
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching menu categories:', error);
        throw error;
    }
};

// Fetch available products (from inventory)
export const fetchAvailableProducts = async (categoryId = null) => {
    try {
        const url = categoryId 
            ? `/menu/menuitems/available_products/?category=${categoryId}`
            : '/menu/menuitems/available_products/';
        const response = await axiosInstance.get(url);
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching available products:', error);
        throw error;
    }
};

// Create a new menu item
export const createMenuItem = async (menuItemData) => {
    try {
        const response = await axiosInstance.post('/menu/menuitems/', menuItemData);
        return response.data;
    } catch (error) {
        console.error('❌ Error creating menu item:', error);
        throw error;
    }
};

// Update a menu item
export const updateMenuItem = async (id, menuItemData) => {
    try {
        const response = await axiosInstance.put(`/menu/menuitems/${id}/`, menuItemData);
        return response.data;
    } catch (error) {
        console.error('❌ Error updating menu item:', error);
        throw error;
    }
};

// Delete a menu item
export const deleteMenuItem = async (id) => {
    try {
        const response = await axiosInstance.delete(`/menu/menuitems/${id}/`);
        return response.data;
    } catch (error) {
        console.error('❌ Error deleting menu item:', error);
        throw error;
    }
};

// Get a single menu item
export const getMenuItem = async (id) => {
    try {
        const response = await axiosInstance.get(`/menu/menuitems/${id}/`);
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching menu item:', error);
        throw error;
    }
};

// Create item type
export const createItemType = async (typeName) => {
    try {
        const response = await axiosInstance.post('inventory/itemtypes/', {
            type_name: typeName,
        });
        return response.data;
    } catch (error) {
        console.error('❌ Error creating item type:', error);
        throw error;
    }
};

// Create inventory category
export const createInventoryCategory = async (categoryName, itemTypeId) => {
    try {
        const response = await axiosInstance.post('inventory/categories/', {
            category_name: categoryName,
            item_type: itemTypeId,
        });
        return response.data;
    } catch (error) {
        console.error('❌ Error creating inventory category:', error);
        throw error;
    }
};