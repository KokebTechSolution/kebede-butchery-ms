import React from 'react';
import { useCart } from '../../context/CartContext';
import './MenuItem.css';

const MenuItem = ({ item, disabled }) => {
  const { addToCart, cartItems, updateQuantity } = useCart();

  const cartItem = cartItems.find(i => i.name === item.name);
  const quantity = cartItem ? cartItem.quantity : 0;

  const handleAdd = (e) => {
    e.stopPropagation();
    if (!disabled) {
      addToCart(item);
    }
  };

  const handleSubtract = (e) => {
    e.stopPropagation();
    if (!disabled && quantity > 0) {
      updateQuantity(item.name, quantity - 1);
    }
  };

  return (
    <div
      className={`menu-item${disabled ? ' menu-item-disabled' : ''} transition-colors duration-150 hover:bg-green-100 active:bg-green-200`}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
      onClick={() => !disabled && addToCart(item)}
    >
      <div className="menu-item-icon">{item.icon}</div>
      <div className="menu-item-content">
        <h3>{item.name}</h3>
        <p>{item.desc}</p>
        <span className="menu-item-price">ETB {item.price}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
        <button
          style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, width: 28, height: 28, fontSize: 24, fontWeight: 800, lineHeight: '24px', padding: 0, cursor: 'pointer', transition: 'background 0.2s, border 0.2s' }}
          onClick={handleSubtract}
          disabled={disabled || quantity === 0}
          onMouseOver={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.border = '1px solid #cbd5e1'; }}
          onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.border = '1px solid #e5e7eb'; }}
        >
          -
        </button>
        <span style={{ minWidth: 18, textAlign: 'center', fontWeight: 600, fontSize: 18 }}>{quantity}</span>
        <button
          style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, width: 28, height: 28, fontSize: 24, fontWeight: 800, lineHeight: '24px', padding: 0, cursor: 'pointer', transition: 'background 0.2s, border 0.2s' }}
          onClick={handleAdd}
          disabled={disabled}
          onMouseOver={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.border = '1px solid #cbd5e1'; }}
          onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.border = '1px solid #e5e7eb'; }}
        >
          +
        </button>
      </div>
    </div>
  );
};

export default MenuItem; 