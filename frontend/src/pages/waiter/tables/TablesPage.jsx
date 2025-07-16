import React, { useState, useEffect } from 'react';
import TableCard from '../../../components/TableCard.jsx';
import '../../../App.css';
import axiosInstance from '../../../api/axiosInstance';
import { getMyOrders } from '../../../api/cashier';

const getTableStatus = (table, orders) => {
  // Find latest order for this table
  const tableOrders = orders.filter(order => order.table_number === table.number);
  if (tableOrders.length === 0) return 'available';
  // Sort by created_at descending
  tableOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const latestOrder = tableOrders[0];
  if (latestOrder.has_payment) return 'available';
  if (latestOrder.cashier_status === 'printed') return 'ready_to_pay';
  return 'ordering';
};

const TablesPage = ({ onSelectTable }) => {
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [seats, setSeats] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTables = async () => {
    try {
      const response = await axiosInstance.get('/branches/tables/');
      setTables(response.data);
    } catch (err) {
      setTables([]);
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await getMyOrders();
      setOrders(data);
    } catch (err) {
      setOrders([]);
    }
  };

  useEffect(() => {
    fetchTables();
    fetchOrders();
  }, []);

  const handleAddTable = async () => {
    setLoading(true);
    setError('');
    try {
      // Find the highest table number
      const maxNumber = tables.length > 0 ? Math.max(...tables.map(t => t.number)) : 0;
      const nextNumber = maxNumber + 1;
      await axiosInstance.post('/branches/tables/', {
        number: tableNumber,
        seats: seats,
        status: 'available',
      });
      fetchTables();
    } catch (err) {
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
        {/* <h2 className="table-area">Dining Area</h2> */}
        <div className="table-grid modern">
          {tables
            .slice()
            .sort((a, b) => a.number - b.number)
            .map(table => (
              <TableCard key={table.id} table={{ ...table, status: getTableStatus(table, orders) }} onClick={onSelectTable} />
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
        }}
        onClick={handleAddTable}
        aria-label="Add Table"
        disabled={loading}
      >
        +
      </button>
    </div>
  );
};

export default TablesPage; 