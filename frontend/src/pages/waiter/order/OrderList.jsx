import React, { useState, useEffect, useRef } from 'react';
import { getMyOrders } from '../../../api/cashier'; // adjust path as needed
import axiosInstance from '../../../api/axiosInstance';
import { 
  FileText, 
  Calendar, 
  Filter, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Search,
  Users,
  Coffee,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
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
  const [tables, setTables] = useState({});
  const [filterDate, setFilterDate] = useState(getTodayDateString());
  const [statusFilter, setStatusFilter] = useState('all');
  const [manualRefreshKey, setManualRefreshKey] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationOrder, setNotificationOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOnlyUnavailable, setShowOnlyUnavailable] = useState(false);
  const prevOrderIdsRef = useRef([]);
  const pollingRef = useRef(null);
  
  // Get current user from auth context
  const { user } = useAuth();
  
  // Handle order selection
  const handleOrderSelect = (order) => {
    if (!order || !order.id) return;
    
    const tableId = order.table?.toString() || 'unknown';
    const tableInfo = tables[tableId] || {};
    
    console.log('Table info:', { tableId, tableInfo, order });
    
    // Only proceed if table is not available
    if (tableInfo.status === 'available') {
      console.log('Skipping selection for available table');
      return;
    }
    
    console.log('Selecting order:', order.id, 'for table:', tableId);
    setSelectedOrder(order);
    setShowOnlyUnavailable(true);
    
    // Ensure onSelectOrder is called with the order ID
    if (onSelectOrder && typeof onSelectOrder === 'function') {
      onSelectOrder(order.id);
    } else {
      console.error('onSelectOrder is not a function or not provided');
    }
  };
  
  // Reset view to show all non-available tables with orders
  const resetView = () => {
    setSelectedOrder(null);
    setShowOnlyUnavailable(false);
    onSelectOrder(null);
    
    // Refresh the orders list
    fetchOrders();
  };
  
  // Fetch tables from API
  const fetchTables = async () => {
    try {
      const response = await axiosInstance.get('/branches/tables/');
      // Convert tables to a map for easier lookup
      const tablesMap = {};
      response.data.forEach(table => {
        tablesMap[table.number] = table;
      });
      setTables(tablesMap);
    } catch (err) {
      console.error('Failed to fetch tables:', err);
      setTables({});
    }
  };
  
  // Fetch tables on component mount
  useEffect(() => {
    fetchTables();
  }, []);

  const fetchOrders = async (date) => {
    try {
      // Ensure user is authenticated before fetching orders
      if (!user || !user.isAuthenticated) {
        console.warn('[DEBUG] OrderList: User not authenticated, cannot fetch orders');
        setOrders([]);
        return [];
      }
      
      console.log(`[DEBUG] OrderList: Fetching orders for user ${user.username} on ${date}`);
      const data = await getMyOrders(date);
      
      // Backend now properly filters by user, so no need for client-side filtering
      console.log(`[DEBUG] OrderList: Received ${data.length} orders from backend for user ${user.username}`);
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

  // Check if an order is considered unfinished
  const isUnfinishedOrder = (order) => {
    if (!order) return false;
    const status = order.cashier_status?.toLowerCase() || '';
    const tableStatus = order.tableStatus?.toLowerCase() || '';
    
    // Consider an order unfinished if:
    // 1. It's not in a terminal state, AND
    // 2. The table is occupied or in ordering state
    const isTerminalState = ['printed', 'ready_for_payment', 'completed', 'paid', 'cancelled'].includes(status);
    const isTableOccupied = ['occupied', 'ordering', 'ready_to_pay'].includes(tableStatus);
    
    return !isTerminalState && isTableOccupied;
  };

  // Group orders by table and get the most recent order for each table
  const getGroupedAndFilteredOrders = (allOrders) => {
    const tableGroups = {};
    
    // First, filter out invalid orders and map to include table info
    const ordersWithTableInfo = allOrders
      .filter(order => order && order.id)
      .map(order => {
        const tableId = order.table?.toString() || 'unknown';
        const tableInfo = tables[tableId] || {};
        return {
          ...order,
          tableId,
          tableStatus: tableInfo.status || 'unknown',
          tableName: order.table_name || `Table ${tableId}`,
          tableSeats: tableInfo.seats || 0
        };
      });
    
    // Filter to only include occupied tables with active orders
    const filteredOrders = ordersWithTableInfo.filter(order => {
      // Skip orders from available tables
      if (order.tableStatus === 'available') {
        return false;
      }
      
      // If showing a specific table (after selection), only show that table
      if (showOnlyUnavailable && selectedOrder) {
        return order.tableId === selectedOrder.table?.toString();
      }
      
      // Otherwise, only show tables with unfinished orders
      return isUnfinishedOrder(order);
    });
    
    // If showing only unavailable tables and no selected order, return empty
    if (showOnlyUnavailable && !selectedOrder) {
      return [];
    }
    
    // Group orders by table
    filteredOrders.forEach(order => {
      const tableId = order.tableId;
      
      if (!tableGroups[tableId]) {
        tableGroups[tableId] = {
          id: tableId,
          tableName: order.tableName,
          tableStatus: order.tableStatus,
          seats: order.tableSeats,
          orders: [],
          latestOrder: order,
          orderCount: 0,
          unfinishedOrderCount: 0
        };
      }
      
      tableGroups[tableId].orders.push(order);
      tableGroups[tableId].orderCount++;
      
      if (isUnfinishedOrder(order)) {
        tableGroups[tableId].unfinishedOrderCount++;
      }
      
      // Update latest order if this one is newer
      if (order.created_at && (!tableGroups[tableId].latestOrder.created_at || 
          new Date(order.created_at) > new Date(tableGroups[tableId].latestOrder.created_at))) {
        tableGroups[tableId].latestOrder = order;
      }
    });
    
    // Convert to array and filter out tables with no active orders
    const tableGroupsArray = Object.values(tableGroups).filter(group => {
      // Only include tables with at least one unfinished order
      return group.unfinishedOrderCount > 0;
    });
    
    // Sort by table name for better organization
    return tableGroupsArray
      .sort((a, b) => {
        const nameA = a.tableName?.toLowerCase() || '';
        const nameB = b.tableName?.toLowerCase() || '';
        return nameA.localeCompare(nameB);
      })
      .map(group => ({
        id: group.latestOrder.id,
        tableId: group.id,
        tableName: group.tableName,
        tableStatus: group.tableStatus,
        seats: group.seats,
        orderCount: group.orders.length,
        unfinishedOrderCount: group.orders.filter(o => isUnfinishedOrder(o)).length,
        hasUnfinishedOrders: group.unfinishedOrderCount > 0,
        created_at: group.latestOrder.created_at,
        cashier_status: group.latestOrder.cashier_status,
        total: group.latestOrder.total,
        table: group.id // For backward compatibility
      }));
    
    // Sort all orders by created_at (newest first)
    const sortedOrders = [...filteredOrders]
      .filter(order => order.order_number)
      .sort((a, b) => {
        if (b.created_at && a.created_at) {
          return new Date(b.created_at) - new Date(a.created_at);
        }
        return 0;
      });
    
    // Group by table and keep only the most recent order for each table
    sortedOrders.forEach(order => {
      const tableId = order.table?.toString() || 'unknown';
      const tableName = order.table_name || `Table ${tableId}`;
      const tableInfo = tables[tableId] || {};
      
      // Skip if table is marked as available
      if (tableInfo.status === 'available') {
        return;
      }
      
      // Only process if we haven't seen this table yet or if this order is newer
      if (!tableGroups[tableId] || 
          (order.created_at && (!tableGroups[tableId].created_at || 
           new Date(order.created_at) > new Date(tableGroups[tableId].created_at)))) {
        
        // Get all orders for this table
        const tableOrders = filteredOrders.filter(o => 
          (o.table?.toString() || 'unknown') === tableId
        );
        
        // Count unfinished orders for this table
        const unfinishedOrders = tableOrders.filter(isUnfinishedOrder);
        
        // Only include tables with unfinished orders
        if (unfinishedOrders.length > 0) {
          tableGroups[tableId] = {
            ...order,
            id: order.id, // Use the actual order ID
            tableName,
            tableStatus: tableInfo.status || 'unknown',
            status: order.cashier_status, // Keep the original order status
            seats: tableInfo.seats || 0,
            orderCount: tableOrders.length,
            unfinishedOrderCount: unfinishedOrders.length,
            hasUnfinishedOrders: true
          };
        }
      }
    });
    
    // Convert to array and sort by table name
    let result = Object.values(tableGroups).sort((a, b) => {
      const nameA = a.tableName?.toLowerCase() || '';
      const nameB = b.tableName?.toLowerCase() || '';
      return nameA.localeCompare(nameB);
    });
    
    // Apply status filter if needed
    if (statusFilter === 'pending') {
      result = result.filter(order => isUnfinishedOrder(order));
    } else if (statusFilter === 'printed') {
      result = result.filter(order => !isUnfinishedOrder(order));
    }
    
    return result;
  };
  
  const filteredOrders = getGroupedAndFilteredOrders(orders);

  const getStatusStats = () => {
    // Get today's date for daily analytics
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate stats from TODAY'S orders only for the logged-in user
    const todaysOrders = orders.filter(order => {
      if (!order.order_number) return false;
      
      // Check if order is from today
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      return orderDate === today;
    });
    
    const todaysPending = todaysOrders.filter(order => 
      order.cashier_status !== 'printed' && 
      order.cashier_status !== 'ready_for_payment'
    ).length;
    
    const todaysPrinted = todaysOrders.filter(order => 
      order.cashier_status === 'printed' || 
      order.cashier_status === 'ready_for_payment'
    ).length;
    
    const todaysTotal = todaysOrders.length;
    
    // Also calculate filtered stats for display
    const filteredTotal = filteredOrders.length;
    
    console.log(`[DEBUG] Daily Analytics for ${user?.username}: Today=${today}, Total=${todaysTotal}, Pending=${todaysPending}, Completed=${todaysPrinted}`);
    
    return { 
      pending: todaysPending, 
      printed: todaysPrinted, 
      total: todaysTotal,
      filteredTotal 
    };
  };

  const stats = getStatusStats();

  const getStatusIcon = (status) => {
    switch (status) {
      case 'printed':
      case 'ready_for_payment':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
      case 'preparing':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'completed':
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 border-gray-200 text-gray-800';
    
    const statusLower = status.toLowerCase();
    
    switch (statusLower) {
      case 'printed':
      case 'ready_for_payment':
        return 'bg-green-100 border-green-200 text-green-800';
      case 'pending':
      case 'preparing':
      case 'ordering':
        return 'bg-orange-100 border-orange-200 text-orange-800';
      case 'completed':
      case 'paid':
        return 'bg-blue-100 border-blue-200 text-blue-800';
      case 'available':
        return 'bg-gray-100 border-gray-200 text-gray-800';
      case 'occupied':
        return 'bg-red-100 border-red-200 text-red-800';
      default:
        return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {showNotification && notificationOrder && (
        <NotificationPopup
          message="New order received!"
          orderNumber={notificationOrder.order_number}
          tableName={notificationOrder.table_name || notificationOrder.table || 'N/A'}
          soundSrc="/notification.mp3"
          onClose={() => setShowNotification(false)}
        />
      )}

      {/* User Identity Header */}
      {user && user.username && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-center space-x-3">
            <div className="bg-indigo-100 p-2 rounded-full">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-indigo-800">
                📋 {user.first_name || user.username}'s Orders
              </h2>
              <p className="text-sm text-indigo-600">
                Viewing orders assigned to you only
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Today's Orders</p>
              <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
              <p className="text-xs text-blue-600 mt-1">📅 {new Date().toLocaleDateString()}</p>
            </div>
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Today's Pending</p>
              <p className="text-2xl font-bold text-orange-800">{stats.pending}</p>
              <p className="text-xs text-orange-600 mt-1">⏳ In progress</p>
            </div>
            <Clock className="w-6 h-6 text-orange-600" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Today's Completed</p>
              <p className="text-2xl font-bold text-green-800">{stats.printed}</p>
              <p className="text-xs text-green-600 mt-1">✅ Finished today</p>
            </div>
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Filter Controls */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
          <h3 className="font-semibold text-gray-800 flex items-center text-sm sm:text-base">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
            <span className="truncate">Filter Orders</span>
          </h3>
          <div className="text-xs sm:text-sm text-gray-600">
            {stats.filteredTotal !== stats.total ? (
              <span className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full font-medium text-xs sm:text-sm">
                Showing {stats.filteredTotal} of {stats.total}
              </span>
            ) : (
              <span className="text-gray-500 text-xs sm:text-sm">
                All {stats.total} orders
              </span>
            )}
          </div>
        </div>
        
        {/* Mobile-First Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Mobile-Optimized Date Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
              <span className="truncate">Select Date:</span>
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="w-full px-3 sm:px-4 py-3 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 touch-manipulation"
            />
          </div>
          
          {/* Mobile-Optimized Status Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Search className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
              <span className="truncate">Filter by Status:</span>
            </label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 sm:px-4 py-3 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 touch-manipulation"
            >
              <option value="all">📋 All Orders</option>
              <option value="pending">⏳ Pending Orders</option>
              <option value="printed">✅ Completed Orders</option>
            </select>
          </div>
        </div>
        
        {/* Quick Filter Buttons */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-3">Quick Filters:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setFilterDate(getTodayDateString());
                setStatusFilter('all');
              }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                filterDate === getTodayDateString() && statusFilter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📅 Today's Orders
            </button>
            
            <button
              onClick={() => {
                setFilterDate(getTodayDateString());
                setStatusFilter('pending');
              }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                filterDate === getTodayDateString() && statusFilter === 'pending'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ⏳ Today's Pending
            </button>
            
            <button
              onClick={() => {
                setFilterDate(getTodayDateString());
                setStatusFilter('printed');
              }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                filterDate === getTodayDateString() && statusFilter === 'printed'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ✅ Today's Completed
            </button>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="mt-4 flex justify-between items-center">
          {/* Clear Filters Button */}
          {(statusFilter !== 'all' || filterDate !== getTodayDateString()) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setFilterDate(getTodayDateString());
              }}
              className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl transition-all duration-200 transform hover:scale-105"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Clear All Filters</span>
            </button>
          )}
          
          {/* Refresh Button */}
          <button
            onClick={() => setManualRefreshKey(prev => prev + 1)}
            className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl transition-all duration-200 transform hover:scale-105 ml-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Orders</span>
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <div className="bg-purple-100 p-2 rounded-full">
            <Coffee className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-purple-800 mb-2">How to Manage Orders:</h3>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• <strong>Click on any order</strong> to view its details and items</li>
              <li>• <strong>Orange orders</strong> are still being prepared in the kitchen</li>
              <li>• <strong>Green orders</strong> are ready and have been printed</li>
              <li>• Use the date filter to see orders from different days</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Active Filters Indicator */}
      {(statusFilter !== 'all' || filterDate !== getTodayDateString()) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-yellow-100 p-2 rounded-full">
                <Filter className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-yellow-800">Active Filters:</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {filterDate !== getTodayDateString() && (
                    <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-lg text-sm">
                      📅 Date: {new Date(filterDate).toLocaleDateString()}
                    </span>
                  )}
                  {statusFilter !== 'all' && (
                    <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-lg text-sm">
                      🔍 Status: {statusFilter === 'pending' ? 'Pending Orders' : 'Completed Orders'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setStatusFilter('all');
                setFilterDate(getTodayDateString());
              }}
              className="text-yellow-600 hover:text-yellow-800 font-medium text-sm underline"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Back button when showing unavailable tables */}
      {showOnlyUnavailable && (
        <button
          onClick={resetView}
          className="mb-4 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to all orders
        </button>
      )}
      
      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {orders.length === 0 ? 'No Orders Yet' : 'No Orders Match Your Filters'}
          </h3>
          <p className="text-gray-500 mb-4">
            {orders.length === 0 
              ? `No orders have been placed for ${new Date(filterDate).toLocaleDateString()} yet.`
              : `No orders match your current filter settings.`
            }
          </p>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 max-w-md mx-auto">
            <p className="text-sm text-blue-700">
              💡 <strong>Try:</strong> 
              {orders.length === 0 
                ? ' Check if any orders have been placed today or select a different date.'
                : ' Change your filter settings above or clear all filters to see more orders.'
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map(order => {
            const isSelected = order.id === selectedOrderId;
            return (
              <div
                key={order.id}
                className={`p-4 rounded-xl border-2 transition-all duration-200 transform ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50 shadow-lg' 
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                } ${
                  order.tableStatus !== 'available' 
                    ? 'cursor-pointer hover:scale-102 border-red-200 bg-red-50' 
                    : 'opacity-70 cursor-not-allowed'
                }`}
                onClick={() => {
                  if (order.tableStatus === 'available') {
                    return; // Don't do anything for available tables
                  }
                  console.log('Order clicked:', order.id, order);
                  handleOrderSelect(order);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full ${
                      isSelected ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {getStatusIcon(order.cashier_status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between space-x-2">
                        <h4 className="font-semibold text-gray-800 text-lg truncate">
                          {order.tableName}
                        </h4>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(order.cashier_status)}`}>
                          {getStatusLabel(order.cashier_status)}
                        </span>
                      </div>
                      
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                          {order.unfinishedOrderCount} active {order.unfinishedOrderCount === 1 ? 'order' : 'orders'}
                        </span>
                        
                        {order.orderCount > order.unfinishedOrderCount && (
                          <span className="inline-flex items-center bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            {order.orderCount - order.unfinishedOrderCount} completed
                          </span>
                        )}
                      </div>
                      
                      {order.created_at && (
                        <p className="mt-1 text-xs text-gray-500">
                          Last update: {new Date(order.created_at).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                      getStatusColor(order.cashier_status)
                    }`}>
                      {getStatusLabel(order.cashier_status)}
                    </span>
                    {isSelected && (
                      <p className="text-xs text-blue-600 mt-2 font-medium">
                        👆 Selected - View details on the right
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Live Update Indicator */}
      <div className="fixed bottom-4 right-4">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">
              Auto-updating every 5 seconds
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderList; 