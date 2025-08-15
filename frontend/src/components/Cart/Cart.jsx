import React from 'react';
import { useCart } from '../../context/CartContext';
import CartItem from './CartItem';
import { formatCartTotal } from '../../utils/priceUtils';
import { MdShoppingCart, MdEdit, MdCheck, MdDelete, MdReceipt, MdAdd, MdPrint } from 'react-icons/md';
import './Cart.css';

const Cart = ({ onOrder, onClearCart, editingOrderId, onUpdateOrder, showPaymentSelection, onPrintOrder }) => {
  const { cartItems, clearCart, getTotalItems } = useCart();

  console.log('Cart: Rendering with:', {
    cartItemsLength: cartItems.length,
    cartItems,
    editingOrderId
  });

  const getTotalPrice = () => {
    return formatCartTotal(cartItems);
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear all items from the cart?')) {
      clearCart();
      onClearCart && onClearCart();
    }
  };

  const handleOrder = () => {
    if (cartItems.length === 0) {
      return;
    }
    onOrder && onOrder();
  };

  const handlePrintOrder = () => {
    if (cartItems.length === 0) {
      return;
    }
    // This will be handled by the parent component
    onPrintOrder && onPrintOrder();
  };

  // Group items by name and sum quantities
  const groupedItems = cartItems.reduce((acc, item) => {
    const key = `${item.name}-${item.price}`;
    if (acc[key]) {
      acc[key].quantity += item.quantity;
    } else {
      acc[key] = { ...item };
    }
    return acc;
  }, {});

  const groupedItemsArray = Object.values(groupedItems);

  return (
    <div className="modern-cart-container">
      {/* Cart Header */}
      <div className="cart-header-section">
        <div className="cart-header-left">
          <div className="cart-icon-wrapper">
            <MdShoppingCart size={28} />
          </div>
          <div className="cart-title-content">
            <h2 className="cart-title">
              {editingOrderId ? 'Edit Order' : 'Current Order'}
            </h2>
            {editingOrderId && (
              <span className="editing-badge">
                <MdEdit size={16} />
                Order #{editingOrderId}
              </span>
            )}
          </div>
        </div>
        
        {cartItems.length > 0 && (
          <div className="cart-summary-badge">
            <span className="cart-items-count">{getTotalItems()}</span>
            <span className="cart-items-label">items</span>
          </div>
        )}
      </div>
      
      {/* Cart Items */}
      <div className="cart-content-section">
        {cartItems.length === 0 ? (
          <div className="empty-cart-state">
            <div className="empty-cart-icon">
              <MdShoppingCart size={64} />
            </div>
            <h3 className="empty-cart-title">Your cart is empty</h3>
            <p className="empty-cart-subtitle">Start adding delicious items from the menu</p>
            <div className="empty-cart-illustration">
              <div className="illustration-item">
                <MdAdd size={24} />
                <span>Browse menu</span>
              </div>
              <div className="illustration-item">
                <MdAdd size={24} />
                <span>Add items</span>
              </div>
              <div className="illustration-item">
                <MdReceipt size={24} />
                <span>Place order</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="cart-items-section">
            <div className="cart-items-header">
              <h3 className="items-section-title">Order Items</h3>
              <span className="items-count">{groupedItemsArray.length} unique items</span>
            </div>
            
            <div className="cart-items-list">
              {groupedItemsArray.map((item, index) => (
                <CartItem key={`${item.name}-${item.price}-${index}`} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Cart Footer */}
      {cartItems.length > 0 && (
        <div className="cart-footer-section">
          <div className="cart-summary">
            <div className="summary-row">
              <span className="summary-label">Items:</span>
              <span className="summary-value">{getTotalItems()}</span>
            </div>
            <div className="summary-row total-row">
              <span className="summary-label">Total:</span>
              <span className="summary-value total-amount">{getTotalPrice()}</span>
            </div>
          </div>
          
          <div className="cart-actions">
            <button 
              onClick={handleClearCart}
              className="action-btn clear-btn"
              aria-label="Clear all items from cart"
            >
              <MdDelete size={20} />
              <span>Clear</span>
            </button>
            
            <button 
              onClick={handlePrintOrder}
              className="action-btn secondary-btn"
              disabled={cartItems.length === 0}
              aria-label="Print order"
            >
              <MdPrint size={20} />
              <span>Print</span>
            </button>
            
            <button 
              onClick={handleOrder}
              className="action-btn primary-btn"
              disabled={cartItems.length === 0}
              aria-label={editingOrderId ? 'Update order' : 'Place order'}
            >
              {editingOrderId ? (
                <>
                  <MdEdit size={20} />
                  <span>Update Order</span>
                </>
              ) : (
                <>
                  <MdCheck size={20} />
                  <span>Place Order</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* Quick Stats */}
      <div className="cart-quick-stats">
        <div className="stat-card">
          <div className="stat-icon">🍽️</div>
          <div className="stat-content">
            <span className="stat-number">{groupedItemsArray.length}</span>
            <span className="stat-label">Unique Items</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <span className="stat-number">{getTotalItems()}</span>
            <span className="stat-label">Total Quantity</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <span className="stat-number">{getTotalPrice()}</span>
            <span className="stat-label">Total Value</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart; 