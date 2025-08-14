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
  const [filterDate, setFilterDate] = useState(() => {
    // Load saved date filter from localStorage
    const saved = localStorage.getItem('waiterOrderDateFilter');
    return saved || getTodayDateString();
  });
  const [statusFilter, setStatusFilter] = useState(() => {
    // Load saved status filter from localStorage
    const saved = localStorage.getItem('waiterOrderStatusFilter');
    return saved || 'all';
  });
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

  const fetchOrders = async (date, status = null) => {
    try {
      const data = await getMyOrders(date, status);
      setOrders(data);
      return data;
    } catch (error) {
      console.error(`[DEBUG] OrderList: Error fetching orders:`, error);
      setOrders([]);
      return [];
    }
  };

  // Save status filter to localStorage when it changes
  const handleStatusFilterChange = (newStatus) => {
    setStatusFilter(newStatus);
    localStorage.setItem('waiterOrderStatusFilter', newStatus);
  };

  // Save date filter to localStorage when it changes
  const handleDateFilterChange = (newDate) => {
    setFilterDate(newDate);
    localStorage.setItem('waiterOrderDateFilter', newDate);
  };

  // Initial fetch and on filter change
  useEffect(() => {
    const status = statusFilter === 'all' ? null : statusFilter;
    fetchOrders(filterDate, status).then((data) => {
      prevOrderIdsRef.current = data.map(order => order.id);
    });
    // eslint-disable-next-line
  }, [filterDate, statusFilter, refreshKey, manualRefreshKey]);

  // Listen for order update events
  useEffect(() => {
    pollingRef.current = setInterval(async () => {
      const status = statusFilter === 'all' ? null : statusFilter;
      const data = await fetchOrders(filterDate, status);
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
  }, [filterDate, statusFilter]);

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label htmlFor="order-date-filter" style={{ marginRight: 8 }}>Filter by Date:</label>
          <input
            id="order-date-filter"
            type="date"
            value={filterDate}
            onChange={e => handleDateFilterChange(e.target.value)}
          />
        </div>
        <div className="order-filter-status">
          <label htmlFor="order-status-filter">Status:</label>
          <select
            id="order-status-filter"
            value={statusFilter}
            onChange={e => handleStatusFilterChange(e.target.value)}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="printed">Printed</option>
          </select>
        </div>
      </div>
      <h2>Orders</h2>
      {sortedOrders.length === 0 ? (
        <p className="no-orders-message">No orders placed yet.</p>
      ) : (
        <div className="order-list">
          {sortedOrders.map(order => (
            <div
              key={order.id}
              className={`order-list-item ${order.id === selectedOrderId ? 'active' : ''}`}
              onClick={() => onSelectOrder(order.id)}
            >
              <span className="order-list-item-id">{order.order_number}</span>
              <span className="order-list-item-status">{getStatusLabel(order.cashier_status)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderList; 