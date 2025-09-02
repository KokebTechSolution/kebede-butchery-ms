// Cache utility for localStorage-based caching
// Data is cached until print icon is clicked or manually cleared

const CACHE_KEYS = {
  MENU_ITEMS: 'cached_menu_items',
  BARMAN_STOCK: 'cached_barman_stock',
  TABLES: 'cached_tables',
  ORDERS: 'cached_orders',
  LAST_CACHE_TIME: 'last_cache_time',
  PRINT_TRIGGER: 'print_trigger'
};

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export class CacheManager {
  // Check if cache is valid (not expired and not triggered by print)
  static isCacheValid(key) {
    try {
      const lastCacheTime = localStorage.getItem(CACHE_KEYS.LAST_CACHE_TIME);
      const printTrigger = localStorage.getItem(CACHE_KEYS.PRINT_TRIGGER);
      
      if (!lastCacheTime) return false;
      
      const timeSinceLastCache = Date.now() - parseInt(lastCacheTime);
      const isExpired = timeSinceLastCache > CACHE_DURATION;
      const wasPrinted = printTrigger === 'true';
      
      // Cache is invalid if expired or if print was triggered
      return !isExpired && !wasPrinted;
    } catch (error) {
      console.error('Error checking cache validity:', error);
      return false;
    }
  }

  // Get cached data if valid
  static getCachedData(key) {
    try {
      if (!this.isCacheValid(key)) {
        return null;
      }
      
      const cachedData = localStorage.getItem(key);
      return cachedData ? JSON.parse(cachedData) : null;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  // Set cached data with timestamp
  static setCachedData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      localStorage.setItem(CACHE_KEYS.LAST_CACHE_TIME, Date.now().toString());
      // Reset print trigger when new data is cached
      localStorage.setItem(CACHE_KEYS.PRINT_TRIGGER, 'false');
      console.log(`✅ Data cached successfully for: ${key}`);
    } catch (error) {
      console.error('Error setting cached data:', error);
    }
  }

  // Clear specific cache
  static clearCache(key) {
    try {
      localStorage.removeItem(key);
      console.log(`🗑️ Cache cleared for: ${key}`);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Clear all caches
  static clearAllCaches() {
    try {
      Object.values(CACHE_KEYS).forEach(key => {
        if (key !== 'PRINT_TRIGGER') {
          localStorage.removeItem(key);
        }
      });
      console.log('🗑️ All caches cleared');
    } catch (error) {
      console.error('Error clearing all caches:', error);
    }
  }

  // Mark print as triggered (invalidates all caches)
  static triggerPrint() {
    try {
      localStorage.setItem(CACHE_KEYS.PRINT_TRIGGER, 'true');
      console.log('🖨️ Print triggered - all caches invalidated');
    } catch (error) {
      console.error('Error triggering print:', error);
    }
  }

  // Reset print trigger (allows caching again)
  static resetPrintTrigger() {
    try {
      localStorage.setItem(CACHE_KEYS.PRINT_TRIGGER, 'false');
      console.log('🔄 Print trigger reset - caching enabled again');
    } catch (error) {
      console.error('Error resetting print trigger:', error);
    }
  }

  // Get cache status for debugging
  static getCacheStatus() {
    try {
      const lastCacheTime = localStorage.getItem(CACHE_KEYS.LAST_CACHE_TIME);
      const printTrigger = localStorage.getItem(CACHE_KEYS.PRINT_TRIGGER);
      const menuItems = localStorage.getItem(CACHE_KEYS.MENU_ITEMS);
      const barmanStock = localStorage.getItem(CACHE_KEYS.BARMAN_STOCK);
      
      return {
        lastCacheTime: lastCacheTime ? new Date(parseInt(lastCacheTime)).toLocaleString() : 'Never',
        printTrigger: printTrigger === 'true',
        hasMenuItems: !!menuItems,
        hasBarmanStock: !!barmanStock,
        isCacheValid: this.isCacheValid(CACHE_KEYS.MENU_ITEMS)
      };
    } catch (error) {
      console.error('Error getting cache status:', error);
      return { error: 'Failed to get cache status' };
    }
  }
}

// Specific cache functions for common data types
export const cacheMenuItems = (data) => CacheManager.setCachedData(CACHE_KEYS.MENU_ITEMS, data);
export const getCachedMenuItems = () => CacheManager.getCachedData(CACHE_KEYS.MENU_ITEMS);

export const cacheBarmanStock = (data) => CacheManager.setCachedData(CACHE_KEYS.BARMAN_STOCK, data);
export const getCachedBarmanStock = () => CacheManager.getCachedData(CACHE_KEYS.BARMAN_STOCK);

export const cacheTables = (data) => CacheManager.setCachedData(CACHE_KEYS.TABLES, data);
export const getCachedTables = () => CacheManager.getCachedData(CACHE_KEYS.TABLES);

export const cacheOrders = (data) => CacheManager.setCachedData(CACHE_KEYS.ORDERS, data);
export const getCachedOrders = () => CacheManager.getCachedData(CACHE_KEYS.ORDERS);

export const triggerPrintCache = () => CacheManager.triggerPrint();
export const resetPrintCache = () => CacheManager.resetPrintTrigger();
export const clearAllCaches = () => CacheManager.clearAllCaches();
