import React from 'react';
import { useCart } from '../../context/CartContext';
import { formatPrice, calculateItemTotal } from '../../utils/priceUtils';
import './Cart.css';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  console.log('CartItem: Rendering item:', item);

  const handleIncreaseQuantity = () => {
    console.log('CartItem: Increasing quantity for item:', item);
    updateQuantity(item.id, item.quantity + 1);
  };

  const handleDecreaseQuantity = () => {
    console.log('CartItem: Decreasing quantity for item:', item);
    updateQuantity(item.id, item.quantity - 1);
  };

  const handleRemove = () => {
    console.log('CartItem: Removing item:', item);
    removeFromCart(item.id);
  };

  return (
    <div className="cart-item">
      <div className="cart-item-info">
        <div className="cart-item-icon">{item.icon && item.icon}</div>
        <div className="cart-item-details">
          <h3>{item.name}</h3>
          <p>{item.desc}</p>
          <span className="cart-item-price">{formatPrice(item.price)}</span>
        </div>
      </div>
      <div className="cart-item-actions">
        <div className="quantity-controls">
          <button
            onClick={handleDecreaseQuantity}
            className="quantity-btn"
          >
            -
          </button>
          <span className="quantity">{item.quantity}</span>
          <button
            onClick={handleIncreaseQuantity}
            className="quantity-btn"
          >
            +
          </button>
        </div>
        <div className="cart-item-subtotal">
          {formatPrice(calculateItemTotal(item))}
        </div>
        <button
          onClick={handleRemove}
          className="remove-btn"
        >
          Remove
        </button>
      </div>
    </div>
  );
};

export default CartItem; 