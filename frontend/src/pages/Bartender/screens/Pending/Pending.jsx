import React, { useState, useEffect, useRef } from 'react';
import { FaLock, FaEdit } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext.jsx';
import { useBeverages  } from '../../hooks/useBeverages';

import NotificationPopup from '../../../../components/NotificationPopup.jsx';

export const Pending = ({ orders, filterDate, setFilterDate }) => {
  // Use the orders passed from parent instead of calling useBeverages again
  const { acceptOrder, rejectOrder, acceptOrderItem, rejectOrderItem } = useBeverages(filterDate);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editingItems, setEditingItems] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationOrder, setNotificationOrder] = useState(null);
  const prevOrderIdsRef = useRef([]);
  const prevOrderItemsRef = useRef({});
  const pollingRef = useRef(null);

  const { user } = useAuth();
  const branchId = user?.branch;

  const [lastUpdate, setLastUpdate] = useState({ orderId: null, message: '' });


  // Use orders passed from parent and filter by branch
  const allOrders = (orders || [])
    .filter(order => String(order.branch_id) === String(branchId))
    .slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  console.log('Fetched orders:', allOrders);
console.log('Current branchId:', branchId);
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

  // Polling for new orders
  useEffect(() => {
    // On mount, set initial order IDs
    prevOrderIdsRef.current = allOrders.map(order => order.id);
    pollingRef.current = setInterval(() => {
      const currentOrders = orders || [];
      const currentIds = currentOrders.map(order => order.id);
      const prevIds = prevOrderIdsRef.current;
      // Find new order IDs
      const newOrderIds = currentIds.filter(id => !prevIds.includes(id));
      if (newOrderIds.length > 0) {
        // Find the newest order (assuming first in sorted list)
        const newOrder = currentOrders.find(order => order.id === newOrderIds[0]);
        setNotificationOrder(newOrder);
        setShowNotification(true);
      }
      prevOrderIdsRef.current = currentIds;
    }, 5000); // 5 seconds
    return () => clearInterval(pollingRef.current);
    // eslint-disable-next-line
  }, []);

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
        const prevItemsCount = prevOrderItemsRef.current[order.id] || 0;
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
    prevOrderItemsRef.current = {};
    for (const order of allOrders) {
      prevOrderItemsRef.current[order.id] = order.items.length;
    }
  }, [allOrders.length, allOrders.map(order => order.id).join(','), allOrders.map(order => order.items.length).join(',')]);

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
      const prevItems = prevOrderItemsMap.current[order.id] || [];
      const msg = getOrderUpdateMessage(prevItems, order.items);
      if (msg) {
        setLastUpdate({ orderId: order.id, message: msg });
      }
      prevOrderItemsMap.current[order.id] = order.items;
    });
  }, [allOrders]);

  const handleEditOrder = (order) => {
    setEditingOrderId(order.id);
    setEditingItems(order.items.map(item => ({ ...item })));
  };

  const handleCancelEdit = () => {
    setEditingOrderId(null);
    setEditingItems([]);
  };

  const handleSaveEdit = () => {
    // Implement save logic if needed
    setEditingOrderId(null);
    setEditingItems([]);
  };

  const updateEditingQuantity = (index, quantity) => {
    setEditingItems(items =>
      items.map((item, i) =>
        i === index ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  };

  // Example: Call this function after an item is updated (accept, reject, quantity change, or remove)
  const handleItemUpdate = (order, item, action) => {
    let message = '';
    if (action === 'quantity') {
      message = `Updated: ${item.name} quantity changed to ${item.quantity}`;
    } else if (action === 'remove') {
      message = `Updated: ${item.name} removed`;
    } else if (action === 'accept') {
      message = `Updated: ${item.name} accepted`;
    } else if (action === 'reject') {
      message = `Updated: ${item.name} rejected`;
    }
    setLastUpdate({ orderId: order.id, message });
  };

  // In your item update handlers, call handleItemUpdate(order, item, action)
  // For example, in acceptOrderItem:
  const acceptOrderItemWithMsg = (itemId, order) => {
    acceptOrderItem(itemId);
    const item = order.items.find(i => i.id === itemId);
    if (item) handleItemUpdate(order, item, 'accept');
  };
  // Similarly for reject, quantity, remove...

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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>
      {Object.keys(groupedByTableNumber).length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No active orders</p>
        </div>
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
                  const waiter = order.waiterName || order.created_by_username || 'Unknown';
                  return (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          Order #{order.order_number} <span style={{ color: '#888', marginLeft: 8 }}>({waiter})</span>
                        </h3>
                        <span className="text-sm text-gray-500">
                          {order.created_at ? new Date(order.created_at).toLocaleTimeString() : ''}
                        </span>
                        <span className="text-lg font-bold text-blue-700">
                          ${(
                            order.total_money && Number(order.total_money) > 0
                              ? Number(order.total_money)
                              : order.items.filter(i => i.status === 'accepted').reduce((sum, i) => sum + i.price * i.quantity, 0)
                          ).toFixed(2)}
                        </span>
                        {/* Inline update message */}
                        {lastUpdate.orderId === order.id && lastUpdate.message && (
                          <span style={{ color: '#16a34a', marginLeft: 12, fontWeight: 500 }}>
                            {lastUpdate.message}
                          </span>
                        )}
                      </div>
                      {/* Only item-level Accept/Reject below */}
                      <div className="space-y-2 mt-2">
                                                 {order.items.map((item, index) => (
                           <div key={index} className="flex flex-wrap justify-between items-center text-sm py-1 border-t pt-2 gap-2">
                             <span className="flex-1 min-w-0">{item.name} × {item.quantity}</span>
                             <span className="flex-shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                             <div className="flex-shrink-0">
                               {item.status === 'pending' && (
                                 <>
                                   <button
                                     onClick={() => acceptOrderItemWithMsg(item.id, order)}
                                     className="px-2 py-0.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 mr-1"
                                   >
                                     Accept
                                   </button>
                                   <button
                                     onClick={() => rejectOrderItem(item.id)}
                                     className="px-2 py-0.5 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                   >
                                     Reject
                                   </button>
                                 </>
                               )}
                               {item.status === 'accepted' && (
                                 <span className="text-green-700 flex items-center"><FaLock className="inline mr-1" />Accepted</span>
                               )}
                               {item.status === 'rejected' && (
                                 <span className="text-red-700">Rejected</span>
                               )}
                             </div>
                           </div>
                         ))}
                      </div>
                    </div>
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