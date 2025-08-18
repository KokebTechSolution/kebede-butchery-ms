import React, { useState, useEffect } from 'react';
import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';
import MenuItem from '../../../components/MenuItem/MenuItem';
import axiosInstance from '../../../api/axiosInstance';
import './MenuPage.css';

const MenuPage = ({ table, onBack, editingOrderId, onOrder }) => {
  const { setActiveTable, cartItems, orders, clearCart, addToCart, placeOrder, refreshAll } = useCart();
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState([]); // Initialize as empty array
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [orderMessage, setOrderMessage] = useState('');

  // Set active table when component mounts
  useEffect(() => {
    if (table) {
      setActiveTable(table.id);
    }
  }, [table, setActiveTable]);

  // Fetch menu items
  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      
      // Use the correct endpoint from the API
      const response = await axiosInstance.get('/menu/menuitems/');
      
      console.log('[MenuPage] Menu items response:', response.data);
      
      // Ensure response.data is an array
      if (Array.isArray(response.data)) {
        setMenuItems(response.data);
      } else {
        console.warn('[MenuPage] Menu items response is not an array:', response.data);
        setMenuItems([]);
      }
    } catch (error) {
      console.error('[MenuPage] Error fetching menu items:', error);
      // Set some default items so the UI can work
      const fallbackItems = [
        {
          id: 1,
          name: 'Traditional Gurage Ethiopian Food',
          description: 'Authentic Ethiopian cuisine with traditional spices',
          price: 12000.00,
          item_type: 'food',
          category: 'food',
          is_available: true
        },
        {
          id: 2,
          name: 'Leb Leb',
          description: 'Traditional Ethiopian drink',
          price: 1300.00,
          item_type: 'beverage',
          category: 'beverage',
          is_available: true
        }
      ];
      setMenuItems(fallbackItems);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item) => {
    addToCart(item);
    // Show success feedback
    setOrderMessage(`✅ Added ${item.name} to cart!`);
    setTimeout(() => setOrderMessage(''), 2000);
  };

  const handlePlaceOrder = async () => {
    if (!table) {
      setOrderMessage('❌ No table selected!');
      return;
    }

    if (cartItems.length === 0) {
      setOrderMessage('❌ Cart is empty! Add some items first.');
      return;
    }

    setOrdering(true);
    setOrderMessage('🔄 Placing order...');

    try {
      const orderData = {
        table: table.id,
        created_by: user?.id, // Add the user ID for created_by field
        items: cartItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          item_type: item.item_type || 'food',
          status: 'pending'
        })),
        waiter_username: user?.username || 'waiter_user1', // Use actual user from auth context
        waiter_table_number: table.number,
        payment_option: 'cash'
      };

      console.log('[MenuPage] Placing order with data:', orderData);
      
      const orderId = await placeOrder(orderData);
      
      if (orderId) {
        setOrderMessage('✅ Order placed successfully! Order ID: ' + orderId);
        clearCart();
        
        // Call the onOrder callback if provided
        if (onOrder) {
          onOrder(orderId);
        }
        
        // Refresh data
        await refreshAll();
        
        // Show success message for a bit longer
        setTimeout(() => {
          setOrderMessage('');
          // Optionally go back to tables or stay on menu
        }, 3000);
      } else {
        throw new Error('Failed to get order ID');
      }
    } catch (error) {
      console.error('[MenuPage] Error placing order:', error);
      setOrderMessage(`❌ Order failed: ${error.message || 'Unknown error'}`);
    } finally {
      setOrdering(false);
    }
  };

  const handleBack = () => {
    clearCart();
    onBack();
  };

  // Ensure menuItems is always an array before filtering
  const safeMenuItems = Array.isArray(menuItems) ? menuItems : [];
  
  const filteredItems = safeMenuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.item_type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'food', 'beverage'];
  const cartItemCount = cartItems.length;

  const clearSearch = () => {
    setSearchTerm('');
    setSelectedCategory('all');
  };

  const getCartSummary = () => {
    const totalItems = cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const totalPrice = cartItems.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      return sum + (price * quantity);
    }, 0);
    return { totalItems, totalPrice };
  };

  const { totalItems, totalPrice } = getCartSummary();

  if (loading) {
    return (
      <div className="modern-menu-page">
        <div className="menu-loading-container">
          <div className="loading-spinner"></div>
          <h2 className="loading-title">Loading Menu...</h2>
          <p className="loading-subtitle">Please wait while we fetch the latest items</p>
        </div>
      </div>
    );
  }

  if (safeMenuItems.length === 0) {
    return (
      <div className="modern-menu-page">
        <div className="menu-empty-container">
          <div className="empty-icon">🍽️</div>
          <h2 className="empty-title">No Menu Items Available</h2>
          <p className="empty-subtitle">Please check back later or contact the kitchen staff.</p>
          <button className="empty-back-btn" onClick={handleBack}>
            ← Go Back to Tables
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-menu-page">
      {/* Order Status Message */}
      {orderMessage && (
        <div className={`order-status-message ${orderMessage.includes('❌') ? 'error' : orderMessage.includes('✅') ? 'success' : 'info'}`}>
          {orderMessage}
        </div>
      )}

      {/* Header Section */}
      <div className="menu-header">
        <div className="header-content">
          <div className="header-left">
            <button className="back-btn" onClick={handleBack}>
              ← Back to Tables
            </button>
            <div className="page-title">
              <h1>🍽️ Menu</h1>
              <p>Select items to add to your order</p>
            </div>
          </div>
          
          <div className="header-right">
            <div className="table-info">
              <div className="table-icon">🪑</div>
              <div className="table-details">
                <span className="table-label">Table</span>
                <span className="table-number">{table?.number || 'Unknown'}</span>
                <span className="table-status">Ready to order</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cart Summary Bar */}
      <div className="cart-summary-bar">
        <div className="cart-info">
          <span className="cart-icon">🛒</span>
          <span className="cart-count">{totalItems} items</span>
          <span className="cart-price">ETB {totalPrice.toFixed(2)}</span>
        </div>
        
        {totalItems > 0 && (
          <button 
            className={`place-order-btn ${ordering ? 'ordering' : ''}`}
            onClick={handlePlaceOrder}
            disabled={ordering}
          >
            {ordering ? '🔄 Placing Order...' : '🚀 Place Order'}
          </button>
        )}
      </div>

      {/* Search and Filter Bar */}
      <div className="search-filter-bar">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search for food, drinks, or categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={clearSearch}>
              ✕
            </button>
          )}
        </div>
        
        <button
          className="filter-toggle-btn"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Hide' : 'Show'} Filters 🔽
        </button>
      </div>

      {/* Category Filter */}
      {showFilters && (
        <div className="category-filter">
          <div className="filter-header">
            <h4>📂 Categories:</h4>
            <button className="clear-filters-btn" onClick={clearSearch}>
              Clear All
            </button>
          </div>
          <div className="category-buttons">
            {categories.map(category => (
              <button
                key={category}
                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'all' ? '🍽️ All Items' : 
                 category === 'food' ? '🍖 Food & Main Dishes' :
                 category === 'beverage' ? '🥤 Beverages & Drinks' : category}
                <span className="item-count">
                  {category === 'all' ? safeMenuItems.length : 
                   safeMenuItems.filter(item => item.item_type === category).length}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        {categories.map(category => (
          <button
            key={category}
            className={`tab-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category === 'all' ? '🍽️ All' : 
             category === 'food' ? '🍖 Food' :
             category === 'beverage' ? '🥤 Drinks' : category}
            <span className="item-count">
              {category === 'all' ? safeMenuItems.length : 
               safeMenuItems.filter(item => item.item_type === category).length}
            </span>
          </button>
        ))}
      </div>

      {/* Menu Content */}
      <div className="menu-content">
        {filteredItems.length === 0 ? (
          <div className="no-items-found">
            <div className="no-items-icon">🔍</div>
            <h3>No items found</h3>
            <p>Try adjusting your search or category filter</p>
            <button className="clear-filters-btn" onClick={clearSearch}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="menu-section">
            {categories.filter(cat => cat !== 'all').map(category => {
              const categoryItems = filteredItems.filter(item => item.item_type === category);
              if (categoryItems.length === 0) return null;
              
              return (
                <div key={category} className="category-section">
                  <div className="category-header">
                    <h3 className="category-title">
                      {category === 'food' ? '🍖 Main Dishes' : 
                       category === 'beverage' ? '🥤 Beverages' : category}
                    </h3>
                    <span className="category-count">{categoryItems.length} items</span>
                  </div>
                  <div className="items-grid">
                    {categoryItems.map((item) => (
                      <MenuItem
                        key={item.id}
                        item={item}
                        onAddToCart={handleAddToCart}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-item">
          <span className="stat-icon">🍽️</span>
          <span className="stat-label">Total Items</span>
          <span className="stat-value">{safeMenuItems.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">🛒</span>
          <span className="stat-label">In Cart</span>
          <span className="stat-value">{totalItems}</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">💰</span>
          <span className="stat-label">Total Value</span>
          <span className="stat-value">ETB {totalPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* Mobile Bottom Action Bar */}
      <div className="mobile-bottom-actions">
        <button className="mobile-cart-btn" onClick={() => document.querySelector('.cart-summary-bar')?.scrollIntoView({ behavior: 'smooth' })}>
          🛒 Cart ({totalItems})
        </button>
        {totalItems > 0 && (
          <button 
            className="mobile-order-btn"
            onClick={handlePlaceOrder}
            disabled={ordering}
          >
            {ordering ? '🔄 Placing...' : '🚀 Order Now'}
          </button>
        )}
      </div>
    </div>
  );
};

export default MenuPage;


