import React from 'react';
import { useCart } from '../../context/CartContext';
import CartItem from './CartItem';
import './Cart.css';

const Cart = ({ onOrder }) => {
  const { cartItems, clearCart, getTotalItems } = useCart();

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-container">
        <div className="cart-header">
          <h2>Cart</h2>
          <span className="cart-items-count">0</span>
        </div>
        <div className="cart-items-list">
          <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            Your cart is empty
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h2 className="cart-title">Cart</h2>
        <span className="cart-items-count">{getTotalItems()}</span>
      </div>
      
      <div className="cart-items-list">
        {cartItems.map((item) => (
          <CartItem key={item.id} item={item} />
        ))}
      </div>
      
      <div className="cart-total">
        <div className="cart-total-row">
          <span className="cart-total-label">Total:</span>
          <span className="cart-total-final">ETB {getTotalPrice()}</span>
        </div>
        
        <div className="cart-actions">
          <button onClick={clearCart} className="clear-cart-btn">
            Clear Cart
          </button>
          <button onClick={onOrder} className="checkout-btn">
            Place Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart; 