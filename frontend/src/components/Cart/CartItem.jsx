import React from 'react';
import { useCart } from '../../context/CartContext';
import './Cart.css';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="cart-item">
      <div className="cart-item-image">
        {item.icon && item.icon}
      </div>
      <div className="cart-item-details">
        <h3 className="cart-item-name">{item.name}</h3>
        <span className="cart-item-price">ETB {item.price}</span>
      </div>
      <div className="cart-item-quantity">
        <button
          onClick={() => updateQuantity(item.id, item.quantity - 1)}
          className="cart-quantity-btn"
        >
          -
        </button>
        <span className="cart-quantity-display">{item.quantity}</span>
        <button
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
          className="cart-quantity-btn"
        >
          +
        </button>
      </div>
      <div className="cart-item-subtotal">
        ETB {item.price * item.quantity}
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