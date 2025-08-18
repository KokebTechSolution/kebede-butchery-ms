import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaEdit, FaTrash, FaPrint, FaTimes, FaPlus, FaCreditCard, FaMoneyBillWave, FaCamera, FaCheck } from 'react-icons/fa';
import OrderAdditionsModal from './OrderAdditionsModal';
import OrderEditModal from './OrderEditModal';
import PaymentMethodModal from '../../../components/PaymentMethodModal';
import CameraCapture from '../../../components/CameraCapture';
import axiosInstance from '../../../api/axiosInstance';
import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext';
import './OrderDetails.css';

const OrderDetails = ({ selectedOrderId, onEditOrder, onOrderDeleted, onAddItems, onDone }) => {
  const { t } = useTranslation();
  const { user, checkSessionValidity } = useAuth();
  const { clearCart, refreshOrders, refreshTables, refreshAll } = useCart();
  const [currentOrder, setCurrentOrder] = useState(null);
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [menuItemsLoading, setMenuItemsLoading] = useState(false);
  const [orderUpdates, setOrderUpdates] = useState([]);
  const [updatesLoading, setUpdatesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [paymentOption, setPaymentOption] = useState('');
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedReceipt, setCapturedReceipt] = useState(null);

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

  const handleEditOrder = () => {
    setShowEditModal(true);
  };

  const handleOrderUpdated = (updatedOrder) => {
    // Refresh order details after successful update
    setCurrentOrder(updatedOrder);
    fetchOrderDetails();
    fetchOrderUpdates();
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
    
    // Check if order can be modified
    if (currentOrder?.cashier_status === 'printed') {
      alert('⚠️ Cannot change payment method for printed orders. The order has already been sent to the cashier.');
      return;
    }
    
    try {
      setUpdatingPayment(true);
      const response = await axiosInstance.patch(`/orders/${currentOrder.id}/update-payment-option/`, {
        payment_option: newPaymentOption
      });
      
      console.log('[OrderDetails] Payment option updated:', response.data);
      setPaymentOption(newPaymentOption);
      setCurrentOrder(prev => ({ ...prev, payment_option: newPaymentOption }));
      setSuccessMessage(`Payment option updated to ${newPaymentOption}!`);
      
      // Refresh orders and tables after payment update
      await refreshAll();
    } catch (error) {
      console.error('[OrderDetails] Error updating payment option:', error);
      
      // Provide more specific error messages
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.error || 'Payment option cannot be changed';
        alert(`⚠️ ${errorMessage}\n\nThis usually happens when:\n• The order has already been printed\n• The order has already been processed for payment\n• The payment option is invalid`);
      } else {
        alert('Failed to update payment option: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setUpdatingPayment(false);
    }
  };

  const handlePaymentMethodSelect = (method) => {
    // Check if order can be modified
    if (currentOrder?.cashier_status === 'printed') {
      alert('⚠️ Cannot change payment method for printed orders. The order has already been sent to the cashier.');
      return;
    }
    
    if (method === 'online') {
      // For online payment, show camera to capture receipt
      setShowCamera(true);
    } else {
      // For cash payment, update directly
      handlePaymentOptionChange(method);
    }
  };

  const handleReceiptCapture = (receiptData) => {
    setCapturedReceipt(receiptData);
    setShowCamera(false);
    
    // Now update the payment option to online and upload receipt
    updatePaymentWithReceipt('online', receiptData);
  };

  const updatePaymentWithReceipt = async (paymentMethod, receiptData) => {
    try {
      // First update payment option
      await handlePaymentOptionChange(paymentMethod);
      
      // Then upload receipt image
      if (receiptData?.blob) {
        const formData = new FormData();
        formData.append('receipt_image', receiptData.blob, 'payment_receipt.jpg');
        
        const response = await axiosInstance.patch(`/orders/${currentOrder.id}/upload-receipt/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        console.log('Receipt uploaded successfully:', response.data);
        setSuccessMessage('Payment method updated to online and receipt uploaded successfully!');
        
        // Refresh orders and tables after receipt upload
        await refreshAll();
      }
    } catch (error) {
      console.error('Error updating payment with receipt:', error);
      setSuccessMessage('Payment method updated but failed to upload receipt. Please try again.');
    }
  };

  const handlePaymentModalClose = () => {
    setShowPaymentModal(false);
    setCapturedReceipt(null);
  };

  const handlePrintOrder = async () => {
    try {
      // Update cashier status to 'printed' to send to cashier
      const response = await axiosInstance.patch(`/orders/${currentOrder.id}/update-cashier-status/`, {
        cashier_status: 'printed'
      });
      
      console.log('[OrderDetails] Order printed successfully:', response.data);
      setSuccessMessage('Order printed and sent to cashier successfully! Table is now available for new orders.');
      
      // Refresh order details, orders list, and tables to show updated status
      await Promise.all([
        fetchOrderDetails(),
        refreshAll()
      ]);
      
    } catch (error) {
      console.error('[OrderDetails] Error printing order:', error);
      alert('Failed to print order: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleResetTable = async () => {
    try {
      const response = await axiosInstance.post(`/orders/${currentOrder.id}/reset-table-status/`);
      console.log('[OrderDetails] Table status reset successfully:', response.data);
      setSuccessMessage('Table status reset to available for new orders!');
      
      // Refresh order details, orders list, and tables
      await Promise.all([
        fetchOrderDetails(),
        refreshAll()
      ]);
    } catch (error) {
      console.error('[OrderDetails] Error resetting table status:', error);
      alert('Failed to reset table status: ' + (error.response?.data?.message || error.message));
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

  // Handle Done button - refresh all data and redirect to tables
  const handleDone = async () => {
    try {
      // Show loading state
      setSuccessMessage('Refreshing data...');
      
      // Refresh all data
      await refreshAll();
      
      // Show success message
      setSuccessMessage('Data refreshed successfully! Redirecting to tables...');
      
      // Call parent onDone callback if provided
      if (onDone) {
        onDone();
      }
      
      // Clear success message after a short delay
      setTimeout(() => setSuccessMessage(''), 2000);
      
    } catch (error) {
      console.error('[OrderDetails] Error in handleDone:', error);
      setSuccessMessage('Error refreshing data. Please try again.');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

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

        {/* Payment Method Section */}
        <div className="payment-method-section">
          <h4>💳 Payment Method</h4>
          
          {/* Warning for printed orders */}
          {currentOrder?.cashier_status === 'printed' && (
            <div className="payment-warning" style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <div className="warning-icon" style={{ fontSize: '20px' }}>⚠️</div>
              <div className="warning-content">
                <strong style={{ color: '#856404', display: 'block', marginBottom: '8px' }}>Payment method cannot be changed</strong>
                <p style={{ color: '#856404', margin: 0, fontSize: '14px' }}>This order has already been printed and sent to the cashier. Payment method changes are not allowed for printed orders.</p>
              </div>
            </div>
          )}
          
          {/* Table Ready for New Orders Section */}
          {currentOrder?.cashier_status === 'printed' && (
            <div className="table-ready-section" style={{
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '20px' }}>✅</div>
                <div>
                  <strong style={{ color: '#155724', display: 'block', marginBottom: '4px' }}>Table Ready for New Orders</strong>
                  <p style={{ color: '#155724', margin: 0, fontSize: '14px' }}>This table is now available to take new orders. The current order has been sent to the cashier.</p>
                </div>
              </div>
              <button 
                onClick={handleResetTable}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
                title="Reset table status to ensure it's marked as available"
              >
                Reset Table Status
              </button>
            </div>
          )}
          
          <p className="payment-instruction">
            {!paymentOption ? 'Select payment method for this order:' : 'Current payment method:'}
          </p>
          
          <div className="payment-options">
            <div 
              className={`payment-option ${paymentOption === 'cash' ? 'selected' : ''} ${updatingPayment || currentOrder?.cashier_status === 'printed' ? 'disabled' : ''}`}
              onClick={() => !updatingPayment && currentOrder?.cashier_status !== 'printed' && handlePaymentOptionChange('cash')}
              style={{
                opacity: (updatingPayment || currentOrder?.cashier_status === 'printed') ? 0.5 : 1,
                cursor: (updatingPayment || currentOrder?.cashier_status === 'printed') ? 'not-allowed' : 'pointer'
              }}
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
              className={`payment-option ${paymentOption === 'online' ? 'selected' : ''} ${updatingPayment || currentOrder?.cashier_status === 'printed' ? 'disabled' : ''}`}
              onClick={() => !updatingPayment && currentOrder?.cashier_status !== 'printed' && handlePaymentMethodSelect('online')}
              style={{
                opacity: (updatingPayment || currentOrder?.cashier_status === 'printed') ? 0.5 : 1,
                cursor: (updatingPayment || currentOrder?.cashier_status === 'printed') ? 'not-allowed' : 'pointer'
              }}
            >
              <div className="payment-option-icon">
                <FaCreditCard />
              </div>
              <div className="payment-option-content">
                <span>Online Payment</span>
                <small>Card, mobile money, etc.</small>
                {capturedReceipt && (
                  <div className="receipt-status">
                    <FaCamera className="text-green-500" />
                    <span className="text-green-600 text-sm">Receipt captured</span>
                  </div>
                )}
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
          
          {/* Receipt capture button for online payment */}
          {paymentOption === 'online' && !capturedReceipt && currentOrder?.cashier_status !== 'printed' && (
            <div className="receipt-capture-section">
              <button 
                onClick={() => setShowCamera(true)}
                className="capture-receipt-btn"
              >
                <FaCamera className="w-5 h-5" />
                Capture Payment Receipt
              </button>
              <p className="receipt-instruction">
                Take a photo of the customer's payment confirmation (screenshot, bank app, etc.)
              </p>
            </div>
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

        {/* Action Buttons Section */}
        <div className="order-action-buttons">
          <div className="action-buttons-container">
            {/* Primary Actions Group */}
            <div className="primary-actions">
              {/* Edit Order Button - Only show if order has pending items */}
              {currentOrder.items?.filter(item => item.status === 'pending').length > 0 && (
                <button
                  className="edit-order-btn"
                  onClick={handleEditOrder}
                  disabled={isPrinted}
                  title="Edit pending items in this order"
                >
                  <FaEdit className="mr-2" />
                  Edit Order
                </button>
              )}
              
              {/* Add Items Button - Always show if not printed */}
              {!isPrinted && (
                <button
                  className="add-items-btn"
                  onClick={handleOpenAddItemsModal}
                  title="Add new items to this order"
                >
                  <FaPlus className="mr-2" />
                  Add Items
                </button>
              )}
            </div>

            {/* Secondary Actions Group */}
            <div className="secondary-actions">
              {/* Print & Send to Cashier Button - Only show if order has accepted items and is not printed */}
              {currentOrder.items?.filter(item => item.status === 'accepted').length > 0 && !isPrinted && (
                <button
                  className="print-order-btn"
                  onClick={handlePrintOrder}
                  disabled={isPrinted}
                  title="Print order and send to cashier"
                >
                  <FaPrint className="mr-2" />
                  Print & Send to Cashier
                </button>
              )}
              
              {/* Done Button - Always visible */}
              <button
                className="done-btn"
                onClick={handleDone}
                title="Complete order and return to tables"
              >
                <FaCheck className="mr-2" />
                Done
              </button>
            </div>
          </div>
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

      {/* Order Edit Modal */}
      <OrderEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        currentOrder={currentOrder}
        onOrderUpdated={handleOrderUpdated}
      />

      {/* Camera Capture Modal for Receipt */}
      <CameraCapture
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleReceiptCapture}
        title="Capture Payment Receipt"
      />

      {/* Payment Method Modal */}
      <PaymentMethodModal
        isOpen={showPaymentModal}
        onClose={handlePaymentModalClose}
        onConfirm={handlePaymentMethodSelect}
        selectedTable={currentOrder?.table}
      />
    </div>
  );
};

export default OrderDetails; 