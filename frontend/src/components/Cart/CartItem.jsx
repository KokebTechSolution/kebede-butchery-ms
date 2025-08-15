import React from 'react';
import { useCart } from '../../context/CartContext';
import { formatPrice, calculateItemTotal } from '../../utils/priceUtils';
import { MdAdd, MdRemove, MdDelete, MdRestaurant, MdLocalDrink } from 'react-icons/md';
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
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    } else {
      removeFromCart(item.id);
    }
  };

  const handleRemove = () => {
    console.log('CartItem: Removing item:', item);
    removeFromCart(item.id);
  };

  // Get appropriate icon based on item type
  const getItemIcon = () => {
    if (item.item_type === 'beverage') {
      return <MdLocalDrink size={20} />;
    }
    return <MdRestaurant size={20} />;
  };

  // Get category color
  const getCategoryColor = () => {
    if (item.item_type === 'beverage') {
      return 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
    }
    return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
  };

  return (
    <div className="modern-cart-item">
      {/* Item Icon */}
      <div className="cart-item-icon" style={{ background: getCategoryColor() }}>
        {getItemIcon()}
      </div>
      
      {/* Item Details */}
      <div className="cart-item-content">
        <div className="cart-item-header">
          <h3 className="cart-item-name">{item.name}</h3>
          <span className="cart-item-type" style={{ background: getCategoryColor() }}>
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
            <MdRemove size={18} />
          </button>
          
          <span className="quantity-display">{item.quantity}</span>
          
          <button
            onClick={handleIncreaseQuantity}
            className="quantity-btn plus"
            aria-label="Increase quantity"
          >
            <MdAdd size={18} />
          </button>
        </div>
        
        <div className="quantity-badge" style={{ background: getCategoryColor() }}>
          <span className="quantity-badge-text">{item.quantity}</span>
        </div>
      </div>
      
      {/* Remove Button */}
      <button
        onClick={handleRemove}
        className="remove-item-btn"
        aria-label="Remove item from cart"
      >
        <MdDelete size={18} />
        <span>Remove</span>
      </button>
    </div>
  );
};

export default CartItem; 