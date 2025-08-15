import React, { useState, useEffect, useRef } from 'react';
import { FaLock, FaTable, FaClock, FaUser, FaSearch, FaFilter, FaCalendarAlt, FaEye, FaEyeSlash } from 'react-icons/fa';
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
  const { getActiveOrders, getClosedOrders, acceptOrder, rejectOrder, acceptOrderItem, rejectOrderItem, cancelOrderItem, setOrderPrinted } = useOrders(filterDate);
  const allOrders = getActiveOrders().slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const [showNotification, setShowNotification] = useState(false);
  const [notificationOrder, setNotificationOrder] = useState(null);
  const [showClosed, setShowClosed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const prevOrderIdsRef = useRef([]);
  const [lastUpdate, setLastUpdate] = useState({ orderId: null, message: '' });

  // Helper to get update message
  function getOrderUpdateMessage(prevItems, currItems) {
    for (const item of currItems) {
      if (!prevItems.some(i => i.name === item.name)) {
        return `Updated: ${item.name} added`;
      }
    }
    for (const item of prevItems) {
      if (!currItems.some(i => i.name === item.name)) {
        return `Updated: ${item.name} removed`;
      }
    }
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
      prevOrderItemsMap.current[order.id] = order.items;
    });
  }, [allOrders]);

  const closedOrders = getClosedOrders().slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Notification logic: show popup when a new order is displayed in the UI or when a new item is added to an existing order
  useEffect(() => {
    const currentIds = allOrders.map(order => order.id);
    const prevIds = prevOrderIdsRef.current;
    const newOrderIds = currentIds.filter(id => !prevIds.includes(id));
    if (newOrderIds.length > 0) {
      const newOrder = allOrders.find(order => order.id === newOrderIds[0]);
      setNotificationOrder(newOrder);
      setShowNotification(true);
    } else {
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
    const aMostRecent = Math.max(...ordersA.map(o => new Date(o.created_at).getTime()));
    const bMostRecent = Math.max(...ordersB.map(o => new Date(o.created_at).getTime()));
    return bMostRecent - aMostRecent;
  });

  // Filter orders based on search and status
  const filteredTableEntries = tableEntries.filter(([tableNum, tableOrders]) => {
    const matchesSearch = searchTerm === '' || 
      tableNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tableOrders.some(order => 
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    
    const matchesStatus = statusFilter === 'all' || 
      tableOrders.some(order => 
        order.items.some(item => item.status === statusFilter)
      );
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 lg:p-8 overflow-x-hidden">
      {showNotification && notificationOrder && (
        <NotificationPopup
          message="New order or item added!"
          orderNumber={notificationOrder.order_number}
          tableName={notificationOrder.table_number || 'N/A'}
          soundSrc="/notification.mp3"
          onClose={() => setShowNotification(false)}
        />
      )}

      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-800 to-orange-600 bg-clip-text text-transparent">
              Order Management
            </h1>
            <p className="text-gray-600 mt-2">Process and manage incoming food orders efficiently</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
              className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
              title={`Switch to ${viewMode === 'table' ? 'card' : 'table'} view`}
            >
              {viewMode === 'table' ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Date Filter */}
          <div className="relative">
            <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders, tables..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all appearance-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowClosed(false)}
              className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                !showClosed 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active Orders
            </button>
            <button
              onClick={() => setShowClosed(true)}
              className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                showClosed 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Closed Orders
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {showClosed ? (
        <ClosedOrders orders={closedOrders} />
      ) : (
        <div className="space-y-8">
          {filteredTableEntries.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🍽️</div>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">No Orders Found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'No active orders for the selected date'
                }
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            filteredTableEntries.map(([tableNum, tableOrders]) => (
              <div key={tableNum} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 lg:p-8 max-w-6xl">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
                      <FaTable className="text-white text-2xl" />
                    </div>
                    <div>
                      <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Table {tableNum}</h2>
                      <p className="text-gray-600">{tableOrders.length} order{tableOrders.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <FaClock className="text-orange-500" />
                    <span>Last updated: {new Date(Math.max(...tableOrders.map(o => new Date(o.updated_at || o.created_at).getTime()))).toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {tableOrders.map(order => {
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
                        onCancelItem={cancelOrderItem}
                        onPrint={setOrderPrinted}
                        showActions={true}
                      >
                        {lastUpdate.orderId === order.id && lastUpdate.message && (
                          <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            {lastUpdate.message}
                          </span>
                        )}
                      </OrderCard>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Pending;