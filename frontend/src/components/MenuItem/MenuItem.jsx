import React from 'react';
import { useCart } from '../../context/CartContext';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import './MenuItem.css';

const MenuItem = ({ item, stockStatus }) => {
  const { addToCart, cartItems, updateQuantity } = useCart();

  // Debug logging
  console.log('🔍 MenuItem received:', { 
    item: item.name, 
    stockStatus, 
    item_type: item.item_type,
    product_id: item.product,
    item_data: item
  });

  // Sum the quantity of all items with the same name
  const quantity = cartItems
    .filter(i => i.name === item.name)
    .reduce((sum, i) => sum + i.quantity, 0);

  // Check if item is a beverage and has stock status
  const isBeverage = item.item_type === 'beverage';
  const hasStock = stockStatus && stockStatus.quantity_in_base_units > 0;
  const isOutOfStock = isBeverage && stockStatus && stockStatus.quantity_in_base_units <= 0;
  
  // Calculate available stock in input units (e.g., cartons) for beverages
  const getAvailableStock = () => {
    if (!isBeverage || !stockStatus || !stockStatus.quantity_in_base_units) return 0;
    
    console.log('🔍 Calculating available stock for:', item.name);
    console.log('🔍 Stock status:', stockStatus);
    console.log('🔍 quantity_in_base_units:', stockStatus.quantity_in_base_units);
    console.log('🔍 conversion_amount:', stockStatus.stock?.product?.conversion_amount);
    
    // Get conversion factor from the product's conversion_amount
    // This tells us how many base units (e.g., bottles) are in one input unit (e.g., carton)
    let conversionFactor = stockStatus.stock?.product?.conversion_amount;
    
    // Safety check: if conversion factor is 0, undefined, or null, use default
    if (!conversionFactor || conversionFactor <= 0) {
      console.log('🔍 Invalid conversion factor, using default:', conversionFactor);
      conversionFactor = 24; // Default fallback: 1 carton = 24 bottles
    }
    
    console.log('🔍 Using conversion factor:', conversionFactor);
    
    const availableStock = Math.floor(stockStatus.quantity_in_base_units / conversionFactor);
    console.log('🔍 Calculated available stock:', availableStock);
    
    return availableStock;
  };
  
  const availableStock = getAvailableStock();
  // For food items, always allow ordering; for beverages, check stock
  const canOrderMore = item.item_type === 'food' ? true : availableStock > quantity;
  
  // Show warning message without revealing exact quantity
  const getWarningMessage = () => {
    // Only show warnings for beverages, not for food items
    if (item.item_type !== 'beverage') {
      return null;
    }
    
    if (availableStock === 0) {
      return '⚠️ This item is out of stock and cannot be ordered.';
    } else if (!canOrderMore) {
      return `⚠️ You cannot order more than the available stock. You already have ${quantity} in your cart.`;
    }
    return null;
  };

  const handleAdd = (e) => {
    e.preventDefault();
    
    // For food items, always allow adding to cart
    // For beverages, check stock availability
    if (item.item_type === 'food' || canOrderMore) {
      addToCart(item);
    }
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
      className={`menu-item transition-colors duration-150 hover:bg-green-100 active:bg-green-200 ${isOutOfStock ? 'out-of-stock' : ''}`}
      style={{ cursor: isOutOfStock ? 'not-allowed' : 'pointer' }}
      onClick={() => !isOutOfStock && addToCart(item)}
    >
      <div className="menu-item-icon">{item.icon}</div>
      <div className="menu-item-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3>{item.name}</h3>
          {isBeverage && stockStatus && (
            <div className={`stock-status ${hasStock ? 'in-stock' : 'out-of-stock'}`}>
              {hasStock ? (
                <FaCheckCircle size={16} className="stock-status-icon" title="In Stock - Available to order" />
              ) : (
                <FaTimesCircle size={16} className="stock-status-icon" title="Out of Stock - Cannot order" />
              )}
            </div>
          )}
        </div>
        <p>{item.desc}</p>
        <span className="menu-item-price">ETB {item.price}</span>
        {isBeverage && stockStatus && (
          <div className={`stock-status ${hasStock ? 'in-stock' : 'out-of-stock'}`} style={{ marginTop: '4px' }}>
            {hasStock ? (
              <span>✓ Available</span>
            ) : (
              <span>✗ Out of Stock</span>
            )}
          </div>
        )}
        
        {/* Show warning when stock limit is reached */}
        {isBeverage && stockStatus && !canOrderMore && quantity > 0 && (
          <div className="stock-warning" style={{ marginTop: '4px', color: '#f59e0b', fontSize: '12px' }}>
            ⚠️ Stock limit reached
          </div>
        )}
        
        {/* Show debug info when no stock status is found */}
        {isBeverage && !stockStatus && (
          <div className="stock-debug" style={{ marginTop: '4px', color: '#6b7280', fontSize: '12px' }}>
            🔍 No stock data found
          </div>
        )}
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
          onClick={handleAdd}
          className="add-to-cart-btn"
          disabled={isOutOfStock || (isBeverage && !canOrderMore)}
          title={isOutOfStock ? 'Out of stock' : (isBeverage && !canOrderMore) ? 'Stock limit reached' : 'Add to cart'}
        >
          +
        </button>
      </div>
    </div>
  );
};

export default MenuItem; 