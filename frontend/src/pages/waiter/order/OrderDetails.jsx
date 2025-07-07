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
  const canPrint = currentOrder && currentOrder.items.every(item => item.status !== 'pending');

  if (!currentOrder || currentOrder.items.length === 0) {
    return (
      <div className="order-details-container" style={{ textAlign: 'center', padding: '20px' }}>
        <h2>No items in this order.</h2>
        <p>Please add items to the cart from the menu page or select an existing order.</p>
      </div>
    );
  }

  return (
    <div className={`order-details-container${isPrinted ? ' order-printed' : ''}`}>
      <div className="order-details-header">
        <div className="icon-buttons">
          {/* Icons for edit, print, share, delete */}
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
                } catch (error) {
                  console.error('Error updating cashier status:', error);
                }
              }
            } : undefined}
            style={{ color: (!isPrinted && !canPrint) ? '#b0b0b0' : isPrinted ? '#b0b0b0' : 'inherit', cursor: (!isPrinted && !canPrint) || isPrinted ? 'not-allowed' : 'pointer' }}
          >
            🖨️
          </span>
          <span className="icon">↪️</span>
          <span className="icon" onClick={handleDeleteOrder}>🗑️</span>
        </div>
        <div className="action-buttons">
          <button className="button-details">Details</button>
          <button className="button-new-order">New Order</button>
          <button className="button-billing">Billing</button>
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
        <div className="order-info">
          <div className="order-from">
            <h3>From</h3>
            <p>Mickey leland Street</p>
            <p></p>
          </div>
          <div className="order-to">
            <h3>Order Info</h3>
            <p>Table: {currentOrder.table_number || currentOrder.tableId || 'N/A'}</p>
            <p>Branch: {currentOrder.branch || 'N/A'}</p>
            <p>Created By: {currentOrder.created_by || currentOrder.waiterName || 'N/A'}</p>
            <p>Location: Mickey Lelan Street</p>
          </div>
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
              {currentOrder.items.map((item, index) => (
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

        <p className="order-note">All prices are in ETB (Ethiopian Birr).</p>

        <div className="order-total">
          <div className="subtotal">
            <span>Subtotal</span>
            <span>ETB {getTotalPrice(currentOrder.items).toFixed(2)}</span>
          </div>
          <div className="total">
            <span>Total</span>
            <span>ETB {getTotalPrice(currentOrder.items).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails; 