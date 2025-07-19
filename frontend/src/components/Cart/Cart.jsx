import React from 'react';
import { useCart } from '../../context/CartContext';
import CartItem from './CartItem';
import './Cart.css';

const Cart = ({ onOrder, onClearCart }) => {
  const { cartItems, clearCart } = useCart();

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleClearCart = () => {
    if (onClearCart) {
      onClearCart();
    } else {
      clearCart();
    }
  };

  return (
    <div className="cart">
      <h3>🛒 Current Order</h3>
      {cartItems.length === 0 ? (
        <div>No items in current order.</div>
      ) : (
        <ul>
          {cartItems.map(item => (
            <CartItem key={item.name} item={item} />
          ))}
        </ul>
      )}
      <div className="cart-total">
        <span>
          Running Total: ${getTotalPrice().toFixed(2)}
        </span>
        <div className="cart-buttons">
          <button
            className="order-button"
            disabled={cartItems.length === 0}
            onClick={onOrder}
          >
            Order
          </button>
          {cartItems.length > 0 && (
            <button
              className="clear-button"
              onClick={handleClearCart}
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart; 