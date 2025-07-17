import React, { useState, useEffect } from 'react';
import TableCard from '../../../components/TableCard.jsx';
import '../../../App.css';
import axiosInstance from '../../../api/axiosInstance';
import { getMyOrders } from '../../../api/cashier';

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

  // Fetch tables from API
  const fetchTables = async () => {
    try {
      const response = await axiosInstance.get('/branches/tables/');
      setTables(response.data);
    } catch (err) {
      console.error('Failed to fetch tables:', err);
      setTables([]);
      setError('Failed to fetch tables.');
    }
  };

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      const data = await getMyOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setOrders([]);
      setError('Failed to fetch orders.');
    }
  };

  // Fetch tables and orders on component mount
  useEffect(() => {
    fetchTables();
    fetchOrders();
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

      await fetchTables(); // Refresh tables after adding
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
