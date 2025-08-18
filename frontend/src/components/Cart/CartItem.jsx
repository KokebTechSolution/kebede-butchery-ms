import React from 'react';
import { useCart } from '../../context/CartContext';
import './Cart.css';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  console.log('CartItem: Rendering item:', item);

  const handleIncreaseQuantity = () => {
    console.log('CartItem: Increasing quantity for item:', item);
    updateQuantity(item.id, Number(item.quantity || 0) + 1);
  };

  const handleDecreaseQuantity = () => {
    console.log('CartItem: Decreasing quantity for item:', item);
    const currentQty = Number(item.quantity || 0);
    if (currentQty > 1) {
      updateQuantity(item.id, currentQty - 1);
    } else {
      removeFromCart(item.id);
    }
  };

  const handleRemove = () => {
    console.log('CartItem: Removing item:', item);
    removeFromCart(item.id);
  };

  // Safe price formatter
  const formatPrice = (price) => {
    const amount = Number(price);
    const safe = Number.isFinite(amount) ? amount : 0;
    return `ETB ${safe.toFixed(2)}`;
  };

  // Calculate item total safely
  const calculateItemTotal = (it) => {
    const unit = Number(it?.price);
    const qty = Number(it?.quantity);
    const unitSafe = Number.isFinite(unit) ? unit : 0;
    const qtySafe = Number.isFinite(qty) ? qty : 0;
    return unitSafe * qtySafe;
  };

  // Get appropriate icon based on item type
  const getItemIcon = () => {
    if (item.item_type === 'beverage') {
      return '🥤';
    }
    return '🍖';
  };

  // Get category color
  const getCategoryColor = () => {
    if (item.item_type === 'beverage') {
      return '#3b82f6';
    }
    return '#f59e0b';
  };

  const safeQuantity = Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : 1;

  return (
    <div className="modern-cart-item">
      {/* Item Icon */}
      <div className="cart-item-icon" style={{ backgroundColor: getCategoryColor() }}>
        <span style={{ fontSize: '20px' }}>{getItemIcon()}</span>
      </div>
      
      {/* Item Details */}
      <div className="cart-item-content">
        <div className="cart-item-header">
          <h3 className="cart-item-name">{item.name}</h3>
          <span className="cart-item-type" style={{ backgroundColor: getCategoryColor() }}>
            {item.item_type === 'beverage' ? 'Drink' : 'Food'}
          </span>
        </div>
        
        {item.description && (
          <p className="cart-item-description">{item.description}</p>
        )}
        
        <div className="cart-item-price-info">
          <span className="unit-price">Unit: {formatPrice(item.price)}</span>
          <span className="total-price">Total: {formatPrice(calculateItemTotal(item))}</span>
        </div>
      </div>
      
      {/* Quantity Controls */}
      <div className="cart-item-quantity">
        <div className="quantity-controls">
          <button
            onClick={handleDecreaseQuantity}
            className="quantity-btn minus"
            aria-label="Decrease quantity"
          >
            ➖
          </button>
          
          <span className="quantity-display">{safeQuantity}</span>
          
          <button
            onClick={handleIncreaseQuantity}
            className="quantity-btn plus"
            aria-label="Increase quantity"
          >
            ➕
          </button>
        </div>
        
        <div className="quantity-badge" style={{ backgroundColor: getCategoryColor() }}>
          <span className="quantity-badge-text">{safeQuantity}</span>
        </div>
      </div>
      
      {/* Remove Button */}
      <button
        onClick={handleRemove}
        className="remove-item-btn"
        aria-label="Remove item"
        title="Remove this item"
      >
        🗑️
      </button>
    </div>
  );
};

export default CartItem; 