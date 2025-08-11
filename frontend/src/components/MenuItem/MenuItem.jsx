import React from 'react';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/priceUtils';
import './MenuItem.css';

const MenuItem = ({ item }) => {
  const { addToCart, cartItems, updateQuantity } = useCart();

  // Sum the quantity of all items with the same name
  const quantity = cartItems
    .filter(i => i.name === item.name)
    .reduce((sum, i) => sum + i.quantity, 0);

  const handleAdd = (e) => {
    e.stopPropagation();
    addToCart(item);
  };

  const handleSubtract = (e) => {
    e.stopPropagation();
    if (quantity === 0) return;

    // Find the first (preferably 'pending') cart item with this name and quantity > 0
    const target = cartItems
      .filter(i => i.name === item.name && i.quantity > 0)
      .sort((a, b) => (a.status === 'pending' ? -1 : 1))[0];

    if (target) {
      updateQuantity(target.id, target.quantity - 1);
    }
  };

  return (
    <div className="menu-item">
      <div className="menu-item-main">
        <div className="menu-item-icon">
          {item.icon || '🍽️'}
        </div>
        <div className="menu-item-content">
          <h3 className="menu-item-name">{item.name}</h3>
          <p className="menu-item-description">{item.desc}</p>
          <span className="menu-item-price">
            {formatPrice(item.price)}
          </span>
        </div>
      </div>
      
      <div className="menu-item-actions">
        <div className="quantity-controls">
          <button
            className="quantity-btn quantity-btn-minus"
            onClick={handleSubtract}
            disabled={quantity === 0}
            aria-label="Decrease quantity"
          >
            <span className="quantity-btn-text">−</span>
          </button>
          
          <span className="quantity-display">
            {quantity}
          </span>
          
          <button
            className="quantity-btn quantity-btn-plus"
            onClick={handleAdd}
            aria-label="Increase quantity"
          >
            <span className="quantity-btn-text">+</span>
          </button>
        </div>
        
        {quantity > 0 && (
          <div className="quantity-badge">
            <span className="quantity-badge-text">{quantity}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuItem; 