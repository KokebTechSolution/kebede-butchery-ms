import React, { useState, useEffect, useRef } from 'react';
import { MdArrowBack, MdTableRestaurant } from 'react-icons/md';
import MenuItem from '../../../components/MenuItem/MenuItem';
import { useCart } from '../../../context/CartContext';
import { fetchMenuItems } from '../../../api/menu';
import { fetchBarmanStock } from '../../../api/inventory';
import './MenuPage.css';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

// Cache for menu items and barman stock data
let menuItemsCache = null;
let barmanStockCache = null;
let lastMenuItemsFetch = 0;
let lastBarmanStockFetch = 0;
const CACHE_DURATION = {
    menuItems: 5 * 60 * 1000, // 5 minutes for menu items (less dynamic)
    barmanStock: 2 * 60 * 1000, // 2 minutes for stock (more dynamic)
};

const MenuPage = ({ table, onBack, editingOrderId, onOrder }) => {
    const [menuItems, setMenuItems] = useState([]);
    const [barmanStock, setBarmanStock] = useState([]);
    const [stockLoading, setStockLoading] = useState(false);
    const [stockError, setStockError] = useState(null);
    const [activeTab, setActiveTab] = useState('food');
    const [isOrdering, setIsOrdering] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const { setActiveTable, cartItems, orders, clearCart } = useCart();
    const mountedRef = useRef(true);

    // Check if cache is still valid
    const isCacheValid = (lastFetch, cacheType) => {
        return Date.now() - lastFetch < CACHE_DURATION[cacheType];
    };

    useEffect(() => {
        if (table && table.id) {
            setActiveTable(table.id);
        }
    }, [table, setActiveTable]);

    // Load menu items with caching
    const loadMenuItems = async (forceRefresh = false) => {
        // Use cached data if available and not forcing refresh
        if (!forceRefresh && menuItemsCache && isCacheValid(lastMenuItemsFetch, 'menuItems')) {
            console.log('🍽️ Using cached menu items data');
            setMenuItems(menuItemsCache);
            return;
        }

        try {
            console.log('🍽️ Fetching fresh menu items data from API');
            const items = await fetchMenuItems();
            
            // Update cache
            menuItemsCache = items;
            lastMenuItemsFetch = Date.now();
            
            if (mountedRef.current) {
                setMenuItems(items);
            }
        } catch (error) {
            console.error('❌ Error loading menu items:', error);
            if (mountedRef.current) {
                setMenuItems([]);
            }
        }
    };

    // Load barman stock with caching
    const loadBarmanStock = async (forceRefresh = false) => {
        // Use cached data if available and not forcing refresh
        if (!forceRefresh && barmanStockCache && isCacheValid(lastBarmanStockFetch, 'barmanStock')) {
            console.log('🍽️ Using cached barman stock data');
            setBarmanStock(barmanStockCache);
            return;
        }

        setStockLoading(true);
        setStockError(null);
        
        try {
            console.log('🍽️ Fetching fresh barman stock data from API');
            const stock = await fetchBarmanStock();
            
            // Update cache
            barmanStockCache = stock;
            lastBarmanStockFetch = Date.now();
            
            if (mountedRef.current) {
                setBarmanStock(stock);
            }
        } catch (error) {
            console.error('❌ Error loading barman stock:', error);
            if (mountedRef.current) {
                setStockError('Failed to load stock information. Please try refreshing.');
            }
        } finally {
            if (mountedRef.current) {
                setStockLoading(false);
            }
        }
    };

    // Load data on component mount
    useEffect(() => {
        const loadData = async () => {
            setIsInitialLoad(true);
            await Promise.all([
                loadMenuItems(),
                loadBarmanStock()
            ]);
            setIsInitialLoad(false);
        };

        loadData();

        // Cleanup function
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // Helper function to refresh stock (now with caching)
    const refreshStock = async () => {
        await loadBarmanStock(true); // Force refresh
    };

    // Function to clear cache (useful for debugging or when data might be stale)
    const clearCache = () => {
        menuItemsCache = null;
        barmanStockCache = null;
        lastMenuItemsFetch = 0;
        lastBarmanStockFetch = 0;
        console.log('🗑️ Menu cache cleared');
    };

    // Show cache status in console for debugging
    useEffect(() => {
        if (menuItemsCache) {
            console.log('🍽️ Menu items cache status:', {
                hasData: !!menuItemsCache,
                lastFetched: new Date(lastMenuItemsFetch).toLocaleTimeString(),
                cacheAge: Math.round((Date.now() - lastMenuItemsFetch) / 1000) + 's ago',
                isValid: isCacheValid(lastMenuItemsFetch, 'menuItems')
            });
        }
        if (barmanStockCache) {
            console.log('🍽️ Barman stock cache status:', {
                hasData: !!barmanStockCache,
                lastFetched: new Date(lastBarmanStockFetch).toLocaleTimeString(),
                cacheAge: Math.round((Date.now() - lastBarmanStockFetch) / 1000) + 's ago',
                isValid: isCacheValid(lastBarmanStockFetch, 'barmanStock')
            });
        }
    }, [menuItems, barmanStock]);

    // Show loading only on initial load
    if (isInitialLoad && (!menuItems || menuItems.length === 0)) {
        return (
            <div className="menu-container">
                <div className="menu-content">
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <div>Loading menu...</div>
                    </div>
                </div>
            </div>
        );
    }

    // Group items by type and then by category
    const groupByCategory = (items) => {
        const grouped = {};
        items.forEach(item => {
            if (!grouped[item.category_name]) grouped[item.category_name] = [];
            grouped[item.category_name].push(item);
        });
        return grouped;
    };

    // Helper function to get stock status for a beverage item
    const getStockStatus = (item) => {
        if (item.item_type !== 'beverage') return null;
        
        console.log('🔍 Looking for stock for item:', item.name, 'item_type:', item.item_type, 'product_id:', item.product);
        console.log('🔍 Available barman stock:', barmanStock);
        
        // First try to match by product ID if available
        if (item.product) {
            const stock = barmanStock.find(s => s.stock?.product?.id === item.product);
            if (stock) {
                console.log('🔍 Found stock by product ID for', item.name, ':', stock);
                return stock;
            }
        }
        
        // Try to match by product name (case-insensitive, partial match)
        const stock = barmanStock.find(s => {
            const productName = s.stock?.product?.name;
            const itemName = item.name;
            
            if (!productName || !itemName) return false;
            
            // Try exact match first
            if (productName.toLowerCase() === itemName.toLowerCase()) {
                return true;
            }
            
            // Try partial match (e.g., "Black Level" might match "Black Level Beer")
            if (productName.toLowerCase().includes(itemName.toLowerCase()) || 
                itemName.toLowerCase().includes(productName.toLowerCase())) {
                return true;
            }
            
            // Try removing common words and matching
            const cleanProductName = productName.toLowerCase().replace(/\b(beer|drink|beverage|soda|juice)\b/g, '').trim();
            const cleanItemName = itemName.toLowerCase().replace(/\b(beer|drink|beverage|soda|juice)\b/g, '').trim();
            
            if (cleanProductName === cleanItemName) {
                return true;
            }
            
            console.log('🔍 Checking stock:', productName, 'vs item name:', itemName, 'no match');
            return false;
        });
        
        console.log('🔍 Found stock for', item.name, ':', stock);
        return stock || null;
    };

    const foodItems = menuItems.filter(item => item.item_type === 'food' && item.is_available);
    const beverageItems = menuItems.filter(item => item.item_type === 'beverage' && item.is_available);
    const foodByCategory = groupByCategory(foodItems);
    const beverageByCategory = groupByCategory(beverageItems);

    // Filter previous orders for this table
    const previousOrders = orders.filter(order => order.table_number === table?.id);

    // Find the latest order for this table
    const latestOrder = previousOrders.length > 0 ? [...previousOrders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] : null;
    const isPaid = latestOrder && latestOrder.has_payment;

    return (
        <div className="menu-container">
            <div className="menu-content">
                <div className="menu-header">
                    <h2>{table ? ` Table ${table.number}` : ''}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                            onClick={() => {
                                loadMenuItems(true);
                                loadBarmanStock(true);
                            }}
                            style={{
                                background: '#4ade80',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'background 0.2s ease'
                            }}
                            onMouseOver={e => e.currentTarget.style.background = '#22c55e'}
                            onMouseOut={e => e.currentTarget.style.background = '#4ade80'}
                            title="Refresh menu and stock data"
                        >
                            🔄 Refresh
                        </button>
                        {onBack && <MdArrowBack size={36} onClick={onBack} style={{ cursor: 'pointer' }} />}
                    </div>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700 }} className="menu-tabs">
                    <button
                        className={`menu-tab ${activeTab === 'food' ? 'active' : ''}`}
                        onClick={() => setActiveTab('food')}
                    >
                        Food
                    </button>
                    <button
                        className={`menu-tab ${activeTab === 'beverage' ? 'active' : ''}`}
                        onClick={() => setActiveTab('beverage')}
                    >
                        beverages
                    </button>
                </div>
                {activeTab === 'food' && (
                    <div className="menu-section">
                        {Object.keys(foodByCategory).map(category => (
                            <div key={category} className="menu-category-section">
                                <h3>{category}</h3>
                                <div className="menu-items-grid">
                                    {foodByCategory[category].map(item => (
                                        <MenuItem key={item.id} item={item} disabled={isPaid} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {activeTab === 'beverage' && (
                    <div className="menu-section">
                        {/* Stock Status Summary */}
                        <div className="stock-summary">
                            <div>
                                <h4 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Beverage Stock Status</h4>
                                {stockError ? (
                                    <div className="stock-error">
                                        <span>⚠️</span> {stockError}
                                    </div>
                                ) : null}
                                {stockLoading && barmanStock.length === 0 ? (
                                    <div style={{ color: '#64748b', fontSize: '14px' }}>
                                        <span>⏳</span> Loading stock information...
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
                                        <span className="stock-count available">
                                            <FaCheckCircle size={14} />
                                            {beverageItems.filter(item => {
                                                const stock = getStockStatus(item);
                                                return stock && stock.quantity_in_base_units > 0;
                                            }).length} Available
                                        </span>
                                        <span className="stock-count out-of-stock">
                                            <FaTimesCircle size={14} />
                                            {beverageItems.filter(item => {
                                                const stock = getStockStatus(item);
                                                return stock && stock.quantity_in_base_units <= 0;
                                            }).length} Out of Stock
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <button
                                    onClick={refreshStock}
                                    style={{
                                        background: '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '6px 12px',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        transition: 'background 0.2s ease'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.background = '#2563eb'}
                                    onMouseOut={e => e.currentTarget.style.background = '#3b82f6'}
                                    title="Refresh stock information"
                                >
                                    🔄 Refresh Stock
                                </button>
                            </div>
                        </div>
                        {Object.keys(beverageByCategory).map(category => (
                            <div key={category} className="menu-category-section">
                                <h3>{category}</h3>
                                <div className="menu-items-grid">
                                    {beverageByCategory[category].map(item => (
                                        <MenuItem 
                                            key={item.id} 
                                            item={item} 
                                            stockStatus={getStockStatus(item)}
                                            disabled={isPaid} 
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Cart Section - Responsive */}
            <div className="cart-section">
                <div className="cart-container">
                    <h3 style={{ marginBottom: 2 }}>🛒 Current Order</h3>
                    {(() => {
                        function mergeCartItems(items) {
                            // Don't merge quantities - keep items separate for display
                            return items;
                        }
                        const mergedCartItems = mergeCartItems(cartItems);
                        return mergedCartItems.length === 0 ? (
                            <div>No items in current order.</div>
                        ) : (
                            <ul style={{ marginBottom: 6 }}>
                                {mergedCartItems.map(item => (
                                    <li key={item.name + '-' + item.price + '-' + (item.item_type || 'food')}>
                                        {item.name} × {item.quantity} — ${(item.price * item.quantity).toFixed(2)}
                                    </li>
                                ))}
                            </ul>
                        );
                    })()}
                    <div style={{ fontWeight: 'bold', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>
                        Running Total: ${cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          style={{
                            background: '#4ade80',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 4,
                            padding: '6px 16px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'background 0.2s, color 0.2s',
                          }}
                          disabled={cartItems.length === 0 || isOrdering}
                          onClick={async () => {
                            if (isOrdering) return;
                            setIsOrdering(true);
                            try {
                              await onOrder();
                              clearCart();
                            } finally {
                              setIsOrdering(false);
                            }
                          }}
                          onMouseOver={e => e.currentTarget.style.background = '#22c55e'}
                          onMouseOut={e => e.currentTarget.style.background = '#4ade80'}
                          onMouseDown={e => e.currentTarget.style.background = '#16a34a'}
                          onMouseUp={e => e.currentTarget.style.background = '#22c55e'}
                        >
                          {isOrdering ? 'Ordering...' : 'Order'}
                        </button>
                        {cartItems.length > 0 && (
                          <button
                            style={{
                              background: '#ff4444',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 4,
                              padding: '6px 16px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              marginLeft: 6,
                              transition: 'background 0.2s, color 0.2s',
                            }}
                            onClick={clearCart}
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                </div>
            </div>

            {/* Debug info - only show in development */}
            {process.env.NODE_ENV === 'development' && (
                <div style={{ 
                    position: 'fixed', 
                    bottom: 100, 
                    right: 32, 
                    background: 'rgba(0,0,0,0.8)', 
                    color: 'white', 
                    padding: '8px', 
                    borderRadius: '4px', 
                    fontSize: '12px',
                    zIndex: 999
                }}>
                    <div>Menu Items: {menuItems.length}</div>
                    <div>Stock Items: {barmanStock.length}</div>
                    <div>Menu Cache: {menuItemsCache ? '✅' : '❌'}</div>
                    <div>Stock Cache: {barmanStockCache ? '✅' : '❌'}</div>
                    <button 
                        onClick={clearCache}
                        style={{ 
                            background: '#ef4444', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px', 
                            padding: '4px 8px', 
                            fontSize: '10px',
                            cursor: 'pointer',
                            marginTop: '4px'
                        }}
                    >
                        Clear Cache
                    </button>
                </div>
            )}
        </div>
    );
};

export default MenuPage;
