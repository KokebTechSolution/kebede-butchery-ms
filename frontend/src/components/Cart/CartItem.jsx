import React from 'react';
import { useCart } from '../../context/CartContext';
import './Cart.css';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="cart-item">
      <button
        aria-label="Remove"
        className="remove-x-btn"
        onClick={() => removeFromCart(item.id)}
      >
        ×
      </button>
      <div className="cart-item-image">
        {item.icon ? item.icon : '🍽️'}
      </div>
      <div className="cart-item-details">
        <div className="cart-item-name">{item.name || 'Item'}</div>
        <div className="cart-item-price">ETB {item.price || 0}</div>
      </div>
      <div className="cart-item-quantity">
        <button
          onClick={() => updateQuantity(item.id, item.quantity - 1)}
          className="cart-quantity-btn"
        >
          -
        </button>
        <span className="cart-quantity-display">{item.quantity || 1}</span>
        <button
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
          className="cart-quantity-btn"
        >
          +
        </button>
      </div>
      <div className="cart-item-subtotal">
        ETB {(item.price || 0) * (item.quantity || 1)}
      </div>
      <div className="cart-item-actions">
        <button
          onClick={() => removeFromCart(item.id)}
          className="remove-btn"
        >
          Remove
        </button>
      </div>
    </div>
  );
};

export default CartItem; 