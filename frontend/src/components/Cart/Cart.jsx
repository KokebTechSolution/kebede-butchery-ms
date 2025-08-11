import React from 'react';
import { useCart } from '../../context/CartContext';
import CartItem from './CartItem';
import { formatCartTotal } from '../../utils/priceUtils';
import './Cart.css';

const Cart = ({ onOrder, onClearCart, editingOrderId, onUpdateOrder, showPaymentSelection }) => {
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
    clearCart();
    onClearCart && onClearCart();
  };

  const handleOrder = () => {
    if (cartItems.length === 0) {
      return;
    }
    onOrder && onOrder();
  };

  return (
    <div className="cart-container">
      {/* Cart Header */}
      <div className="cart-header">
        <div className="cart-title-section">
          <h2 className="cart-title">🛒 Current Order</h2>
          {editingOrderId && (
            <span className="editing-badge">Editing Order #{editingOrderId}</span>
          )}
        </div>
        {cartItems.length > 0 && (
          <div className="cart-summary">
            <span className="cart-items-count">{getTotalItems()} items</span>
          </div>
        )}
      </div>
      
      {/* Cart Items */}
      <div className="cart-items-container">
        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-cart-icon">📋</div>
            <p className="empty-cart-title">Your cart is empty</p>
            <p className="empty-cart-subtitle">Add items from the menu to get started</p>
          </div>
        ) : (
          <div className="cart-items-list">
            {cartItems.map((item) => (
              <CartItem key={item.id || `${item.name}-${item.price}`} item={item} />
            ))}
          </div>
        )}
      </div>
      
      {/* Cart Footer */}
      {cartItems.length > 0 && (
        <div className="cart-footer">
          <div className="cart-total-section">
            <div className="cart-total-row">
              <span className="total-label">Total Items:</span>
              <span className="total-items-count">{getTotalItems()}</span>
            </div>
            <div className="cart-total-row">
              <span className="total-label">Total Amount:</span>
              <span className="total-price">{getTotalPrice()}</span>
            </div>
          </div>
          
          <div className="cart-actions">
            <button 
              onClick={handleClearCart}
              className="cart-btn clear-cart-btn"
              aria-label="Clear all items from cart"
            >
              <span className="btn-icon">🗑️</span>
              <span className="btn-text">Clear Cart</span>
            </button>
            <button 
              onClick={handleOrder}
              className="cart-btn order-btn"
              disabled={cartItems.length === 0}
              aria-label={editingOrderId ? 'Update order' : 'Place order'}
            >
              <span className="btn-icon">
                {editingOrderId ? '✏️' : '✅'}
              </span>
                          <span className="btn-text">
              {editingOrderId ? 'Update Order' : 'Place Order'}
            </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart; 