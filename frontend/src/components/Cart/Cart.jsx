import React from 'react';
import { useCart } from '../../context/CartContext';
import CartItem from './CartItem';
import './Cart.css';

const Cart = ({ onOrder, onClearCart, editingOrderId, onUpdateOrder }) => {
  const { cartItems, clearCart, getTotalItems } = useCart();

  console.log('Cart: Rendering with:', {
    cartItemsLength: cartItems.length,
    cartItems,
    editingOrderId
  });

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
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
      <div className="cart-header">
        <h2>Cart</h2>
        {editingOrderId && (
          <span className="editing-badge">Editing Order #{editingOrderId}</span>
        )}
      </div>
      
      <div className="cart-items">
        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <p>Your cart is empty</p>
            <p>Add items from the menu</p>
          </div>
        ) : (
          cartItems.map((item) => (
            <CartItem key={item.id || `${item.name}-${item.price}`} item={item} />
          ))
        )}
      </div>
      
      {cartItems.length > 0 && (
        <div className="cart-footer">
          <div className="cart-total">
            <span>Total Items: {getTotalItems()}</span>
            <span className="total-price">ETB {getTotalPrice().toFixed(2)}</span>
          </div>
          
          <div className="cart-actions">
            <button 
              onClick={handleClearCart}
              className="clear-cart-btn"
            >
              Clear Cart
            </button>
            <button 
              onClick={handleOrder}
              className="order-btn"
              disabled={cartItems.length === 0}
            >
              {editingOrderId ? 'Update Order' : 'Place Order'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart; 