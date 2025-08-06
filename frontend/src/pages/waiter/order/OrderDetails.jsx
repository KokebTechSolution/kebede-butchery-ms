import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { updatePaymentOption, getOrderById } from '../../../api/cashier';
import { API_BASE_URL } from '../../../api/config';
import './OrderDetails.css';

const OrderDetails = ({ selectedOrderId, onEditOrder, onOrderDeleted }) => {
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get current user from auth context
  const { user } = useAuth();

  console.log('OrderDetails - selectedOrderId:', selectedOrderId);
  console.log('OrderDetails - currentOrder:', currentOrder);

  useEffect(() => {
    if (selectedOrderId) {
      fetchOrderDetails();
    }
  }, [selectedOrderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const orderData = await getOrderById(selectedOrderId);
      setCurrentOrder(orderData);
    } catch (err) {
      setError('Failed to fetch order details');
      console.error('Error fetching order details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCashierStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${currentOrder.id}/update-cashier-status/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        // Refresh order details
        await fetchOrderDetails();
      } else {
        console.error('Failed to update cashier status');
      }
    } catch (error) {
      console.error('Error updating cashier status:', error);
    }
  };

  const getTotalPrice = (items) => {
    return items.filter(item => item.status === 'accepted').reduce((total, item) => total + (item.price * item.quantity), 0);
    return items.filter(item => item.status === 'accepted').reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleDeleteOrder = () => {
    if (currentOrder && currentOrder.id && !String(currentOrder.id).startsWith('pending-')) {
      // This function is no longer directly available from useCart,
      // so it will be removed or refactored if needed.
      // For now, we'll just log a message.
      console.log('Deleting order:', currentOrder.id);
      // If onOrderDeleted is passed as a prop, call it.
      // If not, this function will be removed or refactored.
    } else if (currentOrder && String(currentOrder.id).startsWith('pending-')) {
      // If it's a pending order, clear the cart and then navigate back to tables.
      // This function is no longer directly available from useCart,
      // so it will be removed or refactored if needed.
      // For now, we'll just log a message.
      console.log('Clearing pending order cart:', currentOrder.id);
    }
  };

  const handlePaymentOptionChange = async (orderId, paymentOption) => {
    try {
      console.log('[DEBUG] handlePaymentOptionChange - Order ID:', orderId);
      console.log('[DEBUG] handlePaymentOptionChange - Payment Option:', paymentOption);
      console.log('[DEBUG] handlePaymentOptionChange - Current Order:', currentOrder);
      
      // We need to refetch or update the order in the parent component's state
      // For now, let's just update the local state for immediate feedback
      const updatedOrder = await updatePaymentOption(orderId, paymentOption);
      
      console.log('[DEBUG] handlePaymentOptionChange - Updated Order:', updatedOrder);
      console.log('[DEBUG] handlePaymentOptionChange - Updated Payment Option:', updatedOrder.payment_option);
      
      setCurrentOrder(updatedOrder);
      
      // Show success message
      alert(`✅ Payment method updated to: ${paymentOption.charAt(0).toUpperCase() + paymentOption.slice(1)}`);
      
    } catch (error) {
      console.error('[ERROR] Failed to update payment option:', error);
      
      let errorMessage = '❌ Failed to update payment method';
      if (error.response) {
        console.error('[ERROR] Response status:', error.response.status);
        console.error('[ERROR] Response data:', error.response.data);
        
        if (error.response.status === 404) {
          errorMessage += ': Order not found';
        } else if (error.response.status === 400) {
          errorMessage += ': Invalid payment method';
        } else if (error.response.data && error.response.data.error) {
          errorMessage += ': ' + error.response.data.error;
        }
      } else {
        errorMessage += ': ' + error.message;
      }
      
      alert(errorMessage);
    }
  };

  const isPrinted = currentOrder && currentOrder.printed_orders && currentOrder.printed_orders.includes(currentOrder.id);
  // Only allow print if all items are accepted or rejected
  const canPrint = currentOrder && currentOrder.items.length > 0 && currentOrder.items.every(item => item.status === 'accepted' || item.status === 'rejected');

  if (!currentOrder || currentOrder.items.length === 0) {
    return (
      <div className="order-details-container" style={{ textAlign: 'center', padding: '20px' }}>
        <h2>No Order Selected</h2>
        <p>Please select an existing order from the list on the left to view its details.</p>
        <div className="mt-4 space-y-2">
          <p>To create a new order:</p>
          <p>1. Go to <strong>Tables</strong> to select a table</p>
          <p>2. Add items to cart from the <strong>Menu</strong></p>
          <p>3. Place an order to see it here</p>
        </div>
      </div>
    );
  }

  // --- MERGE ITEMS FOR DISPLAY ---
  function mergeDisplayItems(items) {
    const merged = [];
    items.forEach(item => {
      const found = merged.find(i => i.name === item.name && i.price === item.price && (i.item_type || 'food') === (item.item_type || 'food'));
      if (found) {
        found.quantity += item.quantity;
      } else {
        merged.push({ ...item });
      }
    });
    return merged;
  }
  const mergedItems = mergeDisplayItems(currentOrder.items);
  // --------------------------------

  return (
    <div className={`order-details-container${isPrinted ? ' order-printed' : ''}`}>
      <div className="order-details-header" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <div className="icon-buttons">
          {/* Icons for edit, print, delete */}
          <span
            className="icon"
            onClick={!isPrinted ? () => onEditOrder(currentOrder) : undefined}
            style={{ color: isPrinted ? '#b0b0b0' : 'inherit', cursor: isPrinted ? 'not-allowed' : 'pointer' }}
          >
            ✏️
          </span>
          <span
            className="icon"
            onClick={!isPrinted && canPrint ? async () => {
              if (currentOrder && !isPrinted && canPrint) {
                if (!currentOrder.payment_option) {
                  alert('Please select a payment method (Cash or Online) before printing.');
                  return;
                }
                try {
                  await handleUpdateCashierStatus();
                  // Reload the page to reflect the printed status
                  window.location.href = window.location.href;
                } catch (error) {
                  console.error('Error updating cashier status:', error);
                }
              }
            } : undefined}
            style={{ color: (!isPrinted && !canPrint) ? '#b0b0b0' : isPrinted ? '#b0b0b0' : 'inherit', cursor: (!isPrinted && !canPrint) || isPrinted ? 'not-allowed' : 'pointer' }}
          >
            🖨️
          </span>
          <span className="icon" onClick={handleDeleteOrder}>🗑️</span>
        </div>
      </div>

      <div className="order-summary">
        <h2>Order {String(currentOrder.id).startsWith('pending-') ? `(Pending Table ${currentOrder.table_number})` : `${currentOrder.order_number} (Table ${currentOrder.table_number})`}</h2>
        <div className="payment-options">
          {currentOrder.payment_option ? (
            <p>
              Payment Method: <strong>{currentOrder.payment_option.charAt(0).toUpperCase() + currentOrder.payment_option.slice(1)}</strong>
            </p>
          ) : (
            <div>
              <span>Select Payment Method: </span>
              <button onClick={() => handlePaymentOptionChange(currentOrder.id, 'cash')} className="payment-button cash">Cash</button>
              <button onClick={() => handlePaymentOptionChange(currentOrder.id, 'online')} className="payment-button online">Online</button>
            </div>
          )}
        </div>

        <div className="order-items-table">
          <table>
            <thead>
              <tr>
                <th>Table No.</th>
                <th>Dish</th>
                <th>Qty.</th>
                <th>Amount</th>
                <th>Created By</th>
              </tr>
            </thead>
            <tbody>
              {mergedItems.map((item, index) => (
                <tr key={item.id || item.name + '-' + index}>
                  <td>{currentOrder.table_number || 'N/A'}</td>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>ETB {(item.price * item.quantity).toFixed(2)}</td>
                  <td>{currentOrder.created_by || currentOrder.waiterName || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* VAT Calculation */}
        {(() => {
          const total = getTotalPrice(currentOrder.items);
          const vat = total * 0.15;
          const subtotal = total - vat;
          return (
            <div className="order-total" style={{ textAlign: 'left', color: '#333', fontWeight: 'normal', padding: '16px 0 0 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontWeight: 600 }}>
                <span>Subtotal&nbsp;&nbsp;-</span>
                <span>&nbsp;&nbsp;{subtotal.toFixed(2)} ETB</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span>VAT (15%)&nbsp;&nbsp;-</span>
                <span>&nbsp;&nbsp;{vat.toFixed(2)} ETB</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontWeight: 700, fontSize: '1.5em' }}>
                <span>Total&nbsp;&nbsp;-</span>
                <span>&nbsp;&nbsp;{total.toFixed(2)} ETB</span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default OrderDetails; 