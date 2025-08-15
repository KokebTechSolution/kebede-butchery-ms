import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaEdit, FaTrash, FaPrint, FaTimes, FaPlus, FaCreditCard, FaMoneyBillWave } from 'react-icons/fa';
import OrderAdditionsModal from './OrderAdditionsModal';
import axiosInstance from '../../../api/axiosInstance';
import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext';
import './OrderDetails.css';

const OrderDetails = ({ selectedOrderId, onEditOrder, onOrderDeleted, onAddItems }) => {
  const { t } = useTranslation();
  const { user, checkSessionValidity } = useAuth();
  const { clearCart } = useCart();
  const [currentOrder, setCurrentOrder] = useState(null);
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [menuItemsLoading, setMenuItemsLoading] = useState(false);
  const [orderUpdates, setOrderUpdates] = useState([]);
  const [updatesLoading, setUpdatesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [paymentOption, setPaymentOption] = useState('');
  const [updatingPayment, setUpdatingPayment] = useState(false);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (selectedOrderId) {
      console.log('[OrderDetails] selectedOrderId changed:', selectedOrderId);
      console.log('[OrderDetails] Current user:', user);
      console.log('[OrderDetails] User authenticated:', user?.isAuthenticated);
      
      if (user?.isAuthenticated) {
        fetchOrderDetails();
        fetchOrderUpdates();
      } else {
        console.warn('[OrderDetails] User not authenticated, cannot fetch order details');
        setError('User not authenticated. Please log in again.');
      }
    }
  }, [selectedOrderId, user]);

  // Ensure orderUpdates is always an array
  useEffect(() => {
    if (!Array.isArray(orderUpdates)) {
      console.warn('[OrderDetails] orderUpdates is not an array, resetting to empty array');
      setOrderUpdates([]);
    }
  }, [orderUpdates]);

  // Ensure menuItems is always an array
  useEffect(() => {
    if (!Array.isArray(menuItems)) {
      console.warn('[OrderDetails] menuItems is not an array, resetting to empty array');
      setMenuItems([]);
    }
  }, [menuItems]);

  const fetchOrderDetails = async () => {
    try {
      console.log('[OrderDetails] Fetching order details for ID:', selectedOrderId);
      console.log('[OrderDetails] Using axiosInstance with cookies:', axiosInstance.defaults.withCredentials);
      
      const response = await axiosInstance.get(`/orders/order-list/${selectedOrderId}/`);
      console.log('[OrderDetails] Order details response:', response.data);
      setCurrentOrder(response.data);
      setPaymentOption(response.data.payment_option || '');
      setError(null);
    } catch (error) {
      console.error('[OrderDetails] Error fetching order details:', error);
      setError('Failed to load order details. Please try again.');
    }
  };

  const fetchOrderUpdates = async () => {
    try {
      setUpdatesLoading(true);
      const response = await axiosInstance.get(`/orders/updates/${selectedOrderId}/`);
      console.log('[OrderDetails] Order updates response:', response.data);
      console.log('[OrderDetails] Response data type:', typeof response.data);
      console.log('[OrderDetails] Response data keys:', Object.keys(response.data || {}));
      
      // The API returns { order_id: X, updates: [...] }
      const updates = response.data;
      if (updates && Array.isArray(updates.updates)) {
        console.log('[OrderDetails] Found updates in updates.updates:', updates.updates);
        setOrderUpdates(updates.updates);
      } else if (Array.isArray(updates)) {
        console.log('[OrderDetails] Found updates as direct array:', updates);
        setOrderUpdates(updates);
      } else {
        console.warn('[OrderDetails] Unexpected updates response format:', updates);
        console.warn('[OrderDetails] Setting empty array as fallback');
        setOrderUpdates([]);
      }
    } catch (error) {
      console.error('[OrderDetails] Error fetching order updates:', error);
      console.error('[OrderDetails] Error response:', error.response?.data);
      setOrderUpdates([]);
    } finally {
      setUpdatesLoading(false);
    }
  };

  const handleOpenAddItemsModal = async () => {
    try {
      setMenuItemsLoading(true);
      
      // Debug authentication state
      console.log('[OrderDetails] Current user:', user);
      console.log('[OrderDetails] User authenticated:', user?.isAuthenticated);
      console.log('[OrderDetails] Axios instance config:', axiosInstance.defaults);
      
      // Check if user session is still valid
      console.log('[OrderDetails] About to check session validity...');
      const isSessionValid = await checkSessionValidity();
      console.log('[OrderDetails] Session validity result:', isSessionValid);
      
      if (!isSessionValid) {
        console.error('[OrderDetails] User session expired, cannot load menu items');
        alert('Your session has expired. Please log in again.');
        return;
      }
      
      console.log('[OrderDetails] Session validated, proceeding with menu items request');
      
      // Use the correct menu items endpoint
      const endpoint = 'menu/menuitems/';
      console.log('[OrderDetails] Using endpoint:', endpoint);
      
      const response = await axiosInstance.get(endpoint);
      console.log('[OrderDetails] Menu items response:', response.data);
      console.log('[OrderDetails] Menu items response type:', typeof response.data);
      console.log('[OrderDetails] Menu items response isArray:', Array.isArray(response.data));
      
      // Ensure menuItems is always an array
      const menuItemsData = response.data;
      if (Array.isArray(menuItemsData)) {
        console.log('[OrderDetails] Setting menuItems to array:', menuItemsData);
        setMenuItems(menuItemsData);
      } else if (menuItemsData && Array.isArray(menuItemsData.results)) {
        console.log('[OrderDetails] Setting menuItems to results array:', menuItemsData.results);
        setMenuItems(menuItemsData.results);
      } else {
        console.warn('[OrderDetails] Unexpected menu items response format:', menuItemsData);
        console.warn('[OrderDetails] Setting empty array as fallback');
        setMenuItems([]);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
      console.error('Error response:', error.response?.data);
      alert('Failed to load menu items: ' + (error.response?.data?.message || error.message));
      setMenuItems([]); // Ensure it's always an array even on error
    } finally {
      setMenuItemsLoading(false);
    }
    setShowAddItemsModal(true);
  };

  const handleAddItems = async (itemsData) => {
    try {
      console.log('[OrderDetails] Adding items to order:', itemsData);
      console.log('[OrderDetails] Items data being sent:', itemsData);

      // Use the simple add-items endpoint
      const response = await axiosInstance.post(`/orders/${currentOrder.id}/add-items/`, {
        items: itemsData
      });
      
      console.log('[OrderDetails] Add items response:', response.data);
      
      // Refresh order details and updates
      await fetchOrderDetails();
      await fetchOrderUpdates();
      
      // Show success message
      setSuccessMessage('Items added successfully! Kitchen/Bar will be notified.');
      
      // Close modal after successful addition
      setShowAddItemsModal(false);
      clearCart(); // Clear cart after successful addition
      
    } catch (error) {
      console.error('Error adding items:', error);
      alert('Failed to add items: ' + error.message);
      // Don't close modal on error, let user try again
    }
  };

  const handlePaymentOptionChange = async (newPaymentOption) => {
    if (newPaymentOption === paymentOption) return;
    
    try {
      setUpdatingPayment(true);
      const response = await axiosInstance.patch(`/orders/${currentOrder.id}/update-payment-option/`, {
        payment_option: newPaymentOption
      });
      
      console.log('[OrderDetails] Payment option updated:', response.data);
      setPaymentOption(newPaymentOption);
      setCurrentOrder(prev => ({ ...prev, payment_option: newPaymentOption }));
      setSuccessMessage(`Payment option updated to ${newPaymentOption}!`);
    } catch (error) {
      console.error('[OrderDetails] Error updating payment option:', error);
      alert('Failed to update payment option: ' + (error.response?.data?.message || error.message));
    } finally {
      setUpdatingPayment(false);
    }
  };

  const getTotalPrice = () => {
    if (!currentOrder?.items) return 0;
    return currentOrder.items.reduce((total, item) => {
      // Only include accepted items in the total
      if (item.status === 'accepted') {
        return total + (Number(item.price || 0) * item.quantity);
      }
      return total;
    }, 0);
  };

  const getAcceptedItemsTotal = () => {
    if (!currentOrder?.items) return 0;
    return currentOrder.items.reduce((total, item) => {
      if (item.status === 'accepted') {
        return total + (Number(item.price || 0) * item.quantity);
      }
      return total;
    }, 0);
  };

  const getPendingItemsTotal = () => {
    if (!currentOrder?.items) return 0;
    return currentOrder.items.reduce((total, item) => {
      if (item.status === 'pending') {
        return total + (Number(item.price || 0) * item.quantity);
      }
      return total;
    }, 0);
  };

  const getRejectedItemsTotal = () => {
    if (!currentOrder?.items) return 0;
    return currentOrder.items.reduce((total, item) => {
      if (item.status === 'rejected') {
        return total + (Number(item.price || 0) * item.quantity);
      }
      return total;
    }, 0);
  };

  const isPrinted = currentOrder?.cashier_status === 'printed';

  if (!currentOrder) {
    if (error) {
      return (
        <div className="order-details-error">
          <div className="error-message">
            <h3>⚠️ Error Loading Order Details</h3>
            <p>{error}</p>
            {!user?.isAuthenticated && (
              <div className="auth-warning">
                <p><strong>Authentication Issue:</strong></p>
                <p>Please log out and log back in to refresh your session.</p>
              </div>
            )}
          </div>
        </div>
      );
    }
    return (
      <div className="order-details-loading">
        <div className="loading-spinner"></div>
        <p>Loading order details...</p>
      </div>
    );
  }

  return (
    <div className="order-details">
      {successMessage && (
        <div className="success-message">
          <span>✅ {successMessage}</span>
        </div>
      )}

      <div className="order-details-header">
        <h3>Order #{currentOrder.id}</h3>
        <div className="order-details-actions">
          {!isPrinted && (
            <>
              <span
                className="icon"
                onClick={() => onEditOrder(currentOrder)}
                title="Edit order"
              >
                <FaEdit />
              </span>
              <span
                className="icon"
                onClick={handleOpenAddItemsModal}
                title="Add items to order"
              >
                <FaPlus />
              </span>
            </>
          )}
          <span
            className="icon"
            onClick={() => onEditOrder(currentOrder)}
            title="View order details"
          >
            <FaTimes />
          </span>
        </div>
      </div>

      <div className="order-details-content">
        <div className="order-info">
          <p><strong>Table:</strong> {currentOrder.table_number || 'Unknown'}</p>
          <p><strong>Status:</strong> {currentOrder.status}</p>
          <p><strong>Cashier Status:</strong> {currentOrder.cashier_status}</p>
          <p><strong>Items Count:</strong> 
            {currentOrder.items?.filter(item => item.status === 'accepted').length || 0} accepted, 
            {currentOrder.items?.filter(item => item.status === 'pending').length || 0} pending, 
            {currentOrder.items?.filter(item => item.status === 'rejected').length || 0} rejected
          </p>
          <p><strong>Billable Total:</strong> ETB {getTotalPrice().toFixed(2)}</p>
        </div>

        {/* Payment Option Section */}
        <div className="payment-option-section">
          <h4>Payment Method:</h4>
          {currentOrder.has_payment ? (
            <div className="payment-option-disabled">
              <div className="payment-option selected">
                <div className="payment-option-icon">
                  {paymentOption === 'cash' ? <FaMoneyBillWave /> : <FaCreditCard />}
                </div>
                <div className="payment-option-content">
                  <span>{paymentOption === 'cash' ? 'Cash Payment' : 'Online Payment'}</span>
                  <small>Payment processed - cannot be changed</small>
                </div>
                <div className="payment-option-radio">
                  <div className="radio-circle selected"></div>
                </div>
              </div>
              <div className="payment-locked-message">
                <span>🔒 Payment option locked after processing</span>
              </div>
            </div>
          ) : (
            <>
              <div className="payment-options">
                <div 
                  className={`payment-option ${paymentOption === 'cash' ? 'selected' : ''} ${updatingPayment ? 'disabled' : ''}`}
                  onClick={() => !updatingPayment && handlePaymentOptionChange('cash')}
                >
                  <div className="payment-option-icon">
                    <FaMoneyBillWave />
                  </div>
                  <div className="payment-option-content">
                    <span>Cash Payment</span>
                    <small>Customer pays with cash</small>
                  </div>
                  <div className="payment-option-radio">
                    <div className={`radio-circle ${paymentOption === 'cash' ? 'selected' : ''}`}></div>
                  </div>
                </div>
                
                <div 
                  className={`payment-option ${paymentOption === 'online' ? 'selected' : ''} ${updatingPayment ? 'disabled' : ''}`}
                  onClick={() => !updatingPayment && handlePaymentOptionChange('online')}
                >
                  <div className="payment-option-icon">
                    <FaCreditCard />
                  </div>
                  <div className="payment-option-content">
                    <span>Online Payment</span>
                    <small>Card, mobile money, etc.</small>
                  </div>
                  <div className="payment-option-radio">
                    <div className={`radio-circle ${paymentOption === 'online' ? 'selected' : ''}`}></div>
                  </div>
                </div>
              </div>
              {updatingPayment && (
                <div className="updating-payment">
                  <span>Updating payment option...</span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="order-items">
          <h4>Order Items:</h4>
          
          {/* Accepted Items */}
          {currentOrder.items?.filter(item => item.status === 'accepted').length > 0 && (
            <div className="items-section accepted">
              <h5 className="section-title accepted">✅ Accepted Items</h5>
              {currentOrder.items.filter(item => item.status === 'accepted').map((item, index) => (
                <div key={`accepted-${index}`} className="order-item accepted">
                  <span>{item.name} x {item.quantity}</span>
                  <span>ETB {(Number(item.price || 0) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="section-total accepted">
                <strong>Accepted Total: ETB {getAcceptedItemsTotal().toFixed(2)}</strong>
              </div>
            </div>
          )}

          {/* Pending Items */}
          {currentOrder.items?.filter(item => item.status === 'pending').length > 0 && (
            <div className="items-section pending">
              <h5 className="section-title pending">⏳ Pending Items</h5>
              {currentOrder.items.filter(item => item.status === 'pending').map((item, index) => (
                <div key={`pending-${index}`} className="order-item pending">
                  <span>{item.name} x {item.quantity}</span>
                  <span>ETB {(Number(item.price || 0) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="section-total pending">
                <strong>Pending Total: ETB {getPendingItemsTotal().toFixed(2)}</strong>
              </div>
            </div>
          )}

          {/* Rejected Items */}
          {currentOrder.items?.filter(item => item.status === 'rejected').length > 0 && (
            <div className="items-section rejected">
              <h5 className="section-title rejected">❌ Rejected Items</h5>
              {currentOrder.items.filter(item => item.status === 'rejected').map((item, index) => (
                <div key={`rejected-${index}`} className="order-item rejected">
                  <span>{item.name} x {item.quantity}</span>
                  <span>ETB {(Number(item.price || 0) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="section-total rejected">
                <strong>Rejected Total: ETB {getRejectedItemsTotal().toFixed(2)}</strong>
              </div>
            </div>
          )}

          {/* Grand Total - Only Accepted Items */}
          <div className="grand-total">
            <h5>💰 Billable Total (Accepted Items Only)</h5>
            <div className="total-amount">
              <strong>Total: ETB {getTotalPrice().toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {/* Order Updates Section */}
        <div className="order-updates">
          <h4>Order Updates:</h4>
          {updatesLoading ? (
            <p>Loading updates...</p>
          ) : Array.isArray(orderUpdates) && orderUpdates.length > 0 ? (
            <div className="updates-list">
              {orderUpdates.map((update, index) => {
                // Add safety checks for update object
                if (!update || typeof update !== 'object') {
                  console.warn('[OrderDetails] Invalid update object:', update);
                  return null;
                }
                
                return (
                  <div key={update.id || index} className={`update-item ${update.status || 'unknown'}`}>
                    <div className="update-header">
                      <span className="update-type">{update.update_type || 'Update'}</span>
                      <span className={`update-status ${update.status || 'unknown'}`}>
                        {update.status || 'Unknown'}
                      </span>
                    </div>
                    <div className="update-details">
                      <p><strong>Created:</strong> {update.created_at ? new Date(update.created_at).toLocaleString() : 'Unknown'}</p>
                      <p><strong>Cost:</strong> ETB {update.total_addition_cost || '0.00'}</p>
                      {update.notes && <p><strong>Notes:</strong> {update.notes}</p>}
                      {update.status === 'rejected' && update.rejection_reason && (
                        <p><strong>Rejection Reason:</strong> {update.rejection_reason}</p>
                      )}
                    </div>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          ) : (
            <p>No updates for this order</p>
          )}
        </div>
      </div>

      <OrderAdditionsModal
        isOpen={showAddItemsModal}
        onClose={() => setShowAddItemsModal(false)}
        currentOrder={currentOrder}
        onAddItems={handleAddItems}
        availableMenuItems={menuItems}
        loading={menuItemsLoading}
      />
    </div>
  );
};

export default OrderDetails; 