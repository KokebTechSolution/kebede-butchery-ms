import React, { useEffect, useState, useRef } from 'react';
import { getMyOrders } from '../../../api/cashier'; // adjust path as needed
import NotificationPopup from '../../../components/NotificationPopup.jsx';
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
  ClipboardList
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

const OrderList = ({ onSelectOrder, selectedOrderId, refreshKey }) => {
  const [orders, setOrders] = useState([]);
  const [filterDate, setFilterDate] = useState(getTodayDateString());
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'printed'
  const [manualRefreshKey, setManualRefreshKey] = useState(0); // for manual refresh
  const [showNotification, setShowNotification] = useState(false);
  const [notificationOrder, setNotificationOrder] = useState(null);
  const [loading, setLoading] = useState(false);
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

  const handleRefresh = () => {
    setManualRefreshKey(prev => prev + 1);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      {showNotification && notificationOrder && (
        <NotificationPopup
          message="New order received!"
          orderNumber={notificationOrder.order_number}
          tableName={notificationOrder.table_name || notificationOrder.table || 'N/A'}
          soundSrc="/notification.mp3"
          onClose={() => setShowNotification(false)}
        />
      )}
      
      {/* Stats Cards */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
      >
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600">Total</p>
              <p className="text-lg font-bold text-blue-800">{stats.total}</p>
            </div>
            <div className="p-1 bg-blue-100 rounded">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-orange-600">Pending</p>
              <p className="text-lg font-bold text-orange-800">{stats.pending}</p>
            </div>
            <div className="p-1 bg-orange-100 rounded">
              <Clock className="w-4 h-4 text-orange-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-600">Printed</p>
              <p className="text-lg font-bold text-green-800">{stats.printed}</p>
            </div>
            <div className="p-1 bg-green-100 rounded">
              <Printer className="w-4 h-4 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-600">Total</p>
              <p className="text-lg font-bold text-purple-800">${stats.totalAmount.toFixed(2)}</p>
            </div>
            <div className="p-1 bg-purple-100 rounded">
              <DollarSign className="w-4 h-4 text-purple-600" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-2">Orders</h2>
        <p className="text-gray-600">Manage and track customer orders</p>
      </motion.div>

      {/* Filters */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 space-y-4"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="order-date-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="order-date-filter"
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          <div className="flex-1">
            <label htmlFor="order-status-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Status Filter
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                id="order-status-filter"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending Orders</option>
                <option value="printed">Printed Orders</option>
              </select>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </motion.div>

      {/* Orders List */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {filteredOrders.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
            <p className="text-gray-500 mb-2">No orders found for the selected date.</p>
            <p className="text-sm text-gray-400">
              Try selecting a different date or check if orders have been placed today.
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {filteredOrders.map(order => {
              const isSelected = order.id === selectedOrderId;
              return (
                <motion.div
                  key={order.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    onClick={() => {
                      console.log('Order clicked:', order.id, order);
                      onSelectOrder(order.id);
                    }}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 shadow-lg' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(order.cashier_status)}
                          <span className="font-semibold text-gray-900">#{order.order_number}</span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(order.cashier_status)}`}>
                          {getStatusLabel(order.cashier_status)}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          Table {order.table_name || order.table || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {order.created_at ? new Date(order.created_at).toLocaleTimeString() : 'N/A'}
                        </div>
                        {order.total_amount && (
                          <div className="text-sm font-semibold text-green-600">
                            ${order.total_amount.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </motion.div>

      {/* Summary */}
      {filteredOrders.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 pt-4 border-t border-gray-200"
        >
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Total Orders: {filteredOrders.length}</span>
            <span>
              {filteredOrders.filter(o => o.cashier_status === 'pending').length} pending
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default OrderList; 