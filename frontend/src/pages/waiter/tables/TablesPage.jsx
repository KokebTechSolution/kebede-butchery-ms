import React, { useState, useEffect, useRef } from 'react';
import TableCard from '../../../components/TableCard.jsx';
import '../../../App.css';
import axiosInstance from '../../../api/axiosInstance';
import { getMyOrders } from '../../../api/cashier';

// Cache for tables and orders data
let tablesCache = null;
let ordersCache = null;
let lastTablesFetch = 0;
let lastOrdersFetch = 0;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache duration

const getTableStatus = (table, orders) => {
  // Find all orders for this table (matching by table.number)
  const tableOrders = orders.filter(order => order.table_number === table.number);
  if (tableOrders.length === 0) return 'available';

  // Sort by created_at descending to get latest order
  tableOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const latestOrder = tableOrders[0];

  if (latestOrder.has_payment) return 'available';
  if (latestOrder.cashier_status === 'printed') return 'ready_to_pay';
  return 'ordering';
};

const TablesPage = ({ onSelectTable }) => {
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [seats, setSeats] = useState(4); // Default seats for new table
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const mountedRef = useRef(true);

  // Check if cache is still valid
  const isCacheValid = (lastFetch) => {
    return Date.now() - lastFetch < CACHE_DURATION;
  };

  // Fetch tables from API
  const fetchTables = async (forceRefresh = false) => {
    // Use cached data if available and not forcing refresh
    if (!forceRefresh && tablesCache && isCacheValid(lastTablesFetch)) {
      console.log('📋 Using cached tables data');
      setTables(tablesCache);
      return;
    }

    try {
      console.log('📋 Fetching fresh tables data from API');
      const response = await axiosInstance.get('/branches/tables/');
      const tablesData = response.data;
      
      // Update cache
      tablesCache = tablesData;
      lastTablesFetch = Date.now();
      
      if (mountedRef.current) {
        setTables(tablesData);
      }
    } catch (err) {
      console.error('Failed to fetch tables:', err);
      if (mountedRef.current) {
        setTables([]);
        setError('Failed to fetch tables.');
      }
    }
  };

  // Fetch orders from API
  const fetchOrders = async (forceRefresh = false) => {
    // Use cached data if available and not forcing refresh
    if (!forceRefresh && ordersCache && isCacheValid(lastOrdersFetch)) {
      console.log('📋 Using cached orders data');
      setOrders(ordersCache);
      return;
    }

    try {
      console.log('📋 Fetching fresh orders data from API');
      const data = await getMyOrders();
      
      // Update cache
      ordersCache = data;
      lastOrdersFetch = Date.now();
      
      if (mountedRef.current) {
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      if (mountedRef.current) {
        setOrders([]);
        setError('Failed to fetch orders.');
      }
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsInitialLoad(true);
      await Promise.all([
        fetchTables(),
        fetchOrders()
      ]);
      setIsInitialLoad(false);
    };

    loadData();

    // Cleanup function
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Handle adding a new table, auto-increment table number
  const handleAddTable = async () => {
    setLoading(true);
    setError('');
    try {
      // Calculate next table number by highest existing number + 1
      const maxNumber = tables.length > 0 ? Math.max(...tables.map(t => t.number)) : 0;
      const nextNumber = maxNumber + 1;

      await axiosInstance.post('/branches/tables/', {
        number: nextNumber,
        seats: seats,
        status: 'available',
      });

      // Force refresh tables after adding new table
      await fetchTables(true);
    } catch (err) {
      console.error('Failed to add table:', err);
      setError('Failed to add table.');
    } finally {
      setLoading(false);
    }
  };

  // Function to manually refresh data
  const handleRefresh = async () => {
    setError('');
    await Promise.all([
      fetchTables(true),
      fetchOrders(true)
    ]);
  };

  // Function to clear cache (useful for debugging or when data might be stale)
  const clearCache = () => {
    tablesCache = null;
    ordersCache = null;
    lastTablesFetch = 0;
    lastOrdersFetch = 0;
    console.log('🗑️ Cache cleared');
  };

  // Show cache status in console for debugging
  useEffect(() => {
    if (tablesCache) {
      console.log('📋 Tables cache status:', {
        hasData: !!tablesCache,
        lastFetched: new Date(lastTablesFetch).toLocaleTimeString(),
        cacheAge: Math.round((Date.now() - lastTablesFetch) / 1000) + 's ago',
        isValid: isCacheValid(lastTablesFetch)
      });
    }
    if (ordersCache) {
      console.log('📋 Orders cache status:', {
        hasData: !!ordersCache,
        lastFetched: new Date(lastOrdersFetch).toLocaleTimeString(),
        cacheAge: Math.round((Date.now() - lastOrdersFetch) / 1000) + 's ago',
        isValid: isCacheValid(lastOrdersFetch)
      });
    }
  }, [tables, orders]);

  // Show loading only on initial load
  if (isInitialLoad && tables.length === 0) {
    return (
      <div className="main-content white-bg">
        <div className="table-header">
          <h1>Tables</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div>Loading tables...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content white-bg">
      <div className="table-header">
        <h1>Tables</h1>
        <button
          onClick={handleRefresh}
          style={{
            background: '#4ade80',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'background 0.2s ease'
          }}
          onMouseOver={e => e.currentTarget.style.background = '#22c55e'}
          onMouseOut={e => e.currentTarget.style.background = '#4ade80'}
          title="Refresh tables and orders data"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="table-section">
        {/* You can uncomment this if you want to show the area */}
        {/* <h2 className="table-area">Dining Area</h2> */}

        <div className="table-grid modern">
          {tables
            .slice()
            .sort((a, b) => a.number - b.number)
            .map((table) => (
              <TableCard
                key={table.id}
                table={{ ...table, status: getTableStatus(table, orders) }}
                onClick={() => onSelectTable(table)}
              />
            ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        style={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: '#1976d2',
          color: 'white',
          fontSize: 32,
          border: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          zIndex: 1000,
          cursor: loading ? 'not-allowed' : 'pointer',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
        }}
        onClick={handleAddTable}
        aria-label="Add Table"
        disabled={loading}
        title={loading ? 'Adding table...' : 'Add Table'}
      >
        +
      </button>

      {/* Show error if any */}
      {error && (
        <div className="error-message" style={{ color: 'red', marginTop: 10, textAlign: 'center' }}>
          {error}
        </div>
      )}

      {/* Debug info - only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          position: 'fixed', 
          bottom: 100, 
          right: 32, 
          background: 'rgba(0,0,0,0.8)', 
          color: 'white', 
          padding: '8px', 
          borderRadius: '4px', 
          fontSize: '12px',
          zIndex: 999
        }}>
          <div>Tables: {tables.length}</div>
          <div>Orders: {orders.length}</div>
          <div>Cache: {tablesCache ? '✅' : '❌'}</div>
          <button 
            onClick={clearCache}
            style={{ 
              background: '#ef4444', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              padding: '4px 8px', 
              fontSize: '10px',
              cursor: 'pointer',
              marginTop: '4px'
            }}
          >
            Clear Cache
          </button>
        </div>
      )}
    </div>
  );
};

export default TablesPage;
