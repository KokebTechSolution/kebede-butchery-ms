import React from 'react';
import { useCart } from '../../context/CartContext';
import './MenuItem.css';

const MenuItem = ({ item }) => {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(item);
  };

  return (
    <div className="menu-item">
      <div className="menu-item-icon">{item.icon}</div>
      <div className="menu-item-content">
        <h3>{item.name}</h3>
        <p>{item.desc}</p>
        <span className="menu-item-price">ETB {item.price}</span>
      </div>
      <button className="add-to-cart-btn" onClick={handleAddToCart}>
        Add to Cart
      </button>
    </div>
  );
};

export default MenuItem; 