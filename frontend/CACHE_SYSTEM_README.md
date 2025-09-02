# 🚀 Data Caching System

## Overview
This caching system prevents your app from reloading data every time you navigate between screens. Data is cached for 5 minutes and automatically reused when available.

## ✨ Benefits
- **No more loading spinners** when navigating between screens
- **Faster navigation** - data is instantly available
- **Better user experience** - smooth transitions
- **Reduced API calls** - saves bandwidth and server load
- **Offline resilience** - cached data works even if API is slow

## 🛠️ How to Use

### Option 1: Use the Simple Hooks (Recommended)

```jsx
import { useTables, useMenuItems, useInventory } from '../hooks/useCachedData';

const MyComponent = () => {
  // Automatically fetches and caches data
  const { data: tables, loading, error, refresh } = useTables();
  
  // Or disable auto-fetch and fetch manually
  const { data: menuItems, loading: menuLoading, refresh: refreshMenu } = useMenuItems(false);
  
  return (
    <div>
      {loading ? <p>Loading...</p> : (
        <div>
          {tables.map(table => <div key={table.id}>{table.number}</div>)}
          <button onClick={refresh}>Refresh Tables</button>
        </div>
      )}
    </div>
  );
};
```

### Option 2: Use the Context Directly

```jsx
import { useDataCache } from '../context/DataCacheContext';

const MyComponent = () => {
  const { 
    fetchTables, 
    getCachedData, 
    isLoading, 
    addCacheItem 
  } = useDataCache();
  
  const [tables, setTables] = useState([]);
  
  useEffect(() => {
    const loadTables = async () => {
      const data = await fetchTables();
      setTables(data);
    };
    loadTables();
  }, [fetchTables]);
  
  return (
    <div>
      {tables.map(table => <div key={table.id}>{table.number}</div>)}
    </div>
  );
};
```

## 📊 Available Hooks

| Hook | Data Type | Endpoint |
|------|-----------|----------|
| `useTables()` | Tables | `/branches/tables/` |
| `useMenuItems()` | Menu Items | `/menu/menu-items/` |
| `useInventory()` | Products | `/inventory/products/` |
| `useCategories()` | Categories | `/inventory/categories/` |
| `useItemTypes()` | Item Types | `/inventory/itemtypes/` |
| `useStocks()` | Stock Levels | `/inventory/stocks/` |
| `useBranches()` | Branches | `/inventory/branches/` |
| `useOrders()` | Orders | `/orders/order-list/` |
| `useUsers()` | Users | `/users/users/` |
| `useBarmanStock()` | Barman Stock | `/inventory/barman-stock/` |
| `useRequests()` | Requests | `/inventory/requests/` |

## 🔄 Cache Management

### Refresh Data
```jsx
const { refresh } = useTables();
<button onClick={refresh}>Refresh Tables</button>
```

### Clear Cache
```jsx
const { clearCache } = useTables();
<button onClick={clearCache}>Clear Cache</button>
```

### Force Refresh (Ignore Cache)
```jsx
const { fetchData } = useTables();
<button onClick={() => fetchData(true)}>Force Refresh</button>
```

## ⚙️ Advanced Usage

### Custom Refresh Intervals
```jsx
// Refresh every 30 seconds
const { data: orders } = useOrders(true, 30000);
```

### Manual Control
```jsx
// Don't fetch automatically
const { data: tables, fetchData } = useTables(false);

useEffect(() => {
  // Fetch when component mounts
  fetchData();
}, [fetchData]);
```

### Cache Status
```jsx
const { data, loading, error, hasData, dataCount } = useTables();

console.log('Has data:', hasData);
console.log('Data count:', dataCount);
```

## 🎯 Best Practices

1. **Use the simple hooks** (`useTables()`, `useMenuItems()`) for most cases
2. **Let data auto-fetch** on component mount (default behavior)
3. **Use refresh buttons** to let users manually update data
4. **Don't worry about cache expiration** - it's handled automatically
5. **Cache is shared globally** - all components use the same data

## 🔧 How It Works

1. **First Visit**: Data is fetched from API and cached
2. **Subsequent Visits**: Data is served from cache instantly
3. **Cache Expiry**: After 5 minutes, data is refreshed automatically
4. **Error Handling**: If API fails, cached data is used as fallback
5. **Real-time Updates**: Cache can be updated when data changes

## 🚨 Troubleshooting

### Data Not Updating?
- Use the `refresh()` function to force update
- Check if cache is expired (5 minutes)
- Verify API endpoints are correct

### Cache Not Working?
- Ensure `DataCacheProvider` wraps your app
- Check browser console for cache logs
- Verify the hook is imported correctly

### Performance Issues?
- Cache expires automatically after 5 minutes
- Use `clearCache()` to free memory if needed
- Monitor cache size in browser console

## 📝 Example: Complete Component

```jsx
import React from 'react';
import { useTables, useOrders } from '../hooks/useCachedData';

const TablesDashboard = () => {
  const { 
    data: tables, 
    loading: tablesLoading, 
    error: tablesError, 
    refresh: refreshTables 
  } = useTables();
  
  const { 
    data: orders, 
    loading: ordersLoading, 
    error: ordersError, 
    refresh: refreshOrders 
  } = useOrders();

  const handleRefresh = () => {
    refreshTables();
    refreshOrders();
  };

  if (tablesLoading || ordersLoading) {
    return <div>Loading dashboard...</div>;
  }

  if (tablesError || ordersError) {
    return <div>Error loading data</div>;
  }

  return (
    <div>
      <h1>Tables Dashboard</h1>
      <button onClick={handleRefresh}>Refresh All</button>
      
      <div>
        <h2>Tables ({tables.length})</h2>
        {tables.map(table => (
          <div key={table.id}>Table {table.number}</div>
        ))}
      </div>
      
      <div>
        <h2>Orders ({orders.length})</h2>
        {orders.map(order => (
          <div key={order.id}>Order #{order.id}</div>
        ))}
      </div>
    </div>
  );
};

export default TablesDashboard;
```

## 🎉 That's It!

Your app will now be much faster and smoother. Data will be cached and instantly available when navigating between screens!
