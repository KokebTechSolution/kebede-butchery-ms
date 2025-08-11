import React, { useState, useEffect, useRef } from 'react';
import { FaLock, FaEdit, FaUser, FaClock, FaDollarSign, FaCheck, FaTimes, FaSync, FaClipboardList } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext.jsx';
import { useBeverages  } from '../../hooks/useBeverages';

import NotificationPopup from '../../../../components/NotificationPopup.jsx';

export const Pending = ({ orders, filterDate, setFilterDate }) => {
  const { getActiveOrders, acceptOrder, rejectOrder, acceptOrderItem, rejectOrderItem, refetch } = useBeverages(filterDate);
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

  // Use only active orders
  const allOrders = getActiveOrders()
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

  // Set initial order IDs on mount
  useEffect(() => {
    prevOrderIdsRef.current = allOrders.map(order => order.id);
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

  return (
    <div className="p-4 space-y-4">
      {showNotification && notificationOrder && (
        <NotificationPopup
          message="New order or item added!"
          orderNumber={notificationOrder.order_number}
          tableName={notificationOrder.table_number || 'N/A'}
          soundSrc="/notification.mp3"
          onClose={() => setShowNotification(false)}
        />
      )}

      {/* Mobile-Optimized Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <FaClipboardList className="text-blue-600 text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Beverage Orders</h1>
            <p className="text-sm text-gray-500">Manage incoming drink orders</p>
          </div>
        </div>
        
        <button
          onClick={refetch}
          className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm flex items-center space-x-2"
        >
                          <FaSync className="w-4 h-4" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Empty State */}
      {Object.keys(groupedByTableNumber).length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaClipboardList className="text-gray-400 text-3xl" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No active orders</h3>
          <p className="text-gray-500">All beverage orders have been processed</p>
        </div>
      ) : (
        /* Orders List */
        <div className="space-y-6">
          {tableEntries.map(([tableNum, tableOrders]) => (
            <div key={tableNum} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Table Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                    <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {tableNum}
                    </span>
                    <span>Table {tableNum}</span>
                  </h2>
                  <span className="text-sm text-gray-600 font-medium">
                    {tableOrders.length} order{tableOrders.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Orders for this table */}
              <div className="divide-y divide-gray-100">
                {tableOrders.map(order => {
                  const waiter = order.waiterName || order.created_by_username || 'Unknown';
                  const orderTotal = (
                    order.total_money && Number(order.total_money) > 0
                      ? Number(order.total_money)
                      : order.items.filter(i => i.status === 'accepted').reduce((sum, i) => sum + i.price * i.quantity, 0)
                  ).toFixed(2);
                  
                  return (
                    <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                      {/* Order Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-bold text-gray-900 text-lg">
                              #{order.order_number}
                            </h3>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                              {order.items.filter(i => i.status === 'pending').length} pending
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <FaUser className="w-3 h-3" />
                              <span>{waiter}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <FaClock className="w-3 h-3" />
                              <span>{order.created_at ? new Date(order.created_at).toLocaleTimeString() : ''}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Total</div>
                            <div className="text-xl font-bold text-blue-600 flex items-center space-x-1">
                              <FaDollarSign className="w-4 h-4" />
                              <span>{orderTotal}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Update Message */}
                      {lastUpdate.orderId === order.id && lastUpdate.message && (
                        <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                          <span className="text-sm text-green-700 font-medium">
                            {lastUpdate.message}
                          </span>
                        </div>
                      )}

                      {/* Order Items */}
                      <div className="space-y-3">
                        {order.items.map((item, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{item.name}</div>
                                <div className="text-sm text-gray-600">
                                  Qty: {item.quantity} × ETB {(Number(item.price) || 0).toFixed(2)}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-gray-900">
                                  ETB {((Number(item.price) || 0) * (Number(item.quantity) || 0)).toFixed(2)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {item.status === 'pending' && 'Pending'}
                                  {item.status === 'accepted' && 'Accepted'}
                                  {item.status === 'rejected' && 'Rejected'}
                                </div>
                              </div>
                            </div>
                            
                            {/* Action Buttons */}
                            {item.status === 'pending' && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => acceptOrderItemWithMsg(item.id, order)}
                                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                                >
                                  <FaCheck className="w-4 h-4" />
                                  <span>Accept</span>
                                </button>
                                <button
                                  onClick={() => rejectOrderItem(item.id)}
                                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                                >
                                  <FaTimes className="w-4 h-4" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            )}
                            
                            {item.status === 'accepted' && (
                              <div className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                                <FaLock className="w-4 h-4" />
                                <span className="font-medium">Accepted</span>
                              </div>
                            )}
                            
                            {item.status === 'rejected' && (
                              <div className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-100 text-red-800 rounded-lg">
                                <FaTimes className="w-4 h-4" />
                                <span className="font-medium">Rejected</span>
                              </div>
                            )}
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