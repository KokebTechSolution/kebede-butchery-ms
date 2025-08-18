import React from 'react';
import { useCart } from '../../context/CartContext';
import './MenuItem.css';

const MenuItem = ({ item, onAddToCart }) => {
  const { addToCart, cartItems, updateQuantity } = useCart();

  const getItemTypeLabel = (type) => {
    switch (type) {
      case 'food': return '🍖 Food';
      case 'beverage': return '🥤 Drink';
      default: return type;
    }
  };

  const getItemTypeColor = (type) => {
    switch (type) {
      case 'food': return '#ff6b35';
      case 'beverage': return '#4ecdc4';
      default: return '#95a5a6';
    }
  };

  const handleAddToCart = () => {
    addToCart(item);
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity === 0) {
      // Remove item from cart
      const cartItem = cartItems.find(cartItem => 
        cartItem.name === item.name && cartItem.price === item.price
      );
      if (cartItem) {
        updateQuantity(cartItem.id, 0);
      }
    } else {
      // Update quantity
      const cartItem = cartItems.find(cartItem => 
        cartItem.name === item.name && cartItem.price === item.price
      );
      if (cartItem) {
        updateQuantity(cartItem.id, newQuantity);
      } else {
        // Add new item with quantity
        addToCart({ ...item, quantity: newQuantity });
      }
    }
  };

  const currentQuantity = cartItems.find(cartItem => 
    cartItem.name === item.name && cartItem.price === item.price
  )?.quantity || 0;

  const safeUnitPrice = Number.isFinite(Number(item.price)) ? Number(item.price) : 0;
  const totalPrice = (safeUnitPrice * Number(currentQuantity || 0)).toFixed(2);

  return (
    <div className="modern-menu-item">
      {/* Item Image Placeholder */}
      <div className="item-image-placeholder" style={{ backgroundColor: getItemTypeColor(item.item_type) }}>
        {item.item_type === 'food' ? '🍖' : '🧊'}
      </div>

      {/* Item Content */}
      <div className="item-content">
        {/* Item Header */}
        <div className="item-header">
          <h3 className="item-name">{item.name}</h3>
          <div className="item-badges">
            <span 
              className="item-type-badge"
              style={{ backgroundColor: getItemTypeColor(item.item_type) }}
            >
              {getItemTypeLabel(item.item_type)}
            </span>
            <span className="item-category-badge">
              📂 {item.category || 'General'}
            </span>
          </div>
        </div>

        {/* Item Description */}
        {item.description && (
          <div className="item-description">
            <span className="description-icon">ℹ️</span>
            <p>{item.description}</p>
          </div>
        )}

        {/* Item Footer */}
        <div className="item-footer">
          <div className="price-section">
            <span className="price-label">Price:</span>
            <span className="item-price">ETB {safeUnitPrice.toFixed(2)}</span>
          </div>
          
          {currentQuantity > 0 && (
            <div className="total-section">
              <span className="total-label">Total:</span>
              <span className="item-total">ETB {totalPrice}</span>
            </div>
          )}
        </div>

        {/* Quantity Section */}
        <div className="quantity-section">
          {currentQuantity === 0 ? (
            <button 
              className="add-to-cart-btn"
              onClick={handleAddToCart}
              title="Add this item to your order"
            >
              <span className="btn-icon">➕</span>
              <span className="btn-text">Add to Order</span>
            </button>
          ) : (
            <div className="quantity-controls">
              <button 
                className="quantity-btn"
                onClick={() => handleQuantityChange(currentQuantity - 1)}
                title="Reduce quantity by 1"
              >
                ➖
              </button>
              <span className="quantity-display">{currentQuantity}</span>
              <button 
                className="quantity-btn"
                onClick={() => handleQuantityChange(currentQuantity + 1)}
                title="Increase quantity by 1"
              >
                ➕
              </button>
            </div>
          )}
        </div>

        {/* Quick Tips */}
        {currentQuantity === 0 && (
          <div className="quick-tip">
            💡 <strong>Tip:</strong> Tap "Add to Order" to start building your meal!
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuItem; 