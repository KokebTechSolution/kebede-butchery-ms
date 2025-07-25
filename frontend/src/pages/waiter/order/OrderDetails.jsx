import React, { useEffect, useState } from 'react';
import './OrderDetails.css'; // We will create this file next
import { useCart } from '../../../context/CartContext';
import { tables } from '../tables/TablesPage';
import { updatePaymentOption, getOrderById } from '../../../api/cashier';

const OrderDetails = ({ onEditOrder, selectedOrderId, onOrderDeleted }) => {
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
    return items.filter(item => item.status === 'accepted').reduce((total, item) => total + (item.price * item.quantity), 0);
    return items.filter(item => item.status === 'accepted').reduce((total, item) => total + (item.price * item.quantity), 0);
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

  const handlePaymentOptionChange = async (orderId, paymentOption) => {
    try {
      // We need to refetch or update the order in the parent component's state
      // For now, let's just update the local state for immediate feedback
      const updatedOrder = await updatePaymentOption(orderId, paymentOption);
      setCurrentOrder(updatedOrder);
    } catch (error) {
      console.error('Failed to update payment option:', error);
    }
  };

  const isPrinted = currentOrder && printedOrders.includes(currentOrder.id);
  // Only allow print if all items are accepted or rejected
  const canPrint = currentOrder && currentOrder.items.length > 0 && currentOrder.items.every(item => item.status === 'accepted' || item.status === 'rejected');

  if (!currentOrder || currentOrder.items.length === 0) {
    return (
      <div className="order-details-container" style={{ textAlign: 'center', padding: '20px' }}>
        <h2>No items in this order.</h2>
        <p>Please add items to the cart from the menu page or select an existing order.</p>
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
                  const response = await fetch(`http://localhost:8000/api/orders/${currentOrder.id}/update-cashier-status/`, {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                  });
                  if (!response.ok) {
                    throw new Error('Failed to update cashier status');
                  }
                  setPrintedOrders(prev => [...prev, currentOrder.id]);
                  window.location.href = window.location.href; // Reload but stay on the same page
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
        <h2>Order {String(currentOrder.id).startsWith('pending-') ? `(Pending Table ${currentOrder.tableId})` : `${currentOrder.order_number} (Table ${currentOrder.table_number})`}</h2>
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