import React, { useState, useEffect } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Edit3, 
  Save, 
  X, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  DollarSign,
  Users,
  Activity,
  Award,
  Star,
  BarChart3,
  Target,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../../api/axiosInstance';
import { fetchWaiterStats, updateWaiterProfile } from '../../api/waiterApi';
import { useAuth } from '../../context/AuthContext';
import './WaiterProfile.css';

const WaiterProfile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    totalEarnings: 0,
    averageRating: 0,
    todayOrders: 0,
    weeklyOrders: 0
  });
  const [activeTab, setActiveTab] = useState('info');
  const [printedOrders, setPrintedOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [orderItems, setOrderItems] = useState({}); // { orderId: [items] }
  const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 10));

  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    email: user?.email || ''
  });

  useEffect(() => {
    fetchStats();
    fetchRecentActivity();
  }, []);

  useEffect(() => {
    if (activeTab === 'activity') {
      loadPrintedOrders(filterDate);
    }
  }, [activeTab, filterDate]);

  const loadWaiterStats = async () => {
    try {
      const response = await fetchWaiterStats(user?.id);
      setStats(response);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const loadPrintedOrders = async (date = null) => {
    try {
      const orders = await fetchWaiterPrintedOrders(user?.id, 10, date);
      // Only include orders with cashier_status === 'printed'
      setPrintedOrders((orders || []).filter(order => order.cashier_status === 'printed'));
    } catch (error) {
      console.error('Error fetching activity:', error);
    }
  };

  const handleSave = async () => {
    try {
      await updateWaiterProfile(user?.id, formData);
      setMessage('Profile updated successfully!');
      setIsEditing(false);
      
      // Auto-hide message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      setMessage('Failed to update profile. Please try again.');
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone: user?.phone || '',
      email: user?.email || ''
    });
    setIsEditing(false);
    setMessage('');
  };

  const handleOrderClick = async (orderId) => {
    try {
      const response = await axiosInstance.get(`/orders/${orderId}/items/`);
      console.log('Order items:', response.data);
    } catch (error) {
      console.error('Error fetching order items:', error);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'order_completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'order_placed':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'payment_received':
        return <DollarSign className="w-4 h-4 text-purple-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'order_completed':
        return 'bg-green-50 border-green-200';
      case 'order_placed':
        return 'bg-blue-50 border-blue-200';
      case 'payment_received':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const tabs = [
    { key: 'personal', label: 'Personal Info', icon: <User className="w-4 h-4" /> },
    { key: 'stats', label: 'Statistics', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'activity', label: 'Recent Activity', icon: <Activity className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600">Manage your personal information and view statistics</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Success Message */}
      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`p-4 rounded-lg border ${
              message.includes('successfully') 
                ? 'bg-green-50 border-green-200 text-green-700' 
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              {message.includes('successfully') ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <X className="w-5 h-5" />
              )}
              <span>{message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Navigation */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200"
      >
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'personal' && (
              <motion.div
                key="personal"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                        disabled={!isEditing}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                        disabled={!isEditing}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        disabled={!isEditing}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        disabled={!isEditing}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Account Information</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    Username: <strong>{user?.username}</strong> | Role: <strong>Waiter</strong>
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm opacity-90">Total Orders</p>
                        <p className="text-2xl font-bold">{stats.totalOrders}</p>
                      </div>
                      <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                        <Users className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Card */}
        {activeTab === 'stats' && (
          <div className="profile-section">
            <div className="section-header">
              <h2>Performance Statistics</h2>
            </div>
            
            <div className="stats-grid">
              <StatCard
                icon={FaUtensils}
                title="Total Orders"
                value={stats.totalOrders ?? 0}
                color="blue"
              />
              <StatCard
                icon={FaChartLine}
                title="Total Sales"
                value={`$${(stats.totalSales ?? 0).toFixed(2)}`}
                color="green"
              />
              <StatCard
                icon={FaStar}
                title="Average Rating"
                value={`${(stats.averageRating ?? 0).toFixed(1)}/5`}
                color="yellow"
              />
              <StatCard
                icon={FaUsers}
                title="Active Tables"
                value={stats.activeTables ?? 0}
                color="purple"
              />
            </div>
          </div>
        )}

        {/* Activity Card */}
        {activeTab === 'activity' && (
          <div className="profile-section">
            <div className="section-header">
              <h2>Recent Printed Orders</h2>
            </div>
            <div className="mb-6 flex items-center gap-4">
              <label htmlFor="activity-date-filter" className="font-medium">Filter by Date:</label>
              <input
                id="activity-date-filter"
                type="date"
                value={filterDate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={e => setFilterDate(e.target.value)}
                className="p-2 border rounded"
              />
              <span className="text-xs text-gray-500">(Default: today)</span>
            </div>
            <div className="activity-list">
              {printedOrders.length === 0 && (
                <div className="activity-item">
                  <div className="activity-content">
                    <h4>No printed orders found for {filterDate}.</h4>
                  </div>
                </div>

                {/* Performance Chart Placeholder */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
                  <div className="h-48 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Performance chart will be displayed here</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'activity' && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-lg border ${getActivityColor(activity.type)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getActivityIcon(activity.type)}
                          <div>
                            <p className="font-medium text-gray-900">{activity.message}</p>
                            <p className="text-sm text-gray-600">{activity.time}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">${activity.amount}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {recentActivity.length === 0 && (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No recent activity</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default WaiterProfile; 