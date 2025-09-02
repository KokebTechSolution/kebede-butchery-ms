import React, { useEffect, useState } from 'react';
import './OrderDetails.css'; // We will create this file next
import { useCart } from '../../../context/CartContext';
import { tables } from '../tables/TablesPage';
import { updatePaymentOption, getOrderById } from '../../../api/cashier';
import { reduceBartenderInventory } from '../../../api/inventory';
import axiosInstance from '../../../api/axiosInstance';
import { triggerPrintCache } from '../../../utils/cacheUtils';

const OrderDetails = ({ onEditOrder, selectedOrderId, onOrderDeleted, onClose }) => {
  const { orders, activeTableId, cartItems, deleteOrder, clearCart, user } = useCart();
  const [currentOrder, setCurrentOrder] = useState(null);
  const [printedOrders, setPrintedOrders] = useState(() => {
    const saved = localStorage.getItem('printedOrders');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('printedOrders', JSON.stringify(printedOrders));
  }, [printedOrders]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (selectedOrderId) {
        try {
          const order = await getOrderById(selectedOrderId);
          setCurrentOrder(order);
        } catch (error) {
          setCurrentOrder(null);
        }
      } else if (activeTableId) {
        // If no specific order is selected, show the current active cart as a 'pending' order
        const currentPendingOrder = {
          id: `pending-${activeTableId}`, // Use a unique ID for pending order
          tableId: activeTableId,
          items: cartItems, // Use cartItems directly from context
          timestamp: new Date().toISOString(),
        };
        setCurrentOrder(currentPendingOrder);
      } else {
        setCurrentOrder(null);
      }
    };
    fetchOrder();
  }, [selectedOrderId, orders, activeTableId, cartItems]); // Add cartItems to dependency array

  const getTotalPrice = (items) => {
    // For pending orders, include all items (pending, accepted, rejected)
    // For completed orders, only include accepted items
    const isPendingOrder = items.some(item => item.status === 'pending');
    
    if (isPendingOrder) {
      // Include all items for pending orders
      return items.reduce((total, item) => total + (item.price * item.quantity), 0);
    } else {
      // Only include accepted items for completed orders
      return items.filter(item => item.status === 'accepted').reduce((total, item) => total + (item.price * item.quantity), 0);
    }
  };

  const handleDeleteOrder = () => {
    if (currentOrder && currentOrder.id && !String(currentOrder.id).startsWith('pending-')) {
      deleteOrder(currentOrder.id);
      if (onOrderDeleted) {
        onOrderDeleted();
      }
    } else if (currentOrder && String(currentOrder.id).startsWith('pending-')) {
      // If it's a pending order, clear the cart and then navigate back to tables.
      clearCart(); 
      if (onOrderDeleted) {
        onOrderDeleted();
      }
    }
  };

  const handleResetPrintedStatus = () => {
    // Clear this order from printed orders if it's incorrectly marked
    setPrintedOrders(prev => prev.filter(id => id !== currentOrder.id));
    console.log('Reset printed status for order:', currentOrder.id);
  };

  const handleClearAllPrintedOrders = () => {
    // Clear all printed orders from localStorage
    setPrintedOrders([]);
    localStorage.removeItem('printedOrders');
    console.log('Cleared all printed orders');
  };

  const handlePaymentOptionChange = async (orderId, paymentOption) => {
    console.log('Attempting to update payment option:', { orderId, paymentOption });
    
    // Check if order exists and is valid
    if (!currentOrder || !currentOrder.id) {
      alert('Cannot update payment option: Invalid order');
      return;
    }
    
    // Check if order is already printed
    if (isPrinted) {
      alert('Cannot update payment option: Order is already printed');
      return;
    }
    
    try {
      // We need to refetch or update the order in the parent component's state
      // For now, let's just update the local state for immediate feedback
      const updatedOrder = await updatePaymentOption(orderId, paymentOption);
      console.log('Payment option updated successfully:', updatedOrder);
      setCurrentOrder(updatedOrder);
    } catch (error) {
      console.error('Failed to update payment option:', error);
      // Show user-friendly error message
      alert(`Failed to update payment option: ${error.message || 'Unknown error'}`);
    }
  };

  // Check if order is printed (sent to cashier)
  const isPrinted = currentOrder?.cashier_status === 'printed';
  
  // Check if order is pending (default state)
  const isPending = currentOrder?.cashier_status === 'pending';
  
  // Add debugging to understand the current state
  console.log('Order Details Debug:', {
    orderId: currentOrder?.id,
    cashierStatus: currentOrder?.cashier_status,
    isInPrintedOrders: currentOrder ? printedOrders.includes(currentOrder.id) : false,
    isPrinted: isPrinted,
    hasPaymentOption: currentOrder?.payment_option,
    allItemsProcessed: currentOrder ? currentOrder.items.every(item => item.status === 'accepted' || item.status === 'rejected') : false,
    pendingItems: currentOrder ? currentOrder.items.filter(item => item.status === 'pending') : []
  });
  
  // Debug order items to see their status
  if (currentOrder && currentOrder.items) {
    console.log('🔍 Order Items Debug:', currentOrder.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      status: item.status,
      item_type: item.item_type
    })));
  }
  // Only allow print if payment method is selected AND all items are processed (accepted/rejected)
  const canPrint = currentOrder?.payment_option && 
    currentOrder.items.every(item => item.status === 'accepted' || item.status === 'rejected') &&
    !isPrinted; // Can't print if already printed

  if (!currentOrder || currentOrder.items.length === 0) {
    return (
      <div className="order-details-container" style={{ textAlign: 'center', padding: '20px' }}>
        <h2>No items in this order.</h2>
        <p>Please add items to the cart from the menu page or select an existing order.</p>
      </div>
    );
  }

  // --- SHOW ITEMS SEPARATELY (NO MERGING) ---
  // We want to show each item separately to preserve their individual statuses
  // No merging - each item maintains its own quantity and status
          // Group items by name, price, type, and status for display
        const groupedItems = {};
        currentOrder.items.forEach(item => {
          const key = `${item.name}-${item.price}-${item.item_type || 'food'}-${item.status}`;
          if (groupedItems[key]) {
            groupedItems[key].quantity += item.quantity;
          } else {
            groupedItems[key] = { ...item };
          }
        });
        const displayItems = Object.values(groupedItems);
  // --------------------------------

  const handlePrint = async () => {
    if (!canPrint) return;
    
    try {
      console.log('Reducing bartender inventory for printed order...');
      
      // First, reduce bartender inventory for accepted items
      try {
        console.log('🔍 Calling reduceBartenderInventory for order:', currentOrder.id);
        console.log('🔍 Order items:', currentOrder.items);
        
        const inventoryResponse = await reduceBartenderInventory(currentOrder.id);
        console.log('✅ Bartender inventory reduced successfully:', inventoryResponse);
        
        if (inventoryResponse.errors && inventoryResponse.errors.length > 0) {
          console.warn('⚠️ Some inventory reductions had issues:', inventoryResponse.errors);
        }
        
        if (inventoryResponse.reduced_items && inventoryResponse.reduced_items.length > 0) {
          console.log('📦 Items reduced:', inventoryResponse.reduced_items);
        }
      } catch (inventoryError) {
        console.error('❌ Error reducing bartender inventory:', inventoryError);
        console.error('❌ Error details:', inventoryError.response?.data || inventoryError.message);
        // Continue with printing even if inventory reduction fails
      }
      
      console.log('Sending order to cashier...');
      
      // Update cashier status to 'printed' (sent to cashier)
      const response = await axiosInstance.patch(`orders/order-list/${currentOrder.id}/update-cashier-status/`, {
        cashier_status: 'printed'
      });
      
      if (response.status === 200) {
        console.log('Order sent to cashier successfully');
        // Add to local printed orders
        setPrintedOrders(prev => [...prev, currentOrder.id]);
        
        // Update current order status to reflect printed state immediately
        setCurrentOrder(prev => ({
          ...prev,
          cashier_status: 'printed'
        }));
        
        // 🖨️ TRIGGER CACHE INVALIDATION - This will force fresh data fetch on next navigation
        triggerPrintCache();
        
        // Show success message and reload immediately
        alert('✅ Order printed successfully! The order is now locked and sent to cashier. Page will reload.');
        
        // Set flag to navigate to orders after reload
        sessionStorage.setItem('orderPrinted', 'true');
        
        // Reload immediately to refresh the state
        window.location.reload();
        
        console.log('✅ Order printed successfully - page reloaded');
      } else {
        console.error('Failed to send order to cashier');
        alert('❌ Failed to print order. Please try again.');
      }
    } catch (error) {
      console.error('Error sending order to cashier:', error);
      alert('❌ Error printing order. Please try again.');
    }
  };

  return (
    <div className={`order-details-container${currentOrder?.cashier_status === 'printed' ? ' order-printed' : ''}`}>
      <div className="order-details-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Close/Back Button */}
        <button 
          className="close-button"
          onClick={onClose}
          style={{
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            fontSize: '18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}
          title="Close Order Details"
        >
          ✕
        </button>
        
        <div className="icon-buttons">
          <span
            className="icon"
            onClick={currentOrder?.cashier_status !== 'printed' && canPrint ? handlePrint : undefined}
            style={{ color: (currentOrder?.cashier_status !== 'printed' && !canPrint) ? '#b0b0b0' : currentOrder?.cashier_status === 'printed' ? '#b0b0b0' : 'inherit', cursor: (currentOrder?.cashier_status !== 'printed' && !canPrint) || currentOrder?.cashier_status === 'printed' ? 'not-allowed' : 'pointer' }}
            title={currentOrder?.cashier_status !== 'printed' && canPrint ? "Send to Cashier & Print" : 
                   currentOrder?.cashier_status === 'printed' ? "Order already sent to cashier" : 
                   !currentOrder.payment_option ? "Select payment method first" :
                   "Wait for all items to be processed by kitchen/bar"}
          >
            🖨️
          </span>
        </div>
      </div>

      <div className="order-summary">
        <h2>Order {String(currentOrder.id).startsWith('pending-') ? `(Pending Table ${currentOrder.tableId})` : `${currentOrder.order_number} (Table ${currentOrder.table_number})`}</h2>
        
        {/* Show lock indicator when order is printed */}
        {isPrinted && (
          <div style={{
            backgroundColor: '#f8f9fa',
            border: '2px solid #28a745',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '15px',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#28a745'
          }}>
            🔒 ORDER LOCKED - Sent to cashier and cannot be modified
          </div>
        )}
        <div className="payment-options">
          {currentOrder.payment_option ? (
            <div>
              <span>Payment Method: </span>
              <button 
                className={`payment-button ${currentOrder.payment_option === 'cash' ? 'cash' : 'online'}`}
                disabled={isPrinted} // Only disable when actually printed
              >
                {currentOrder.payment_option.charAt(0).toUpperCase() + currentOrder.payment_option.slice(1)}
              </button>
            </div>
          ) : (
            <div>
              <span>Select Payment Method: </span>
              <button 
                onClick={() => handlePaymentOptionChange(currentOrder.id, 'cash')} 
                className="payment-button cash"
                disabled={isPrinted} // Only disable when actually printed
              >
                Cash
              </button>
              <button 
                onClick={() => handlePaymentOptionChange(currentOrder.id, 'online')} 
                className="payment-button online"
                disabled={isPrinted} // Only disable when actually printed
              >
                Online
              </button>
            </div>
          )}
          {currentOrder?.cashier_status === 'printed' && (
            <p style={{ 
              color: '#666', 
              fontSize: '12px', 
              marginTop: '8px', 
              fontStyle: 'italic' 
            }}>
              Payment method cannot be changed after printing
            </p>
          )}
          {/* Warning Messages */}
          {!currentOrder.payment_option && (
            <div style={{ 
              marginTop: '10px', 
              padding: '10px', 
              backgroundColor: '#fff3cd', 
              border: '1px solid #ffc107', 
              borderRadius: '5px',
              textAlign: 'center'
            }}>
              ⚠️ Select a payment method to enable printing
            </div>
          )}
          
          {currentOrder.payment_option && !canPrint && (
            <div style={{ 
              marginTop: '10px', 
              padding: '10px', 
              backgroundColor: '#fff3cd', 
              border: '1px solid #ffc107', 
              borderRadius: '5px',
              textAlign: 'center'
            }}>
              ⚠️ Wait for meat man/bartender to accept/reject all items before printing
            </div>
          )}
          
          {isPrinted && (
            <div style={{ 
              marginTop: '10px', 
              padding: '10px', 
              backgroundColor: '#d4edda', 
              border: '1px solid #c3e6cb', 
              borderRadius: '5px',
              textAlign: 'center'
            }}>
              ✅ Order sent to cashier for payment processing
            </div>
          )}
          {/* Order Status Indicator */}
          <div className="order-status">
            <span className={`status-indicator ${isPrinted ? 'printed' : isPending ? 'pending' : 'processing'}`}>
              {isPrinted ? '✅ Sent to Cashier' : 
               isPending ? '⏳ Processing Order' : 
               '⏳ Processing Order'}
            </span>
            <div className="status-details">
              <small>
                Backend: {currentOrder?.cashier_status || 'undefined'} | 
                Payment: {currentOrder?.payment_option || 'none'} | 
                Items: {currentOrder?.items?.length || 0}
              </small>
            </div>
          </div>
        </div>

        {/* Item Status Summary */}
        <div style={{ 
          marginTop: '15px', 
          padding: '10px', 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #dee2e6', 
          borderRadius: '5px'
        }}>
          <strong>Item Status Summary:</strong>
          <div style={{ marginTop: '8px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <span style={{ color: '#ffc107' }}>
              ⏳ Pending: {currentOrder.items.filter(item => item.status === 'pending').length}
            </span>
            <span style={{ color: '#28a745' }}>
              ✅ Accepted: {currentOrder.items.filter(item => item.status === 'accepted').length}
            </span>
            <span style={{ color: '#dc3545' }}>
              ❌ Rejected: {currentOrder.items.filter(item => item.status === 'rejected').length}
            </span>
          </div>
          {currentOrder.items.some(item => item.status === 'pending') && (
            <p style={{ 
              color: '#856404', 
              fontSize: '12px', 
              marginTop: '8px', 
              fontStyle: 'italic' 
            }}>
              📋 Waiting for meat man/bartender to process pending items...
            </p>
          )}
        </div>

        <div className="order-items-table">
          {/* Scrollable table indicator */}
          {currentOrder.items.length > 5 && (
            <div style={{ 
              padding: '8px 12px', 
              backgroundColor: '#e3f2fd', 
              borderBottom: '1px solid #ddd',
              fontSize: '12px',
              color: '#1976d2',
              textAlign: 'center',
              position: 'sticky',
              top: 0,
              zIndex: 15
            }}>
              📋 Table is scrollable - Use scrollbar to see all {currentOrder.items.length} items
            </div>
          )}
          <div style={{ overflow: 'auto', maxHeight: '350px' }}>
            <table>
              <thead>
                <tr>
                  <th>Table No.</th>
                  <th>Dish</th>
                  <th>Qty.</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Created By</th>
                </tr>
              </thead>
              <tbody>
                {displayItems.map((item, index) => (
                  <tr key={item.id || item.name + '-' + index}>
                    <td>{currentOrder.table_number || 'N/A'}</td>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>ETB {(item.price * item.quantity).toFixed(2)}</td>
                    <td>
                      <span className={`item-status ${item.status}`}>
                        {item.status === 'pending' && '⏳ Pending'}
                        {item.status === 'accepted' && '✅ Accepted'}
                        {item.status === 'rejected' && '❌ Rejected'}
                      </span>
                      <span className="item-type-label">
                        {item.item_type === 'food' && '🍽️ Food'}
                        {item.item_type === 'beverage' && '🥤 Beverage'}
                        {item.item_type === 'meat' && '🥩 Meat'}
                      </span>
                    </td>
                    <td>{currentOrder.created_by || currentOrder.waiterName || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* VAT Calculation */}
        {(() => {
          // Always calculate subtotal from ALL items, not just accepted ones
          const subtotal = displayItems.reduce((total, item) => total + (item.price * item.quantity), 0);
          const vat = subtotal * 0.15;
          const total = subtotal + vat;
          return (
            <div className="order-total" style={{ textAlign: 'left', color: '#333', fontWeight: 'normal', padding: '16px 0 0 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontWeight: 600 }}>
                <span>Subtotal:</span>
                <span>{subtotal.toFixed(2)} ETB</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span>VAT (15%):</span>
                <span>{vat.toFixed(2)} ETB</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontWeight: 700, fontSize: '1.5em', borderTop: '2px solid #ddd', paddingTop: '12px' }}>
                <span>Total:</span>
                <span>{total.toFixed(2)} ETB</span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default OrderDetails; 