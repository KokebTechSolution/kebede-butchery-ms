import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaEdit, FaSave, FaTimes, FaChartLine, FaUtensils, FaUsers, FaStar, FaIdBadge, FaChartBar, FaHistory } from 'react-icons/fa';
import { fetchWaiterStats, updateWaiterProfile, fetchWaiterPrintedOrders } from '../../api/waiterApi';
import axiosInstance from '../../api/axiosInstance';
import './WaiterProfile.css';

const TABS = [
  { key: 'info', label: 'Personal Info', icon: FaIdBadge },
  { key: 'stats', label: 'Statistics', icon: FaChartBar },
  { key: 'activity', label: 'Activity', icon: FaHistory },
];

const WaiterProfile = ({ onBack }) => {
  const { user, tokens } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSales: 0,
    averageRating: 0,
    activeTables: 0
  });
  const [activeTab, setActiveTab] = useState('info');
  const [printedOrders, setPrintedOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [orderItems, setOrderItems] = useState({}); // { orderId: [items] }

  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone_number: user?.phone_number || '',
    phone: user?.phone || ''
  });

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
      // Only include orders with cashier_status === 'printed'
      setPrintedOrders((orders || []).filter(order => order.cashier_status === 'printed'));
    } catch (error) {
      setPrintedOrders([]);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
    setMessage('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone_number: user?.phone_number || '',
      phone: user?.phone || ''
    });
    setMessage('');
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');

    try {
      const updatedUserData = await updateWaiterProfile(user?.id, formData);
      
      // Update local storage and context
      const updatedUser = { ...user, ...updatedUserData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setMessage('Profile updated successfully!');
      setIsEditing(false);
      
      // Refresh the page to update the user context
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = async (order) => {
    if (expandedOrderId === order.id) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(order.id);
    // Fetch order details if not already loaded
    if (!orderItems[order.id]) {
      try {
        const response = await axiosInstance.get(`/orders/${order.id}/`);
        setOrderItems(prev => ({ ...prev, [order.id]: response.data.items || [] }));
      } catch (error) {
        setOrderItems(prev => ({ ...prev, [order.id]: [] }));
      }
    }
  };

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>
        <Icon size={24} />
      </div>
      <div className="stat-content">
        <h3 className="stat-title">{title}</h3>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="waiter-profile-container">
      <div className="profile-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Dashboard
        </button>
        <h1 className="profile-title">My Profile</h1>
      </div>

      {/* Tab Navigation */}
      <div className="profile-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`profile-tab-btn${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <tab.icon style={{ marginRight: 8 }} />
            {tab.label}
          </button>
        ))}
      </div>

      {message && (
        <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="profile-content vertical-cards">
        {/* Personal Info Card */}
        {activeTab === 'info' && (
          <div className="profile-section">
            <div className="section-header">
              <h2>Personal Information</h2>
              {!isEditing ? (
                <button className="edit-button" onClick={handleEdit}>
                  <FaEdit /> Edit Profile
                </button>
              ) : (
                <div className="edit-actions">
                  <button className="save-button" onClick={handleSave} disabled={loading}>
                    <FaSave /> {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button className="cancel-button" onClick={handleCancel}>
                    <FaTimes /> Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="profile-info">
              <div className="profile-avatar">
                <FaUser size={80} />
              </div>
              
              <div className="profile-details">
                <div className="info-group">
                  <label>Username</label>
                  <input
                    type="text"
                    value={user?.username || ''}
                    disabled
                    className="disabled-input"
                  />
                </div>

                <div className="info-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={isEditing ? 'editable-input' : 'disabled-input'}
                  />
                </div>

                <div className="info-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={isEditing ? 'editable-input' : 'disabled-input'}
                  />
                </div>

                <div className="info-group">
                  <label>phone_number</label>
                  <div className="input-with-icon">
                    <FaEnvelope className="input-icon" />
                    <input
                      type="phone_number"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={isEditing ? 'editable-input' : 'disabled-input'}
                    />
                  </div>
                </div>

                <div className="info-group">
                  <label>Phone</label>
                  <div className="input-with-icon">
                    <FaPhone className="input-icon" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={isEditing ? 'editable-input' : 'disabled-input'}
                    />
                  </div>
                </div>

                <div className="info-group">
                  <label>Role</label>
                  <input
                    type="text"
                    value={user?.role || ''}
                    disabled
                    className="disabled-input"
                  />
                </div>

                <div className="info-group">
                  <label>Branch</label>
                  <div className="input-with-icon">
                    <FaMapMarkerAlt className="input-icon" />
                    <input
                      type="text"
                      value={user?.branch?.name || 'Not assigned'}
                      disabled
                      className="disabled-input"
                    />
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
            <div className="activity-list">
              {printedOrders.length === 0 && (
                <div className="activity-item">
                  <div className="activity-content">
                    <h4>No printed orders found.</h4>
                  </div>
                </div>
              )}
              {printedOrders.map(order => (
                <div className="activity-item" key={order.id} onClick={() => handleOrderClick(order)} style={{ cursor: 'pointer' }}>
                  <div className="activity-icon">
                    <FaUtensils />
                  </div>
                  <div className="activity-content">
                    <h4>Order #{order.order_number}</h4>
                    <p>
                      Table: {order.table_number} | Total: $
                      {order.total !== undefined && order.total !== null
                        ? Number(order.total).toFixed(2)
                        : (order.items
                            ? order.items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
                            : '0.00')}
                    </p>
                    <span className="activity-time">{order.created_at ? new Date(order.created_at).toLocaleString() : ''}</span>
                    {expandedOrderId === order.id && (
                      <div className="order-items-detail">
                        <h5 style={{ margin: '10px 0 5px 0' }}>Items:</h5>
                        <table className="order-items-table">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Qty</th>
                              <th>Price</th>
                              <th>Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(orderItems[order.id] || []).map((item, idx) => (
                              <tr key={idx}>
                                <td>{item.name}</td>
                                <td>{item.quantity}</td>
                                <td>${item.price}</td>
                                <td>${(item.price * item.quantity).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="order-total-row">
                          <strong>Total: ${
                            (orderItems[order.id] || []).reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)
                          }</strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaiterProfile; 