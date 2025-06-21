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
        <h2>Your Cart</h2>
        <p>Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h2>Your Cart</h2>
        <button onClick={clearCart} className="clear-cart-btn">
          Clear Cart
        </button>
      </div>
      <div className="cart-items">
        {cartItems.map((item) => (
          <CartItem key={item.name} item={item} />
        ))}
      </div>
      <div className="cart-footer">
        <div className="cart-totals">
          <div className="cart-total">
            <span>Total Items:</span>
            <span>{getTotalItems()}</span>
          </div>
          <div className="cart-total">
            <span>Total Price:</span>
            <span>ETB {getTotalPrice()}</span>
          </div>
        </div>
        <button className="checkout-btn" onClick={onOrder}>Order</button>
      </div>
    </div>
  );
};

export default Cart; 