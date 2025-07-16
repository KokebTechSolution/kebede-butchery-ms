import React, { useState, useEffect, useRef } from 'react';
import { FaLock, FaEdit } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext.jsx';
import { useBeverages  } from '../../hooks/useBeverages';

import NotificationPopup from '../../../../components/NotificationPopup.jsx';


export const Pending = () => {
  const { getActiveOrders, acceptOrder, rejectOrder, acceptOrderItem, rejectOrderItem, refetch } = useBeverages ();
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editingItems, setEditingItems] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationOrder, setNotificationOrder] = useState(null);
  const prevOrderIdsRef = useRef([]);
  const prevOrderItemsRef = useRef({});
  const pollingRef = useRef(null);

  // Use only active orders
  const allOrders = getActiveOrders().slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
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
      const currentOrders = getActiveOrders();
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
                  const hasPendingItems = order.items.some(item => item.status === 'pending');
                  const waiter = order.waiterName || order.created_by_username || 'Unknown';
                  return (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-3">
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
                        </div>
                        <div className="flex items-center space-x-2">
                          {order.status === 'pending' && hasPendingItems && (
                            <button
                              onClick={() => acceptOrder(order.id)}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                            >
                              Accept
                            </button>
                          )}
                          <button
                            onClick={() => handleEditOrder(order)}
                            disabled={order.status !== 'pending'}
                            className={`p-2 rounded transition-colors ${
                              order.status === 'pending'
                                ? 'text-blue-700 hover:bg-blue-50'
                                : 'text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {order.status === 'pending' ? <FaEdit size={16} /> : <FaLock size={16} />}
                          </button>
                        </div>
                      </div>
                      {editingOrderId === order.id ? (
                        <div className="border-t pt-4">
                          <div className="space-y-3 mb-4">
                            {editingItems.map((item, index) => (
                              <div key={index} className="flex justify-between items-center">
                                <div className="flex-1">
                                  <span className="font-medium">{item.name}</span>
                                  <span className="text-gray-600 ml-2">${item.price}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {item.status === 'pending' ? (
                                    <>
                                      <button
                                        onClick={() => acceptOrderItem(item.id)}
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
                                  ) : (
                                    <span className="ml-2 text-gray-400 flex items-center">
                                      <FaLock className="inline mr-1" />
                                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                    </span>
                                  )}
                                  <span className="w-16 text-right font-medium">
                                    ${(item.price * item.quantity).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center pt-4 border-t">
                            <div className="flex space-x-2">
                              <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSaveEdit}
                                className="px-3 py-1 bg-blue-700 text-white rounded text-sm hover:bg-blue-800 transition-colors"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="space-y-2">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between items-center text-sm py-1">
                                <span>{item.name} × {item.quantity}</span>
                                <span>${(item.price * item.quantity).toFixed(2)}</span>
                                <span className="ml-4">
                                  {item.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => acceptOrderItem(item.id)}
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
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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