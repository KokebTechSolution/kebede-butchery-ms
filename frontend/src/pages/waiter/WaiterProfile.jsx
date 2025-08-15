import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaChartLine, FaUtensils, FaUsers, FaStar, FaChartBar, FaHistory, FaArrowLeft, FaCrown, FaTrophy, FaMedal } from 'react-icons/fa';
import { fetchWaiterStats, fetchWaiterPrintedOrders } from '../../api/waiterApi';
import axiosInstance from '../../api/axiosInstance';
import './WaiterProfile.css';

const TABS = [
  { key: 'stats', label: 'Statistics', icon: FaChartBar, color: 'green' },
  { key: 'activity', label: 'Activity', icon: FaHistory, color: 'purple' },
];

const WaiterProfile = ({ onBack }) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSales: 0,
    averageRating: 0,
    activeTables: 0
  });
  const [activeTab, setActiveTab] = useState('stats');
  const [printedOrders, setPrintedOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [orderItems, setOrderItems] = useState({});

  useEffect(() => {
    loadWaiterStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'activity') {
      loadPrintedOrders();
    }
  }, [activeTab]);

  const loadWaiterStats = async () => {
    try {
      const statsData = await fetchWaiterStats(user?.id);
      setStats({
        totalOrders: statsData.total_orders,
        totalSales: statsData.total_sales,
        averageRating: statsData.average_rating,
        activeTables: statsData.active_tables
      });
    } catch (error) {
      console.error('Error fetching waiter stats:', error);
    }
  };

  const loadPrintedOrders = async () => {
    try {
      const orders = await fetchWaiterPrintedOrders(user?.id, 10);
      setPrintedOrders((orders || []).filter(order => order.cashier_status === 'printed'));
    } catch (error) {
      setPrintedOrders([]);
    }
  };

  const handleOrderClick = async (order) => {
    if (expandedOrderId === order.id) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(order.id);
    
    if (!orderItems[order.id]) {
      try {
        const response = await axiosInstance.get(`/orders/order-list/${order.id}/`);
        setOrderItems(prev => ({ ...prev, [order.id]: response.data.items || [] }));
      } catch (error) {
        setOrderItems(prev => ({ ...prev, [order.id]: [] }));
      }
    }
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-yellow-500';
    if (rating >= 4.0) return 'text-green-500';
    if (rating >= 3.5) return 'text-blue-500';
    return 'text-gray-500';
  };

  const getRatingIcon = (rating) => {
    if (rating >= 4.5) return <FaCrown className="text-yellow-500" />;
    if (rating >= 4.0) return <FaTrophy className="text-green-500" />;
    if (rating >= 3.5) return <FaMedal className="text-blue-500" />;
    return <FaStar className="text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header Section */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors border border-purple-200"
            >
              <FaArrowLeft size={16} />
              <span className="font-medium">Back to Dashboard</span>
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
                <FaChartBar size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Performance Profile</h1>
                <p className="text-purple-600 font-medium">View your statistics and activity</p>
              </div>
            </div>
          </div>

          {message && (
            <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
              message.includes('successfully') 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Tab Navigation */}
      <div className="bg-white rounded-xl p-2 border border-gray-200 shadow-sm">
        <div className="flex gap-2">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab.key 
                  ? `bg-${tab.color}-600 text-white shadow-md` 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mx-auto mb-3">
                  <FaUtensils size={24} className="text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalOrders}</div>
                <div className="text-sm text-gray-600">Total Orders</div>
              </div>
              
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mx-auto mb-3">
                  <FaChartLine size={24} className="text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">ETB {stats.totalSales?.toLocaleString() || '0'}</div>
                <div className="text-sm text-gray-600">Total Sales</div>
              </div>
              
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-xl mx-auto mb-3">
                  <FaStar size={24} className="text-yellow-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.averageRating || 'N/A'}</div>
                <div className="text-sm text-gray-600">Average Rating</div>
              </div>
              
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mx-auto mb-3">
                  <FaUsers size={24} className="text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.activeTables}</div>
                <div className="text-sm text-gray-600">Active Tables</div>
              </div>
            </div>

            {/* Performance Summary */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Rating Status</span>
                  <div className="flex items-center gap-2">
                    {getRatingIcon(stats.averageRating)}
                    <span className={`font-semibold ${getRatingColor(stats.averageRating)}`}>
                      {stats.averageRating || 'N/A'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Order Efficiency</span>
                  <span className="font-semibold text-green-600">
                    {stats.totalOrders > 0 ? 'Active' : 'No Orders Yet'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              
              {printedOrders.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📋</div>
                  <p className="text-gray-600">No recent activity to show</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {printedOrders.map(order => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => handleOrderClick(order)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <span className="text-green-600 font-bold text-sm">#{order.order_number?.split('-')[1] || 'N/A'}</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Order {order.order_number}</h4>
                            <p className="text-sm text-gray-500">Table {order.table_name || order.table || 'N/A'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Printed
                          </span>
                          <span className="text-xs text-gray-500">
                            {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                      
                      {expandedOrderId === order.id && orderItems[order.id] && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Order Items:</h5>
                          <div className="space-y-1">
                            {orderItems[order.id].map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-gray-600">{item.name}</span>
                                <span className="text-gray-800">x{item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaiterProfile; 