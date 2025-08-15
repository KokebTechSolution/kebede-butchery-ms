import React from 'react';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/priceUtils';
import { MdRestaurant, MdLocalDrink, MdAdd, MdRemove } from 'react-icons/md';
import './MenuItem.css';

const MenuItem = ({ item, disabled = false }) => {
  const { addToCart, cartItems, updateQuantity } = useCart();

  // Sum the quantity of all items with the same name
  const quantity = cartItems
    .filter(i => i.name === item.name)
    .reduce((sum, i) => sum + i.quantity, 0);

  const handleAdd = (e) => {
    e.stopPropagation();
    if (disabled) return;
    addToCart(item);
  };

  const handleSubtract = (e) => {
    e.stopPropagation();
    if (quantity === 0 || disabled) return;

    // Find the first (preferably 'pending') cart item with this name and quantity > 0
    const target = cartItems
      .filter(i => i.name === item.name && i.quantity > 0)
      .sort((a, b) => (a.status === 'pending' ? -1 : 1))[0];

    if (target) {
      updateQuantity(target.id, target.quantity - 1);
    }
  };

  // Get appropriate icon based on item type
  const getItemIcon = () => {
    if (item.item_type === 'beverage') {
      return <MdLocalDrink size={24} />;
    }
    return <MdRestaurant size={24} />;
  };

  // Get category color
  const getCategoryColor = () => {
    if (item.item_type === 'beverage') {
      return 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
    }
    return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
  };

  return (
    <div className={`modern-menu-item ${disabled ? 'disabled' : ''} ${quantity > 0 ? 'has-items' : ''}`}>
      {/* Item Image Placeholder */}
      <div className="item-image-placeholder" style={{ background: getCategoryColor() }}>
        {getItemIcon()}
      </div>
      
      {/* Item Content */}
      <div className="item-content">
        <div className="item-header">
          <h3 className="item-name">{item.name}</h3>
          <span className="item-category">{item.category_name || 'General'}</span>
        </div>
        
        {item.description && (
          <p className="item-description">{item.description}</p>
        )}
        
        <div className="item-footer">
          <span className="item-price">{formatPrice(item.price)}</span>
          <span className="item-type-badge" style={{ background: getCategoryColor() }}>
            {item.item_type === 'beverage' ? 'Drink' : 'Food'}
          </span>
        </div>
      </div>
      
      {/* Quantity Controls */}
      <div className="quantity-section">
        <div className="quantity-controls">
          <button
            className={`quantity-btn minus ${quantity === 0 || disabled ? 'disabled' : ''}`}
            onClick={handleSubtract}
            disabled={quantity === 0 || disabled}
            aria-label="Decrease quantity"
          >
            <MdRemove size={20} />
          </button>
          
          <span className="quantity-display">
            {quantity}
          </span>
          
          <button
            className={`quantity-btn plus ${disabled ? 'disabled' : ''}`}
            onClick={handleAdd}
            disabled={disabled}
            aria-label="Increase quantity"
          >
            <MdAdd size={20} />
          </button>
        </div>
        
        {quantity > 0 && (
          <div className="quantity-badge" style={{ background: getCategoryColor() }}>
            <span className="quantity-badge-text">{quantity}</span>
          </div>
        )}
      </div>
      
      {/* Disabled Overlay */}
      {disabled && (
        <div className="disabled-overlay">
          <span className="disabled-text">Table Paid</span>
        </div>
      )}
    </div>
  );
};

export default MenuItem; 