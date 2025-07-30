// src/api/menu.js

import axios from 'axios';
import { API_BASE_URL } from './config';

export const fetchMenus = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/menu/menus/`);
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching menus:', error);
        throw error;
    }
};

// Fetch available items for a specific menu
export const fetchMenuAvailableItems = async (menuId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/menu/menus/${menuId}/available_items/`);
        return response.data;
    } catch (error) {
        console.error(`❌ Error fetching available items for menu ${menuId}:`, error);
        throw error;
    }
};

// Fetch a single menu by ID
export const fetchMenuById = async (menuId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/menu/menus/${menuId}/`);
        return response.data;
    } catch (error) {
        console.error(`❌ Error fetching menu with ID ${menuId}:`, error);
        throw error;
    }
};

// Create a new menu
export const createMenu = async (menuData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/menu/menus/`, menuData);
        return response.data;
    } catch (error) {
        console.error('❌ Error creating menu:', error);
        throw error;
    }
};

// Update an existing menu
export const updateMenu = async (menuId, menuData) => {
    try {
        const response = await axios.patch(`${API_BASE_URL}/api/menu/menus/${menuId}/`, menuData);
        return response.data;
    } catch (error) {
        console.error(`❌ Error updating menu with ID ${menuId}:`, error);
        throw error;
    }
};

// Delete a menu
export const deleteMenu = async (menuId) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/api/menu/menus/${menuId}/`);
        return response.data;
    } catch (error) {
        console.error(`❌ Error deleting menu with ID ${menuId}:`, error);
        throw error;
    }
};

// Fetch all menu items
export const fetchMenuItems = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/menu/menuitems/`);
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching menu items:', error);
        throw error;
    }
};

// Create a new menu item
export const createMenuItem = async (menuItemData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/menu/menuitems/`, menuItemData);
        return response.data;
    } catch (error) {
        console.error('❌ Error creating menu item:', error);
        throw error;
    }
};

// Update a menu item
export const updateMenuItem = async (id, menuItemData) => {
    try {
        const response = await axios.patch(`${API_BASE_URL}/api/menu/menuitems/${id}/`, menuItemData);
        return response.data;
    } catch (error) {
        console.error(`❌ Error updating menu item with ID ${id}:`, error);
        throw error;
    }
};

// Delete a menu item
export const deleteMenuItem = async (id) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/api/menu/menuitems/${id}/`);
        return response.data;
    } catch (error) {
        console.error(`❌ Error deleting menu item with ID ${id}:`, error);
        throw error;
    }
};


// Create a new menu category
export const createMenuCategory = async (categoryData) => {
    try {
        const response = await axios.post('menu/menucategories/', categoryData);
        return response.data;
    } catch (error) {
        console.error('❌ Error creating menu category:', error);
        throw error;
    }
};


// Fetch inventory categories
export const fetchInventoryCategories = async () => {
  try {
    const response = await axios.get('inventory/categories/');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching inventory categories:', error);
    throw error;
  }
};





export async function syncMenuCategoriesWithInventory() {
  try {
    console.log('🔄 Starting category sync...');
    
    // Fetch inventory categories
    const inventoryResponse = await axios.get("inventory/categories/");
    const inventoryCategories = inventoryResponse.data;
    console.log('📊 Inventory categories:', inventoryCategories);

    // Fetch existing menu categories
    const menuResponse = await axios.get("menu/menucategories/");
    const menuCategories = menuResponse.data;
    console.log('📊 Existing menu categories:', menuCategories);

    const existingNames = menuCategories.map(cat => cat.name);
    console.log('📊 Existing category names:', existingNames);

    // Filter only new categories not already in menu
    const newCategories = inventoryCategories.filter(
      cat => !existingNames.includes(cat.category_name)
    );
    console.log('📊 New categories to add:', newCategories);

    // Create the missing categories
    for (const cat of newCategories) {
      console.log('➕ Creating category:', cat.category_name);
      await axios.post("menu/menucategories/", {
        name: cat.category_name
      });
    }

    console.log("✅ Sync complete:", newCategories.length, "categories added");
  } catch (error) {
    console.error("❌ Failed to sync categories:", error);
    console.error("❌ Error response:", error.response?.data);
    console.error("❌ Error status:", error.response?.status);
  }
}


// Fetch menu categories AFTER syncing
export const fetchMenuCategories = async () => {
  try {
    console.log('🔄 Fetching menu categories from /menu/menucategories/');
    const response = await axios.get('menu/menucategories/');
    console.log('✅ Menu categories response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching menu categories:', error);
    console.error('❌ Error response:', error.response?.data);
    console.error('❌ Error status:', error.response?.status);
    throw error;
  }
};
