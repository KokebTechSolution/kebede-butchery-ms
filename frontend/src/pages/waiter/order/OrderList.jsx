import React, { useEffect, useState, useRef } from 'react';
import { getMyOrders } from '../../../api/cashier'; // adjust path as needed
import { deleteOrder, updateOrderStatus, updatePaymentOption, printOrder } from '../../../api/waiterApi';
import NotificationPopup from '../../../components/NotificationPopup.jsx';
import EditOrderModal from './EditOrderModal';
import CancelOrderModal from './CancelOrderModal';
import { 
  Calendar, 
  Filter, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Printer, 
  RefreshCw,
  TrendingUp,
  DollarSign,
  Users,
  ClipboardList,
  Table as TableIcon,
  ChevronRight,
  ChevronDown,
  Edit,
  Trash2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

const getStatusIcon = (status) => {
  switch (status) {
    case 'ready_for_payment':
      return <TrendingUp className="w-4 h-4 text-blue-600" />;
    case 'printed':
      return <Printer className="w-4 h-4 text-green-600" />;
    case 'pending':
      return <Clock className="w-4 h-4 text-orange-600" />;
    default:
      return <AlertCircle className="w-4 h-4 text-gray-600" />;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'ready_for_payment':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'printed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'pending':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const OrderList = ({ onSelectOrder, selectedOrderId, refreshKey, onEditOrder }) => {
  const [orders, setOrders] = useState([]);
  const [filterDate, setFilterDate] = useState(getTodayDateString());
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'printed'
  const [manualRefreshKey, setManualRefreshKey] = useState(0); // for manual refresh
  const [showNotification, setShowNotification] = useState(false);
  const [notificationOrder, setNotificationOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedTables, setExpandedTables] = useState(new Set()); // Track which tables are expanded
  const [processingOrderId, setProcessingOrderId] = useState(null); // Track which order is being processed
  const [message, setMessage] = useState(''); // For success/error messages
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    printed: 0,
    totalAmount: 0
  });
  const prevOrderIdsRef = useRef([]);
  const pollingRef = useRef(null);

  const fetchOrders = async (date) => {
    setLoading(true);
    try {
      const data = await getMyOrders(date);
      setOrders(data);
      return data;
    } catch (error) {
      console.error(`[DEBUG] OrderList: Error fetching orders:`, error);
      setOrders([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and on filter change
  useEffect(() => {
    fetchOrders(filterDate).then((data) => {
      prevOrderIdsRef.current = data.map(order => order.id);
    });
    // eslint-disable-next-line
  }, [filterDate, refreshKey, manualRefreshKey]);

  // Listen for order update events
  useEffect(() => {
    const handleOrderUpdate = (event) => {
      console.log('OrderList: Received order update event:', event.detail);
      // Refresh orders when an order is updated
      setLoading(true);
      fetchOrders(filterDate).then((data) => {
        console.log('OrderList: Refreshed orders after update:', data);
        prevOrderIdsRef.current = data.map(order => order.id);
        setLoading(false);
      }).catch(error => {
        console.error('OrderList: Error refreshing orders after update:', error);
        setLoading(false);
      });
    };

    console.log('OrderList: Setting up orderUpdated event listener');
    window.addEventListener('orderUpdated', handleOrderUpdate);
    
    // Make the refresh function globally available
    window.refreshOrderList = () => {
      console.log('OrderList: Global refresh function called');
      setManualRefreshKey(prev => prev + 1);
    };
    
    return () => {
      console.log('OrderList: Removing orderUpdated event listener');
      window.removeEventListener('orderUpdated', handleOrderUpdate);
      delete window.refreshOrderList;
    };
  }, [filterDate]);

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

  // Update stats when orders change
  useEffect(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.cashier_status !== 'printed').length;
    const printed = orders.filter(o => o.cashier_status === 'printed').length;
    const totalAmount = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

    setStats({
      total,
      pending,
      printed,
      totalAmount
    });
  }, [orders]);

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

  // Group orders by table
  const ordersByTable = filteredOrders.reduce((acc, order) => {
    const tableNumber = order.table_number || 'No Table';
    if (!acc[tableNumber]) {
      acc[tableNumber] = [];
    }
    acc[tableNumber].push(order);
    return acc;
  }, {});

  // Convert to array and sort by table number
  const tableEntries = Object.entries(ordersByTable).sort(([a], [b]) => {
    if (a === 'No Table') return 1;
    if (b === 'No Table') return -1;
    return parseInt(a) - parseInt(b);
  });

  const handleRefresh = () => {
    setManualRefreshKey(prev => prev + 1);
  };

  const toggleTableExpansion = (tableNumber) => {
    setExpandedTables(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tableNumber)) {
        newSet.delete(tableNumber);
      } else {
        newSet.add(tableNumber);
      }
      return newSet;
    });
  };

  const handleOrderClick = (order) => {
    if (onSelectOrder) {
      onSelectOrder(order.id);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Action functions
  const handleEditOrder = async (order) => {
    // Check if order can be edited
    if (order.cashier_status === 'printed') {
      setMessage('❌ Cannot edit a printed order!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    // Check if all items are accepted
    const hasUnacceptedItems = order.items && order.items.some(item => 
      item.status !== 'accepted' && item.status !== 'rejected'
    );
    
    if (hasUnacceptedItems) {
      setMessage('❌ All order items must be accepted before editing!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setEditingOrder(order);
    setEditModalOpen(true);
  };

  const handlePrintOrder = async (order) => {
    if (order.cashier_status === 'printed') {
      setMessage('❌ This order has already been printed!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (!order.payment_option) {
      setMessage('❌ Please select a payment method before printing!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    // Check if all items are accepted
    const hasUnacceptedItems = order.items && order.items.some(item => 
      item.status !== 'accepted' && item.status !== 'rejected'
    );
    
    if (hasUnacceptedItems) {
      setMessage('❌ All order items must be accepted before printing!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setProcessingOrderId(order.id);
    try {
      const result = await printOrder(order.id);
      setMessage('✅ Order printed successfully!');
      
      // Refresh orders to show updated status
      await fetchOrders(filterDate);
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error printing order:', error);
      let errorMessage = '❌ Failed to print order. Please try again.';
      
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = `❌ ${error.response.data.error}`;
      }
      
      setMessage(errorMessage);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleCancelOrder = async (order) => {
    if (order.cashier_status === 'printed') {
      setMessage('❌ Cannot cancel a printed order!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    // Open the CancelOrderModal
    setOrderToCancel(order);
    setCancelModalOpen(true);
  };

  const handlePaymentOptionChange = async (order, paymentOption) => {
    setProcessingOrderId(order.id);
    try {
      await updatePaymentOption(order.id, paymentOption);
      setMessage(`✅ Payment method updated to ${paymentOption}!`);
      
      // Refresh orders to show updated payment option
      await fetchOrders(filterDate);
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating payment option:', error);
      setMessage('❌ Failed to update payment method. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleOrderUpdated = async (updatedOrder) => {
    // Refresh orders to show updated data
    await fetchOrders(filterDate);
    
    // Show success message
    setMessage('✅ Order updated successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingOrder(null);
  };

  const handleOrderCancelled = async (cancelledOrderId) => {
    // Refresh orders to remove the cancelled order
    await fetchOrders(filterDate);
    
    // Show success message
    setMessage('✅ Order cancelled successfully!');
    setTimeout(() => setMessage(''), 3000);
  };
  
  const handleCloseCancelModal = () => {
    setCancelModalOpen(false);
    setOrderToCancel(null);
  };

  return (
    <div className="order-list-container">
      {/* Message Display */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
            message.includes('✅') ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
          }`}
        >
          {message}
        </motion.div>
      )}

      {/* Notification Popup */}
      {showNotification && notificationOrder && (
        <NotificationPopup
          order={notificationOrder}
          onClose={() => setShowNotification(false)}
          tableName={notificationOrder.table_number || 'N/A'}
        />
      )}

      {/* Stats Cards */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
      >
        <div className="stat-card bg-gradient-to-r from-blue-500 to-blue-600">
          <div className="stat-icon">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Orders</div>
          </div>
        </div>
        
        <div className="stat-card bg-gradient-to-r from-orange-500 to-orange-600">
          <div className="stat-icon">
            <Clock className="w-6 h-6" />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
        
        <div className="stat-card bg-gradient-to-r from-green-500 to-green-600">
          <div className="stat-icon">
            <Printer className="w-6 h-6" />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.printed}</div>
            <div className="stat-label">Printed</div>
          </div>
        </div>
        
        <div className="stat-card bg-gradient-to-r from-purple-500 to-purple-600">
          <div className="stat-icon">
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="stat-content">
            <div className="stat-value">ETB {stats.totalAmount.toFixed(2)}</div>
            <div className="stat-label">Total Amount</div>
          </div>
        </div>
      </motion.div>
      
      {/* Filters */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 space-y-4"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Filter</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="printed">Printed</option>
              </select>
            </div>
          </div>
        </div>
        
        <button onClick={handleRefresh} disabled={loading} className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </motion.div>

      {/* Orders by Table */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading orders...</p>
          </div>
        ) : tableEntries.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl shadow-sm border border-gray-200">
            <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
            <p className="text-gray-600">No orders match your current filters.</p>
          </div>
        ) : (
          tableEntries.map(([tableNumber, tableOrders]) => {
            const isExpanded = expandedTables.has(tableNumber);
            const tableStats = {
              total: tableOrders.length,
              pending: tableOrders.filter(o => o.cashier_status !== 'printed').length,
              printed: tableOrders.filter(o => o.cashier_status === 'printed').length,
              totalAmount: tableOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
            };

            return (
              <motion.div
                key={tableNumber}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Table Header */}
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleTableExpansion(tableNumber)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <TableIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Table {tableNumber}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {tableStats.total} orders • {tableStats.pending} pending • ETB {tableStats.totalAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {tableStats.total} Orders
                        </div>
                        <div className="text-xs text-gray-500">
                          ETB {tableStats.totalAmount.toFixed(2)}
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Table Orders */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-gray-200"
                    >
                      <div className="p-4 space-y-3">
                        {tableOrders.map((order) => (
                          <motion.div
                            key={order.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`order-card p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                              selectedOrderId === order.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-gray-50 hover:bg-white'
                            }`}
                            onClick={() => handleOrderClick(order)}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="bg-white px-3 py-1 rounded-full border">
                                  <span className="text-sm font-semibold text-gray-700">
                                    Order #{order.order_number}
                                  </span>
                                </div>
                                <div className={`status-badge px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.cashier_status)}`}>
                                  {getStatusIcon(order.cashier_status)}
                                  <span className="ml-1">{getStatusLabel(order.cashier_status)}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-semibold text-gray-900">
                                  ETB {order.total_amount?.toFixed(2) || '0.00'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatTime(order.created_at)}
                                </div>
                              </div>
                            </div>

                            {/* Payment Option */}
                            <div className="mb-3">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method:</label>
                              <select
                                value={order.payment_option || ''}
                                onChange={(e) => handlePaymentOptionChange(order, e.target.value)}
                                disabled={processingOrderId === order.id || order.cashier_status === 'printed'}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                              >
                                <option value="">Select Payment</option>
                                <option value="cash">Cash</option>
                                <option value="online">Online</option>
                              </select>
                            </div>

                            {/* Order Items */}
                            <div className="space-y-2">
                              {order.items?.map((item, index) => (
                                <div key={index} className="flex justify-between items-center text-sm">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-gray-900">{item.name}</span>
                                    <span className="text-gray-500">× {item.quantity}</span>
                                  </div>
                                  <span className="text-gray-700 font-medium">
                                    ETB {(item.price * item.quantity).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Order Details */}
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                                <span>Created: {formatDate(order.created_at)}</span>
                                <span>Items: {order.items?.length || 0}</span>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditOrder(order);
                                  }}
                                  disabled={processingOrderId === order.id || order.cashier_status === 'printed'}
                                  className="flex-1 flex items-center justify-center space-x-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Edit className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePrintOrder(order);
                                  }}
                                  disabled={processingOrderId === order.id || order.cashier_status === 'printed' || !order.payment_option}
                                  className="flex-1 flex items-center justify-center space-x-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Printer className="w-3 h-3" />
                                  <span>Print</span>
                                </button>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelOrder(order);
                                  }}
                                  disabled={processingOrderId === order.id || order.cashier_status === 'printed'}
                                  className="flex-1 flex items-center justify-center space-x-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Cancel</span>
                                </button>
                              </div>

                              {/* Processing Indicator */}
                              {processingOrderId === order.id && (
                                <div className="mt-2 text-center">
                                  <div className="inline-flex items-center space-x-1 text-xs text-gray-600">
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                    <span>Processing...</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Edit Order Modal */}
      <EditOrderModal
        isOpen={editModalOpen}
        onClose={handleCloseEditModal}
        order={editingOrder}
        onOrderUpdated={handleOrderUpdated}
      />

      {/* Cancel Order Modal */}
      <CancelOrderModal
        isOpen={cancelModalOpen}
        onClose={handleCloseCancelModal}
        order={orderToCancel}
        onOrderCancelled={handleOrderCancelled}
      />
    </div>
  );
};

export default OrderList; 