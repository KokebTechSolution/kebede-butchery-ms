import React, { useEffect, useState } from 'react';
import { getMyOrders } from '../../../api/cashier'; // adjust path as needed
import './OrderList.css';

const getTodayDateString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const OrderList = ({ onSelectOrder, selectedOrderId, refreshKey }) => {
  const [orders, setOrders] = useState([]);
  const [filterDate, setFilterDate] = useState(getTodayDateString());
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'printed'
  const [manualRefreshKey, setManualRefreshKey] = useState(0); // for manual refresh

  const fetchOrders = async (date) => {
    try {
      // If getMyOrders can accept a date, pass it; otherwise, filter client-side
      const data = await getMyOrders(date);
      setOrders(data);
    } catch (error) {
      setOrders([]);
    }
  };

  useEffect(() => {
    fetchOrders(filterDate);
    // eslint-disable-next-line
  }, [filterDate, refreshKey, manualRefreshKey]);

  // Sort orders descending by order_number (or created_at if available)
  const sortedOrders = [...orders].sort((a, b) => {
    if (b.order_number && a.order_number) {
      return b.order_number.localeCompare(a.order_number);
    }
    if (b.created_at && a.created_at) {
      return new Date(b.created_at) - new Date(a.created_at);
    }
    return 0;
  });

  // Filter orders by status
  const filteredOrders = sortedOrders.filter(order => {
    if (!order.order_number) return false;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return order.cashier_status !== 'printed';
    if (statusFilter === 'printed') return order.cashier_status === 'printed';
    return true;
  });

  return (
    <div className="order-list-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label htmlFor="order-date-filter" style={{ marginRight: 8 }}>Filter by Date:</label>
          <input
            id="order-date-filter"
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
          />
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <label htmlFor="order-status-filter" style={{ marginRight: 8 }}>Status:</label>
          <select
            id="order-status-filter"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="printed">Printed</option>
          </select>
        </div>
      </div>
      <h2>Orders</h2>
      {filteredOrders.length === 0 ? (
        <p className="no-orders-message">No orders placed yet.</p>
      ) : (
        <div className="order-list">
          {filteredOrders.map(order => (
            <div
              key={order.id}
              className={`order-list-item ${order.id === selectedOrderId ? 'active' : ''}`}
              onClick={() => onSelectOrder(order.id)}
            >
              <span className="order-list-item-id">{order.order_number}</span>
              <span className="order-list-item-status">{order.cashier_status || 'N/A'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderList; 