import React, { useEffect, useState, useRef } from 'react';
import { getMyOrders } from '../../../api/cashier'; // adjust path as needed
import NotificationPopup from '../../../components/NotificationPopup.jsx';
import './OrderList.css';

const getTodayDateString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getStatusLabel = (status) => {
  if (!status) return 'N/A';
  switch (status) {
    case 'ready_for_payment':
      return 'Ready to Pay';
    case 'printed':
      return 'Printed';
    case 'pending':
      return 'Pending';
    default:
      return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
};

const OrderList = ({ onSelectOrder, selectedOrderId, refreshKey }) => {
  const [orders, setOrders] = useState([]);
  const [filterDate, setFilterDate] = useState(getTodayDateString());
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'printed'
  const [manualRefreshKey, setManualRefreshKey] = useState(0); // for manual refresh
  const [showNotification, setShowNotification] = useState(false);
  const [notificationOrder, setNotificationOrder] = useState(null);
  const prevOrderIdsRef = useRef([]);
  const pollingRef = useRef(null);

  const fetchOrders = async (date) => {
    try {
      const data = await getMyOrders(date);
      setOrders(data);
      return data;
    } catch (error) {
      console.error(`[DEBUG] OrderList: Error fetching orders:`, error);
      setOrders([]);
      return [];
    }
  };

  // Initial fetch and on filter change
  useEffect(() => {
    fetchOrders(filterDate).then((data) => {
      prevOrderIdsRef.current = data.map(order => order.id);
    });
    // eslint-disable-next-line
  }, [filterDate, refreshKey, manualRefreshKey]);

  // Polling for new orders
  useEffect(() => {
    pollingRef.current = setInterval(async () => {
      const data = await fetchOrders(filterDate);
      const currentIds = data.map(order => order.id);
      const prevIds = prevOrderIdsRef.current;
      // Find new order IDs
      const newOrderIds = currentIds.filter(id => !prevIds.includes(id));
      if (newOrderIds.length > 0) {
        // Find the newest order (assuming first in sorted list)
        const newOrder = data.find(order => order.id === newOrderIds[0]);
        setNotificationOrder(newOrder);
        setShowNotification(true);
      }
      prevOrderIdsRef.current = currentIds;
    }, 5000); // 5 seconds
    return () => clearInterval(pollingRef.current);
  }, [filterDate]);

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
      {showNotification && notificationOrder && (
        <NotificationPopup
          message="New order received!"
          orderNumber={notificationOrder.order_number}
          tableName={notificationOrder.table_name || notificationOrder.table || 'N/A'}
          soundSrc="/notification.mp3"
          onClose={() => setShowNotification(false)}
        />
      )}
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
        <div className="order-filter-status">
          <label htmlFor="order-status-filter">Status:</label>
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
        <div className="no-orders-message">
          <p>No orders found for the selected date.</p>
          <p className="text-sm text-gray-500 mt-2">
            Try selecting a different date or check if orders have been placed today.
          </p>
        </div>
      ) : (
        <div className="order-list">
          {filteredOrders.map(order => {
            return (
              <div
                key={order.id}
                className={`order-list-item ${order.id === selectedOrderId ? 'active' : ''}`}
                onClick={() => {
                  onSelectOrder(order.id);
                }}
              >
                <span className="order-list-item-id">{order.order_number}</span>
                <span className="order-list-item-status">{getStatusLabel(order.cashier_status)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderList; 