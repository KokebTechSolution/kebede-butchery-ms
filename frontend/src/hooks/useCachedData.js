import { useState, useEffect } from 'react';
import { useDataCache } from '../context/DataCacheContext';

/**
 * Custom hook to easily use cached data in components
 * @param {string} dataType - The type of data to fetch (e.g., 'tables', 'menuItems')
 * @param {boolean} autoFetch - Whether to fetch automatically on mount
 * @returns {object} - { data, loading, error, refresh }
 */
export const useCachedData = (dataType, autoFetch = true) => {
  const { 
    getCachedData, 
    isLoading, 
    hasError,
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
    fetchRequests
  } = useDataCache();
  
  const [data, setData] = useState([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  // Get the fetch function for this data type
  const getFetchFunction = () => {
    switch (dataType) {
      case 'tables': return fetchTables;
      case 'menuItems': return fetchMenuItems;
      case 'inventory': return fetchInventory;
      case 'categories': return fetchCategories;
      case 'itemTypes': return fetchItemTypes;
      case 'stocks': return fetchStocks;
      case 'branches': return fetchBranches;
      case 'orders': return fetchOrders;
      case 'users': return fetchUsers;
      case 'barmanStock': return fetchBarmanStock;
      case 'requests': return fetchRequests;
      default: return null;
    }
  };

  // Fetch data function
  const fetchCachedData = async (forceRefresh = false) => {
    const fetchFunction = getFetchFunction();
    if (!fetchFunction) {
      throw new Error(`No fetch function found for ${dataType}`);
    }
    
    setLocalLoading(true);
    setLocalError(null);
    
    try {
      const result = await fetchFunction(forceRefresh);
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

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchCachedData();
    }
  }, [autoFetch]);

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
    fetchData: fetchCachedData
  };
};

// Convenience hooks for specific data types
export const useTables = (autoFetch = true) => {
  return useCachedData('tables', autoFetch);
};

export const useMenuItems = (autoFetch = true) => {
  return useCachedData('menuItems', autoFetch);
};

export const useInventory = (autoFetch = true) => {
  return useCachedData('inventory', autoFetch);
};

export const useCategories = (autoFetch = true) => {
  return useCachedData('categories', autoFetch);
};

export const useItemTypes = (autoFetch = true) => {
  return useCachedData('itemTypes', autoFetch);
};

export const useStocks = (autoFetch = true) => {
  return useCachedData('stocks', autoFetch);
};

export const useBranches = (autoFetch = true) => {
  return useCachedData('branches', autoFetch);
};

export const useOrders = (autoFetch = true) => {
  return useCachedData('orders', autoFetch);
};

export const useUsers = (autoFetch = true) => {
  return useCachedData('users', autoFetch);
};

export const useBarmanStock = (autoFetch = true) => {
  return useCachedData('barmanStock', autoFetch);
};

export const useRequests = (autoFetch = true) => {
  return useCachedData('requests', autoFetch);
};
