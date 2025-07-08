import React from 'react';
import { useCart } from '../../context/CartContext';
import './MenuItem.css';

const MenuItem = ({ item, disabled }) => {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    if (!disabled) {
      addToCart(item);
    }
  };

  return (
    <div className={`menu-item${disabled ? ' menu-item-disabled' : ''}`}>
      <div className="menu-item-icon">{item.icon}</div>
      <div className="menu-item-content">
        <h3>{item.name}</h3>
        <p>{item.desc}</p>
        <span className="menu-item-price">ETB {item.price}</span>
      </div>
      <button className="add-to-cart-btn" onClick={handleAddToCart} disabled={disabled}>
        Add to Cart
      </button>
    </div>
  );
};

export default MenuItem; 