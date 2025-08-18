import React, { useState, useEffect } from 'react';
import TableCard from '../../../components/TableCard.jsx';
import '../../../App.css';
import axiosInstance from '../../../api/axiosInstance';
import { getMyOrders } from '../../../api/cashier';
import { MdTableRestaurant } from 'react-icons/md';

const getTableStatus = (table, orders) => {
  const tableOrders = orders.filter(order => {
    const orderTableNumber = order.table_number || order.table || order.table_id;
    const tableNumber = table.number || table.id;
    return orderTableNumber == tableNumber;
  });
  
  if (tableOrders.length === 0) {
    return 'available';
  }
  
  // Sort by created_at to get the latest order
  tableOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const latestOrder = tableOrders[0];
  
  // Check if the latest order has been paid
  if (latestOrder.has_payment) {
    return 'available';
  }
  
  // Check if the order has been printed (sent to cashier) - NOW TREATED AS AVAILABLE FOR NEW ORDERS
  if (latestOrder.cashier_status === 'printed') {
    return 'available'; // Changed from 'ready_to_pay' to 'available' to allow new orders
  }
  
  // If order exists but not paid and not printed, it's still ordering
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

  // Handle table selection based on status
  const handleTableSelect = (table) => {
    const tableStatus = getTableStatus(table, orders);
    
    if (tableStatus === 'available') {
      // Table is available - allow new order (including printed orders)
      onSelectTable(table);
    } else if (tableStatus === 'ordering') {
      // Table has active order - find the order and show details
      const tableOrders = orders.filter(order => {
        // Use the same improved table number matching logic
        const orderTableNumber = order.table_number || order.table || order.table_id;
        const tableNumber = table.number || table.id;
        return orderTableNumber == tableNumber; // Use == for type coercion
      });
      
      if (tableOrders.length > 0) {
        // Sort by created_at descending to get latest order
        tableOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const latestOrder = tableOrders[0];
        
        // Pass the order ID to view details instead of creating new order
        const tableWithOrderId = { ...table, status: tableStatus, orderId: latestOrder.id };
        onSelectTable(tableWithOrderId);
      } else {
        // Fallback - should not happen but just in case
        onSelectTable(table);
      }
    } else {
      // Default behavior
      onSelectTable(table);
    }
  };

  // Check if table can accept new orders
  const canTableAcceptNewOrder = (table) => {
    const tableStatus = getTableStatus(table, orders);
    return tableStatus === 'available';
  };

  // Get table status description for better UX
  const getTableStatusDescription = (table) => {
    const tableStatus = getTableStatus(table, orders);
    
    switch (tableStatus) {
      case 'available':
        return 'Ready for new orders';
      case 'ordering':
        return 'Currently taking orders';
      case 'ready_to_pay':
        return 'Ready for payment';
      case 'occupied':
        return 'Has active order';
      default:
        return 'Unknown status';
    }
  };

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
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section - Mobile Optimized */}
      <div className="text-center mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Restaurant Tables</h1>
        <p className="text-sm sm:text-base text-gray-600 px-2">Select a table to start taking orders</p>
      </div>

      {/* Add Table Button - Mobile Optimized */}
      <div className="flex justify-center mb-4 sm:mb-6 gap-2">
        <button
          onClick={handleAddTable}
          disabled={loading}
          className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <span className="text-lg sm:text-xl">+</span>
          <span className="hidden sm:inline">Add New Table</span>
          <span className="sm:hidden">Add Table</span>
        </button>
        
        <button
          onClick={() => {
            fetchTables();
            fetchOrders();
          }}
          className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <span>🔄</span>
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Tables Grid - Mobile Optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        {tables
          .slice()
          .sort((a, b) => a.number - b.number)
          .map((table) => {
            const tableStatus = getTableStatus(table, orders);
            const statusDescription = getTableStatusDescription(table);
            const canAcceptNewOrder = canTableAcceptNewOrder(table);
            
            return (
              <TableCard
                key={table.id}
                table={{ 
                  ...table, 
                  status: tableStatus,
                  statusDescription: statusDescription,
                  canAcceptNewOrder: canAcceptNewOrder
                }}
                onClick={() => handleTableSelect(table)}
                showStatusDescription={true}
              />
            );
          })}
      </div>

      {/* Empty State - Mobile Optimized */}
      {tables.length === 0 && !loading && (
        <div className="text-center py-8 sm:py-12 px-4">
          <div className="text-4xl sm:text-6xl mb-4">🍽️</div>
          <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">No tables available</h3>
          <p className="text-sm sm:text-base text-gray-600">Add your first table to get started</p>
        </div>
      )}

      {/* Error State - Mobile Optimized */}
      {error && (
        <div className="text-center py-4 px-4">
          <p className="text-sm sm:text-base text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};

export default TablesPage;
