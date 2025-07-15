import React from 'react';
import { useCart } from '../../context/CartContext';
import CartItem from './CartItem';
import './Cart.css';

const Cart = ({ onOrder }) => {
  const { cartItems, clearCart, getTotalItems } = useCart();

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Remove all UI rendering, keep logic intact
  return null;
};

export default Cart; 