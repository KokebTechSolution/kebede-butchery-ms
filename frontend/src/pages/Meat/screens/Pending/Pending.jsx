import React, { useState, useEffect, useRef } from 'react';
import { FaLock } from 'react-icons/fa';
import { useOrders } from '../../hooks/useOrders';
import NotificationPopup from '../../../../components/NotificationPopup.jsx';
import ClosedOrders from './ClosedOrders';
import { OrderCard } from '../../components/OrderCard';

const getTodayDateString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const Pending = ({ filterDate, setFilterDate }) => {
  const { getActiveOrders, getClosedOrders, acceptOrder, rejectOrder, acceptOrderItem, rejectOrderItem, setOrderPrinted } = useOrders(filterDate);
  // Use only active orders (move this to the top)
  const allOrders = getActiveOrders().slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const [showNotification, setShowNotification] = useState(false);
  const [notificationOrder, setNotificationOrder] = useState(null);
  const [showClosed, setShowClosed] = useState(false);
  const prevOrderIdsRef = useRef([]);
  const [lastUpdate, setLastUpdate] = useState({ orderId: null, message: '' });

  // Helper to get update message
  function getOrderUpdateMessage(prevItems, currItems) {
    // Find added items
    for (const item of currItems) {
      if (!prevItems.some(i => i.name === item.name)) {
        return `Updated: ${item.name} added`;
      }
    }
    // Find removed items
    for (const item of prevItems) {
      if (!currItems.some(i => i.name === item.name)) {
        return `Updated: ${item.name} removed`;
      }
    }
    // Find status/quantity changes
    for (const item of currItems) {
      const prev = prevItems.find(i => i.name === item.name);
      if (prev) {
        if (prev.status !== item.status) {
          return `Updated: ${item.name} ${item.status}`;
        }
        if (prev.quantity !== item.quantity) {
          return `Updated: ${item.name} quantity changed to ${item.quantity}`;
        }
      }
    }
    return '';
  }

  // Track previous items for each order
  const prevOrderItemsMap = useRef({});

  // After orders update, compare previous and current items for each order
  useEffect(() => {
    allOrders.forEach(order => {
      const prevItems = Array.isArray(prevOrderItemsMap.current[order.id])
        ? prevOrderItemsMap.current[order.id]
        : [];
      const msg = getOrderUpdateMessage(prevItems, order.items);
      if (msg) {
        setLastUpdate({ orderId: order.id, message: msg });
      }
      prevOrderItemsMap.current[order.id] = order.items; // Always store the array
    });
  }, [allOrders]);

  const closedOrders = getClosedOrders().slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Notification logic: show popup when a new order is displayed in the UI or when a new item is added to an existing order
  useEffect(() => {
    const currentIds = allOrders.map(order => order.id);
    const prevIds = prevOrderIdsRef.current;
    // Find new order IDs
    const newOrderIds = currentIds.filter(id => !prevIds.includes(id));
    if (newOrderIds.length > 0) {
      // Find the newest order (assuming first in sorted list)
      const newOrder = allOrders.find(order => order.id === newOrderIds[0]);
      setNotificationOrder(newOrder);
      setShowNotification(true);
    } else {
      // Check for new items in existing orders
      for (const order of allOrders) {
        const prevItemsCount = prevOrderItemsMap.current[order.id] || 0;
        const currentItemsCount = order.items.length;
        if (currentItemsCount > prevItemsCount) {
          setNotificationOrder(order);
          setShowNotification(true);
          break;
        }
      }
    }
    // Update refs
    prevOrderIdsRef.current = currentIds;
    prevOrderItemsMap.current = {};
    for (const order of allOrders) {
      prevOrderItemsMap.current[order.id] = order.items.length;
    }
  }, [allOrders.length, allOrders.map(order => order.id).join(','), allOrders.map(order => order.items.length).join(',')]);

  // Group by table_number, fallback to 'N/A' if missing
  const groupedByTableNumber = allOrders.reduce((acc, order) => {
    const tableNum = order.table_number !== undefined && order.table_number !== null ? order.table_number : 'N/A';
    if (!acc[tableNum]) acc[tableNum] = [];
    acc[tableNum].push(order);
    return acc;
  }, {});
  // Sort tables: tables with pending orders first, then by most recent order
  const tableEntries = Object.entries(groupedByTableNumber).sort(([tableA, ordersA], [tableB, ordersB]) => {
    const aHasPending = ordersA.some(order => order.items.some(item => item.status === 'pending'));
    const bHasPending = ordersB.some(order => order.items.some(item => item.status === 'pending'));
    if (aHasPending !== bHasPending) return aHasPending ? -1 : 1;
    // If both have (or don't have) pending, sort by most recent order
    const aMostRecent = Math.max(...ordersA.map(o => new Date(o.created_at).getTime()));
    const bMostRecent = Math.max(...ordersB.map(o => new Date(o.created_at).getTime()));
    return bMostRecent - aMostRecent;
  });

  return (
    <div className="p-8">
      {showNotification && notificationOrder && (
        <NotificationPopup
          message="New order or item added!"
          orderNumber={notificationOrder.order_number}
          tableName={notificationOrder.table_number || 'N/A'}
          soundSrc="/notification.mp3"
          onClose={() => setShowNotification(false)}
        />
      )}
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Orders</h1>
      <div className="mb-6 flex items-center gap-4">
        <label htmlFor="order-date-filter" className="font-medium">Filter by Date:</label>
        <input
          id="order-date-filter"
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          className="p-2 border rounded"
        />
      </div>
      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded ${!showClosed ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setShowClosed(false)}
        >
          Active Orders
        </button>
        <button
          className={`px-4 py-2 rounded ${showClosed ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setShowClosed(true)}
        >
          Closed Orders
        </button>
      </div>
      {showClosed ? (
        <ClosedOrders orders={closedOrders} />
      ) : (
        <div className="space-y-8">
          {tableEntries.map(([tableNum, tableOrders]) => (
            <div key={tableNum} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Table {tableNum}</h2>
              </div>
              <div className="space-y-4">
                {tableOrders.map(order => {
                  // Determine if there are any pending items
                  const hasPendingItems = order.items.some(item => item.status === 'pending');
                  const staff = order.waiterName || order.created_by_username || 'Unknown';
                  return (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onAcceptOrder={acceptOrder}
                      onRejectOrder={rejectOrder}
                      onAcceptItem={acceptOrderItem}
                      onRejectItem={rejectOrderItem}
                      onPrint={setOrderPrinted}
                      showActions={true}
                    >
                      {lastUpdate.orderId === order.id && lastUpdate.message && (
                        <span style={{ color: '#16a34a', marginLeft: 12, fontWeight: 500 }}>
                          {lastUpdate.message}
                        </span>
                      )}
                    </OrderCard>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Pending;