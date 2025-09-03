import React, { createContext, useContext, useState, useCallback } from 'react';

const DataCacheContext = createContext();

export const DataCacheProvider = ({ children }) => {
  const [cache, setCache] = useState({
    menuItems: null,
    barmanStock: null,
    lastFetched: {
      menuItems: null,
      barmanStock: null,
    },
    cacheExpiry: {
      menuItems: 5 * 60 * 1000, // 5 minutes for menu items
      barmanStock: 2 * 60 * 1000, // 2 minutes for stock (more dynamic)
    }
  });

  // Check if cache is still valid
  const isCacheValid = useCallback((key) => {
    const lastFetched = cache.lastFetched[key];
    const expiry = cache.cacheExpiry[key];
    
    if (!lastFetched) return false;
    
    const now = Date.now();
    return (now - lastFetched) < expiry;
  }, [cache.lastFetched, cache.cacheExpiry]);

  // Get cached data if valid
  const getCachedData = useCallback((key) => {
    if (isCacheValid(key)) {
      return cache[key];
    }
    return null;
  }, [cache, isCacheValid]);

  // Set cached data
  const setCachedData = useCallback((key, data) => {
    setCache(prev => ({
      ...prev,
      [key]: data,
      lastFetched: {
        ...prev.lastFetched,
        [key]: Date.now(),
      }
    }));
  }, []);

  // Clear specific cache
  const clearCache = useCallback((key) => {
    setCache(prev => ({
      ...prev,
      [key]: null,
      lastFetched: {
        ...prev.lastFetched,
        [key]: null,
      }
    }));
  }, []);

  // Clear all cache
  const clearAllCache = useCallback(() => {
    setCache({
      menuItems: null,
      barmanStock: null,
      lastFetched: {
        menuItems: null,
        barmanStock: null,
      },
      cacheExpiry: {
        menuItems: 5 * 60 * 1000,
        barmanStock: 2 * 60 * 1000,
      }
    });
  }, []);

  // Force refresh specific cache
  const forceRefresh = useCallback((key) => {
    clearCache(key);
  }, [clearCache]);

  // Get cache status
  const getCacheStatus = useCallback(() => {
    return {
      menuItems: {
        hasData: !!cache.menuItems,
        isValid: isCacheValid('menuItems'),
        lastFetched: cache.lastFetched.menuItems,
        expiry: cache.cacheExpiry.menuItems,
      },
      barmanStock: {
        hasData: !!cache.barmanStock,
        isValid: isCacheValid('barmanStock'),
        lastFetched: cache.lastFetched.barmanStock,
        expiry: cache.cacheExpiry.barmanStock,
      }
    };
  }, [cache, isCacheValid]);

  return (
    <DataCacheContext.Provider
      value={{
        getCachedData,
        setCachedData,
        clearCache,
        clearAllCache,
        forceRefresh,
        isCacheValid,
        getCacheStatus,
      }}
    >
      {children}
    </DataCacheContext.Provider>
  );
};

export const useDataCache = () => {
  const context = useContext(DataCacheContext);
  if (!context) {
    throw new Error('useDataCache must be used within a DataCacheProvider');
  }
  return context;
};
