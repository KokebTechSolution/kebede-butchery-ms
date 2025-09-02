import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';

const DataCacheContext = createContext();

export const useDataCache = () => {
  const context = useContext(DataCacheContext);
  if (!context) {
    throw new Error('useDataCache must be used within a DataCacheProvider');
  }
  return context;
};

export const DataCacheProvider = ({ children }) => {
  // Cache for different data types
  const [cache, setCache] = useState({
    tables: [],
    menuItems: [],
    inventory: [],
    categories: [],
    itemTypes: [],
    stocks: [],
    branches: [],
    orders: [],
    users: [],
    barmanStock: [],
    requests: []
  });

  // Loading states for each data type
  const [loading, setLoading] = useState({
    tables: false,
    menuItems: false,
    inventory: false,
    categories: false,
    itemTypes: false,
    stocks: false,
    branches: false,
    orders: false,
    users: false,
    barmanStock: false,
    requests: false
  });

  // Error states for each data type
  const [errors, setErrors] = useState({
    tables: null,
    menuItems: null,
    inventory: null,
    categories: null,
    itemTypes: null,
    stocks: null,
    branches: null,
    orders: null,
    users: null,
    barmanStock: null,
    requests: null
  });

  // Cache timestamps to know when data was last fetched
  const [cacheTimestamps, setCacheTimestamps] = useState({});

  // Cache expiration time (5 minutes)
  const CACHE_EXPIRY = 5 * 60 * 1000;

  // Check if cache is still valid
  const isCacheValid = useCallback((dataType) => {
    const timestamp = cacheTimestamps[dataType];
    if (!timestamp) return false;
    return Date.now() - timestamp < CACHE_EXPIRY;
  }, [cacheTimestamps]);

  // Generic function to fetch data with caching
  const fetchData = useCallback(async (dataType, endpoint, forceRefresh = false) => {
    // If cache is valid and not forcing refresh, return cached data
    if (!forceRefresh && isCacheValid(dataType) && cache[dataType].length > 0) {
      console.log(`📦 [Cache] Using cached ${dataType} data`);
      return cache[dataType];
    }

    // Set loading state
    setLoading(prev => ({ ...prev, [dataType]: true }));
    setErrors(prev => ({ ...prev, [dataType]: null }));

    try {
      console.log(`🔄 [Cache] Fetching ${dataType} from API...`);
      const response = await axiosInstance.get(endpoint);
      const data = response.data;

      // Update cache
      setCache(prev => ({ ...prev, [dataType]: data }));
      setCacheTimestamps(prev => ({ ...prev, [dataType]: Date.now() }));
      
      console.log(`✅ [Cache] ${dataType} data cached successfully (${data.length} items)`);
      return data;
    } catch (error) {
      console.error(`❌ [Cache] Error fetching ${dataType}:`, error);
      setErrors(prev => ({ ...prev, [dataType]: error.message }));
      
      // Return cached data if available, even if expired
      if (cache[dataType].length > 0) {
        console.log(`⚠️ [Cache] Returning expired ${dataType} data due to error`);
        return cache[dataType];
      }
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, [dataType]: false }));
    }
  }, [cache, isCacheValid]);

  // Specific fetch functions for each data type
  const fetchTables = useCallback((forceRefresh = false) => {
    return fetchData('tables', '/branches/tables/', forceRefresh);
  }, [fetchData]);

  const fetchMenuItems = useCallback((forceRefresh = false) => {
    return fetchData('menuItems', '/menu/menu-items/', forceRefresh);
  }, [fetchData]);

  const fetchInventory = useCallback((forceRefresh = false) => {
    return fetchData('inventory', '/inventory/products/', forceRefresh);
  }, [fetchData]);

  const fetchCategories = useCallback((forceRefresh = false) => {
    return fetchData('categories', '/inventory/categories/', forceRefresh);
  }, [fetchData]);

  const fetchItemTypes = useCallback((forceRefresh = false) => {
    return fetchData('itemTypes', '/inventory/itemtypes/', forceRefresh);
  }, [fetchData]);

  const fetchStocks = useCallback((forceRefresh = false) => {
    return fetchData('stocks', '/inventory/stocks/', forceRefresh);
  }, [fetchData]);

  const fetchBranches = useCallback((forceRefresh = false) => {
    return fetchData('branches', '/inventory/branches/', forceRefresh);
  }, [fetchData]);

  const fetchOrders = useCallback((forceRefresh = false) => {
    return fetchData('orders', '/orders/order-list/', forceRefresh);
  }, [fetchData]);

  const fetchUsers = useCallback((forceRefresh = false) => {
    return fetchData('users', '/users/users/', forceRefresh);
  }, [fetchData]);

  const fetchBarmanStock = useCallback((forceRefresh = false) => {
    return fetchData('barmanStock', '/inventory/barman-stock/', forceRefresh);
  }, [fetchData]);

  const fetchRequests = useCallback((forceRefresh = false) => {
    return fetchData('requests', '/inventory/requests/', forceRefresh);
  }, [fetchData]);

  // Function to refresh all data
  const refreshAllData = useCallback(async () => {
    console.log('🔄 [Cache] Refreshing all cached data...');
    try {
      await Promise.all([
        fetchTables(true),
        fetchMenuItems(true),
        fetchInventory(true),
        fetchCategories(true),
        fetchItemTypes(true),
        fetchStocks(true),
        fetchBranches(true),
        fetchOrders(true),
        fetchUsers(true),
        fetchBarmanStock(true),
        fetchRequests(true)
      ]);
      console.log('✅ [Cache] All data refreshed successfully');
    } catch (error) {
      console.error('❌ [Cache] Error refreshing all data:', error);
    }
  }, [fetchTables, fetchMenuItems, fetchInventory, fetchCategories, fetchItemTypes, fetchStocks, fetchBranches, fetchOrders, fetchUsers, fetchBarmanStock, fetchRequests]);

  // Function to clear specific cache
  const clearCache = useCallback((dataType) => {
    if (dataType) {
      setCache(prev => ({ ...prev, [dataType]: [] }));
      setCacheTimestamps(prev => ({ ...prev, [dataType]: null }));
      console.log(`🗑️ [Cache] Cleared ${dataType} cache`);
    } else {
      setCache({
        tables: [],
        menuItems: [],
        inventory: [],
        categories: [],
        itemTypes: [],
        stocks: [],
        branches: [],
        orders: [],
        users: [],
        barmanStock: [],
        requests: []
      });
      setCacheTimestamps({});
      console.log('🗑️ [Cache] Cleared all cache');
    }
  }, []);

  // Function to update specific cache item (for real-time updates)
  const updateCacheItem = useCallback((dataType, itemId, updates) => {
    setCache(prev => ({
      ...prev,
      [dataType]: prev[dataType].map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      )
    }));
    console.log(`✏️ [Cache] Updated ${dataType} item ${itemId}`);
  }, []);

  // Function to add new item to cache
  const addCacheItem = useCallback((dataType, newItem) => {
    setCache(prev => ({
      ...prev,
      [dataType]: [...prev[dataType], newItem]
    }));
    console.log(`➕ [Cache] Added new ${dataType} item`);
  }, []);

  // Function to remove item from cache
  const removeCacheItem = useCallback((dataType, itemId) => {
    setCache(prev => ({
      ...prev,
      [dataType]: prev[dataType].filter(item => item.id !== itemId)
    }));
    console.log(`➖ [Cache] Removed ${dataType} item ${itemId}`);
  }, []);

  // Get cached data without fetching
  const getCachedData = useCallback((dataType) => {
    return cache[dataType] || [];
  }, [cache]);

  // Check if data is loading
  const isLoading = useCallback((dataType) => {
    return loading[dataType] || false;
  }, [loading]);

  // Check if there's an error
  const hasError = useCallback((dataType) => {
    return errors[dataType] || null;
  }, [errors]);

  // Get cache status
  const getCacheStatus = useCallback((dataType) => {
    return {
      hasData: cache[dataType] && cache[dataType].length > 0,
      isLoading: loading[dataType] || false,
      error: errors[dataType] || null,
      lastUpdated: cacheTimestamps[dataType] || null,
      isStale: cacheTimestamps[dataType] ? Date.now() - cacheTimestamps[dataType] > CACHE_EXPIRY : true
    };
  }, [cache, loading, errors, cacheTimestamps]);

  const value = {
    // Cache data
    cache,
    
    // Fetch functions
    fetchTables,
    fetchMenuItems,
    fetchInventory,
    fetchCategories,
    fetchItemTypes,
    fetchStocks,
    fetchBranches,
    fetchOrders,
    fetchUsers,
    fetchBarmanStock,
    fetchRequests,
    
    // Cache management
    refreshAllData,
    clearCache,
    updateCacheItem,
    addCacheItem,
    removeCacheItem,
    
    // Utility functions
    getCachedData,
    isLoading,
    hasError,
    getCacheStatus,
    isCacheValid
  };

  return (
    <DataCacheContext.Provider value={value}>
      {children}
    </DataCacheContext.Provider>
  );
};
