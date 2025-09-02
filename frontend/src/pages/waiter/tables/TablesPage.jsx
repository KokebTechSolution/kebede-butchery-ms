import React, { useState, useEffect } from 'react';
import TableCard from '../../../components/TableCard.jsx';
import '../../../App.css';
import { useTables, useOrders } from '../../../hooks/useCachedData';
import axiosInstance from '../../../api/axiosInstance';

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
  const { data: tables, loading: tablesLoading, error: tablesError, refresh: refreshTables } = useTables();
  const { data: orders, loading: ordersLoading, error: ordersError, refresh: refreshOrders } = useOrders();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [seats, setSeats] = useState(4); // Default seats for new table
  const [isMobile, setIsMobile] = useState(false);

  // Combine loading states
  const isLoading = tablesLoading || ordersLoading;
  
  // Debug logging
  useEffect(() => {
    console.log('🔍 [TablesPage] Cache Status:', {
      tablesCount: tables?.length || 0,
      ordersCount: orders?.length || 0,
      tablesLoading,
      ordersLoading,
      tablesError,
      ordersError
    });
  }, [tables, orders, tablesLoading, ordersLoading, tablesError, ordersError]);
  
  // Combine errors
  useEffect(() => {
    if (tablesError) setError(tablesError);
    if (ordersError) setError(ordersError);
  }, [tablesError, ordersError]);

  // Detect mobile viewport to position the FAB appropriately
  useEffect(() => {
    const updateIsMobile = () => setIsMobile(window.innerWidth <= 768);
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  // Handle adding a new table, auto-increment table number
  const handleAddTable = async () => {
    setLoading(true);
    setError('');
    try {
      // Calculate next table number by highest existing number + 1
      const maxNumber = tables.length > 0 ? Math.max(...tables.map(t => t.number)) : 0;
      const nextNumber = maxNumber + 1;

      const response = await axiosInstance.post('/branches/tables/', {
        number: nextNumber,
        seats: seats,
        status: 'available',
      });

      // Refresh tables from cache to get the updated data
      await refreshTables();
    } catch (err) {
      console.error('Failed to add table:', err);
      setError('Failed to add table.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content white-bg">
      <div className="table-header">
        <h1>Tables</h1>
        {/* Show refresh button */}
        <button 
          onClick={() => { refreshTables(); refreshOrders(); }}
          style={{
            padding: '8px 16px',
            background: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      <div className="table-section">
        {/* Show loading state */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px', color: '#666' }}>
            <div>🔄 Loading tables...</div>
            <div style={{ fontSize: '14px', marginTop: '10px' }}>
              First time loading - this will be cached for instant access later!
            </div>
          </div>
        ) : (
          <>
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
            
            {/* Show cache status */}
            {tables.length > 0 && (
              <div style={{ 
                textAlign: 'center', 
                marginTop: '20px', 
                fontSize: '12px', 
                color: '#888',
                padding: '10px',
                background: '#f5f5f5',
                borderRadius: '4px'
              }}>
                📦 {tables.length} tables loaded from cache • Navigate freely - no more loading!
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        style={{
          position: 'fixed',
          bottom: isMobile ? 64 : 32, // sit closer to bottom nav on mobile
          right: isMobile ? 'auto' : 32,
          left: isMobile ? '70%' : 'auto', // shift left to avoid overlapping Orders
          transform: isMobile ? 'translateX(-50%)' : 'none',
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: '#1976d2',
          color: 'white',
          fontSize: 32,
          border: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          zIndex: 1100,
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
    </div>
  );
};

export default TablesPage;
