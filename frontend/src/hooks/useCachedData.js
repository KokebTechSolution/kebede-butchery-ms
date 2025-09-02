import { useState, useEffect } from 'react';
import { useDataCache } from '../context/DataCacheContext';

/**
 * Custom hook to easily use cached data in components
 * @param {string} dataType - The type of data to fetch (e.g., 'tables', 'menuItems')
 * @param {string} endpoint - The API endpoint to fetch from
 * @param {boolean} autoFetch - Whether to fetch automatically on mount
 * @param {number} refreshInterval - Interval to refresh data (in milliseconds)
 * @returns {object} - { data, loading, error, refresh, clearCache }
 */
export const useCachedData = (dataType, endpoint, autoFetch = true, refreshInterval = null) => {
  const { 
    getCachedData, 
    isLoading, 
    hasError, 
    fetchData,
    clearCache: clearCacheItem 
  } = useDataCache();
  
  const [data, setData] = useState([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  // Get the fetch function for this data type
  const getFetchFunction = () => {
    const fetchFunctions = {
      tables: 'fetchTables',
      menuItems: 'fetchMenuItems',
      inventory: 'fetchInventory',
      categories: 'fetchCategories',
      itemTypes: 'fetchItemTypes',
      stocks: 'fetchStocks',
      branches: 'fetchBranches',
      orders: 'fetchOrders',
      users: 'fetchUsers',
      barmanStock: 'fetchBarmanStock',
      requests: 'fetchRequests'
    };
    
    return fetchFunctions[dataType] || 'fetchData';
  };

  // Fetch data function
  const fetchCachedData = async (forceRefresh = false) => {
    setLocalLoading(true);
    setLocalError(null);
    
    try {
      const result = await fetchData(dataType, endpoint, forceRefresh);
      setData(result);
      return result;
    } catch (error) {
      setLocalError(error.message);
      // Try to get cached data as fallback
      const cachedData = getCachedData(dataType);
      if (cachedData.length > 0) {
        setData(cachedData);
        console.log(`⚠️ [Cache] Using cached ${dataType} data due to error`);
      }
      throw error;
    } finally {
      setLocalLoading(false);
    }
  };

  // Refresh data function
  const refresh = () => fetchCachedData(true);

  // Clear cache function
  const clearCache = () => {
    clearCacheItem(dataType);
    setData([]);
  };

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchCachedData();
    }
  }, [autoFetch]);

  // Set up refresh interval if specified
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(() => {
        fetchCachedData();
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  // Get current cache status
  const cacheStatus = {
    hasData: data.length > 0,
    isLoading: localLoading || isLoading(dataType),
    error: localError || hasError(dataType),
    dataCount: data.length
  };

  return {
    data,
    loading: cacheStatus.isLoading,
    error: cacheStatus.error,
    hasData: cacheStatus.hasData,
    dataCount: cacheStatus.dataCount,
    refresh,
    clearCache,
    fetchData: fetchCachedData
  };
};

// Convenience hooks for specific data types
export const useTables = (autoFetch = true) => {
  return useCachedData('tables', '/branches/tables/', autoFetch);
};

export const useMenuItems = (autoFetch = true) => {
  return useCachedData('menuItems', '/menu/menu-items/', autoFetch);
};

export const useInventory = (autoFetch = true) => {
  return useCachedData('inventory', '/inventory/products/', autoFetch);
};

export const useCategories = (autoFetch = true) => {
  return useCachedData('categories', '/inventory/categories/', autoFetch);
};

export const useItemTypes = (autoFetch = true) => {
  return useCachedData('itemTypes', '/inventory/itemtypes/', autoFetch);
};

export const useStocks = (autoFetch = true) => {
  return useCachedData('stocks', '/inventory/stocks/', autoFetch);
};

export const useBranches = (autoFetch = true) => {
  return useCachedData('branches', '/inventory/branches/', autoFetch);
};

export const useOrders = (autoFetch = true) => {
  return useCachedData('orders', '/orders/order-list/', autoFetch);
};

export const useUsers = (autoFetch = true) => {
  return useCachedData('users', '/users/users/', autoFetch);
};

export const useBarmanStock = (autoFetch = true) => {
  return useCachedData('barmanStock', '/inventory/barman-stock/', autoFetch);
};

export const useRequests = (autoFetch = true) => {
  return useCachedData('requests', '/inventory/requests/', autoFetch);
};
