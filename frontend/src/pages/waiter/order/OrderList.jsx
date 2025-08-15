import React, { useEffect, useState, useRef } from 'react';
import { getMyOrders } from '../../../api/cashier';
import NotificationPopup from '../../../components/NotificationPopup.jsx';
import { FaCreditCard, FaMoneyBillWave, FaPrint, FaEye, FaCalendarAlt, FaFilter } from 'react-icons/fa';
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

const getStatusColor = (status) => {
  if (!status) return 'gray';
  switch (status) {
    case 'ready_for_payment':
      return 'green';
    case 'printed':
      return 'blue';
    case 'pending':
      return 'orange';
    default:
      return 'gray';
  }
};

const getPaymentOptionIcon = (paymentOption) => {
  if (!paymentOption) return null;
  
  switch (paymentOption) {
    case 'cash':
      return <FaMoneyBillWave className="text-green-600" title="Cash Payment" />;
    case 'online':
      return <FaCreditCard className="text-blue-600" title="Online Payment" />;
    default:
      return null;
  }
};

const getPaymentOptionLabel = (paymentOption) => {
  if (!paymentOption) return 'Not Set';
  
  switch (paymentOption) {
    case 'cash':
      return 'Cash';
    case 'online':
      return 'Online';
    default:
      return paymentOption;
  }
};

const OrderList = ({ onSelectOrder, selectedOrderId, refreshKey }) => {
  const [orders, setOrders] = useState([]);
  const [filterDate, setFilterDate] = useState(getTodayDateString());
  const [statusFilter, setStatusFilter] = useState('all');
  const [manualRefreshKey, setManualRefreshKey] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationOrder, setNotificationOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const prevOrderIdsRef = useRef([]);
  const pollingRef = useRef(null);

  const fetchOrders = async (date) => {
    try {
      setIsLoading(true);
      const data = await getMyOrders(date);
      setOrders(data);
      return data;
    } catch (error) {
      console.error(`[DEBUG] OrderList: Error fetching orders:`, error);
      setOrders([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and on filter change
  useEffect(() => {
    fetchOrders(filterDate).then((data) => {
      prevOrderIdsRef.current = data.map(order => order.id);
    });
  }, [filterDate, refreshKey, manualRefreshKey]);

  // Polling for new orders
  useEffect(() => {
    pollingRef.current = setInterval(async () => {
      const data = await fetchOrders(filterDate);
      const currentIds = data.map(order => order.id);
      const prevIds = prevOrderIdsRef.current;
      const newOrderIds = currentIds.filter(id => !prevIds.includes(id));
      if (newOrderIds.length > 0) {
        const newOrder = data.find(order => order.id === newOrderIds[0]);
        setNotificationOrder(newOrder);
        setShowNotification(true);
      }
      prevOrderIdsRef.current = currentIds;
    }, 5000);
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

  const handleRefresh = () => {
    setManualRefreshKey(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-lg text-gray-600">Loading orders...</p>
      </div>
    );
  }

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

      {/* Enhanced Header Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Management</h1>
            <p className="text-indigo-600 font-medium">View and manage all customer orders</p>
          </div>
          
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <span className="text-lg">↻</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Enhanced Filters Section */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              id="order-date-filter"
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <select
              id="order-status-filter"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="printed">Printed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-600">Try selecting a different date or check if orders have been placed today.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map(order => {
            const statusColor = getStatusColor(order.cashier_status);
            const statusBgColor = `bg-${statusColor}-100`;
            const statusTextColor = `text-${statusColor}-800`;
            const statusBorderColor = `border-${statusColor}-200`;
            
            return (
              <div
                key={order.id}
                className={`bg-white rounded-xl border-2 p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                  order.id === selectedOrderId 
                    ? 'border-indigo-500 ring-2 ring-indigo-200' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => {
                  console.log('Order clicked:', order.id, order);
                  onSelectOrder(order);
                }}
              >
                {/* Order Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <span className="text-indigo-600 font-bold text-sm">#{order.order_number?.split('-')[1] || 'N/A'}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Order {order.order_number}</h3>
                      <p className="text-sm text-gray-500">Table {order.table_name || order.table || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusBgColor} ${statusTextColor} ${statusBorderColor}`}>
                    {getStatusLabel(order.cashier_status)}
                  </div>
                </div>

                {/* Payment Information */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getPaymentOptionIcon(order.payment_option)}
                    <span className="text-sm text-gray-600">
                      {getPaymentOptionLabel(order.payment_option)}
                    </span>
                  </div>
                  
                  <span className="text-xs text-gray-500">
                    {order.created_at ? new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectOrder(order);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <FaEye size={14} />
                    View Details
                  </button>
                  
                  {order.cashier_status !== 'printed' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // This will be handled by the parent component
                        console.log('Print order:', order.id);
                      }}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                      title="Print & Send to Cashier"
                    >
                      <FaPrint size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm text-center">
          <div className="text-2xl font-bold text-gray-900">{filteredOrders.length}</div>
          <div className="text-sm text-gray-600">Total Orders</div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm text-center">
          <div className="text-2xl font-bold text-orange-600">
            {filteredOrders.filter(o => o.cashier_status !== 'printed').length}
          </div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm text-center">
          <div className="text-2xl font-bold text-blue-600">
            {filteredOrders.filter(o => o.cashier_status === 'printed').length}
          </div>
          <div className="text-sm text-gray-600">Printed</div>
        </div>
      </div>
    </div>
  );
};

export default OrderList; 