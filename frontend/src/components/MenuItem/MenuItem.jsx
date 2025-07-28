import React from 'react';
import { useCart } from '../../context/CartContext';
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
    <div
      className={`menu-item transition-colors duration-150 hover:bg-green-100 active:bg-green-200`}
      style={{ cursor: 'pointer' }}
      onClick={() => addToCart(item)}
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
          disabled={quantity === 0}
          onMouseOver={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.border = '1px solid #cbd5e1'; }}
          onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.border = '1px solid #e5e7eb'; }}
        >
          -
        </button>
        <span style={{ minWidth: 18, textAlign: 'center', fontWeight: 600, fontSize: 18 }}>{quantity}</span>
        <button
          style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, width: 28, height: 28, fontSize: 24, fontWeight: 800, lineHeight: '24px', padding: 0, cursor: 'pointer', transition: 'background 0.2s, border 0.2s' }}
          onClick={handleAdd}
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