import React from 'react';
import { useCart } from '../../context/CartContext';
import './Cart.css';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="cart-item">
      <div className="cart-item-info">
        <div className="cart-item-icon">{item.icon && item.icon}</div>
        <div className="cart-item-details">
          <h3>{item.name}</h3>
          <p>{item.desc}</p>
          <span className="cart-item-price">ETB {item.price}</span>
        </div>
      </div>
      <div className="cart-item-actions">
        <div className="quantity-controls">
          <button
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            className="quantity-btn"
          >
            -
          </button>
          <span className="quantity">{item.quantity}</span>
          <button
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            className="quantity-btn"
          >
            +
          </button>
        </div>
        <div className="cart-item-subtotal">
          ETB {item.price * item.quantity}
        </div>
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