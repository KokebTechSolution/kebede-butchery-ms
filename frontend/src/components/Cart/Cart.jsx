import React from 'react';
import CartItem from './CartItem';
import { useCart } from '../../context/CartContext';
import './Cart.css';

const Cart = ({ onOrder, onClearCart, table, isTableOrdering }) => {
  const { cartItems, clearCart, getTotalItems, refreshAll } = useCart();

  const handleClearCart = async () => {
    if (onClearCart) {
      onClearCart();
    } else {
      clearCart();
    }
    
    // Refresh orders and tables after clearing cart
    await refreshAll();
  };

  const handlePlaceOrder = async () => {
    if (onOrder) {
      await onOrder();
      // Refresh orders and tables after placing order
      await refreshAll();
    }
  };

  const totalItems = getTotalItems();

  // Debug logging
  console.log('Cart: cartItems:', cartItems);
  console.log('Cart: totalItems:', totalItems);
  console.log('Cart: individual item quantities:', cartItems.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })));

  // Safe total price calculation
  const totalPrice = cartItems.reduce((sum, item) => {
    const unit = Number(item?.price) || 0;
    const qty = Number(item?.quantity) || 0;
    const unitSafe = Number.isFinite(unit) ? unit : 0;
    const qtySafe = Number.isFinite(qty) ? qty : 0;
    console.log(`Cart: Item ${item.name} - unit: ${unitSafe}, qty: ${qtySafe}, subtotal: ${unitSafe * qtySafe}`);
    return sum + unitSafe * qtySafe;
  }, 0);

  // Simple price formatting function
  const formatPrice = (price) => {
    const amount = Number(price);
    const safe = Number.isFinite(amount) ? amount : 0;
    return `ETB ${safe.toFixed(2)}`;
  };

  if (totalItems === 0) {
    return (
      <div className="cart-container empty">
        <div className="cart-header">
          <h3>🛒 Your Cart</h3>
          <span className="cart-count">0 Items</span>
        </div>
        <div className="cart-empty">
          <div className="empty-icon">📱</div>
          <h4>Cart is Empty</h4>
          <p>👆 Tap items from the menu to add them here</p>
          <div className="empty-instructions">
            <div className="instruction-step">
              <span className="step-number">1</span>
              <span>Browse the menu above</span>
            </div>
            <div className="instruction-step">
              <span className="step-number">2</span>
              <span>Tap the + button on items you want</span>
            </div>
            <div className="instruction-step">
              <span className="step-number">3</span>
              <span>Review your order here</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h3>📋 Current Order</h3>
        <span className="cart-count">{totalItems} Items</span>
      </div>
      
      {/* Table Info */}
      {table && (
        <div className="table-info">
          <div className="table-icon">🪑</div>
          <div className="table-details">
            <span className="table-label">Table:</span>
            <span className="table-number">{table.number}</span>
          </div>
        </div>
      )}
      
      <div className="cart-items">
        {cartItems.map((item) => (
          <CartItem key={item.id} item={item} />
        ))}
      </div>
      
      <div className="cart-summary">
        <div className="summary-row">
          <span>Total Items:</span>
          <span className="items-count">{totalItems}</span>
        </div>
        <div className="summary-row total">
          <span>Total Price:</span>
          <span className="total-price">{formatPrice(totalPrice)}</span>
        </div>
      </div>
      
      {/* Clear Cart Button */}
      <div className="cart-actions">
        <button 
          onClick={handleClearCart}
          className="clear-btn"
          disabled={isTableOrdering}
          title="Remove all items from cart"
        >
          🗑️ Clear All
        </button>
      </div>
      
      {/* Place Order Section */}
      <div className="place-order-section">
        <div className="order-instructions">
          <h4>📝 Ready to Order?</h4>
          <p>Review your items above, then tap the big button below!</p>
        </div>
        
        <button 
          onClick={handlePlaceOrder}
          className="place-order-btn"
          disabled={isTableOrdering}
          title="Place your order with the kitchen"
        >
          <span className="btn-icon">🚀</span>
          <span className="btn-text">PLACE ORDER NOW</span>
          <span className="btn-subtitle">Send to Kitchen</span>
        </button>
        
        {isTableOrdering && (
          <div className="ordering-notice">
            <span className="notice-icon">⚠️</span>
            <span>This table already has an active order</span>
          </div>
        )}
      </div>
      
      {/* Quick Tips */}
      <div className="quick-tips">
        <h5>💡 Quick Tips:</h5>
        <ul>
          <li>• Tap + to add more of the same item</li>
          <li>• Tap - to reduce quantity</li>
          <li>• Clear All removes everything</li>
          <li>• Place Order sends to kitchen</li>
        </ul>
      </div>
    </div>
  );
};

export default Cart; 