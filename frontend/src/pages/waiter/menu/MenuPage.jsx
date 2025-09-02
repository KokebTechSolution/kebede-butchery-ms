import React, { useState, useEffect } from 'react';
import { MdArrowBack, MdTableRestaurant } from 'react-icons/md';
import MenuItem from '../../../components/MenuItem/MenuItem';
import { useCart } from '../../../context/CartContext';
import { fetchMenuItems } from '../../../api/menu'; // Updated import
import { fetchBarmanStock } from '../../../api/inventory'; // Add this import
import { getCachedMenuItems, cacheMenuItems, getCachedBarmanStock, cacheBarmanStock } from '../../../utils/cacheUtils';
import './MenuPage.css';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa'; // Added import for icons

const MenuPage = ({ table, onBack, editingOrderId, onOrder }) => {
    const [menuItems, setMenuItems] = useState([]);
    const [barmanStock, setBarmanStock] = useState([]);
    const [stockLoading, setStockLoading] = useState(false);
    const [stockError, setStockError] = useState(null);
    const [activeTab, setActiveTab] = useState('food');
    const [isOrdering, setIsOrdering] = useState(false); // <-- add this
    const { setActiveTable, cartItems, orders, clearCart } = useCart();

    useEffect(() => {
        if (table && table.id) {
            setActiveTable(table.id);
        }
    }, [table, setActiveTable]);

    useEffect(() => {
        const loadMenuItems = async () => {
            try {
                // Try to get from cache first
                const cachedItems = getCachedMenuItems();
                if (cachedItems) {
                    console.log('📦 Loading menu items from cache');
                    setMenuItems(cachedItems);
                    return;
                }

                // If no cache, fetch from API
                console.log('🌐 Fetching menu items from API');
                const items = await fetchMenuItems();
                setMenuItems(items);
                
                // Cache the fetched data
                cacheMenuItems(items);
            } catch (error) {
                console.error('❌ Error loading menu items:', error);
            }
        };
        loadMenuItems();
    }, []);

    // Fetch barman stock for beverages
    useEffect(() => {
        const loadBarmanStock = async () => {
            setStockLoading(true);
            setStockError(null);
            try {
                // Try to get from cache first
                const cachedStock = getCachedBarmanStock();
                if (cachedStock) {
                    console.log('📦 Loading barman stock from cache');
                    setBarmanStock(cachedStock);
                    setStockLoading(false);
                    return;
                }

                // If no cache, fetch from API
                console.log('🌐 Fetching barman stock from API');
                const stock = await fetchBarmanStock();
                setBarmanStock(stock);
                
                // Cache the fetched data
                cacheBarmanStock(stock);
            } catch (error) {
                console.error('❌ Error loading barman stock:', error);
                setStockError('Failed to load stock information. Please try refreshing.');
            } finally {
                setStockLoading(false);
            }
        };
        loadBarmanStock();
    }, []);

    // Helper function to refresh stock
    const refreshStock = async () => {
        setStockLoading(true);
        setStockError(null);
        try {
            console.log('🔄 Refreshing barman stock from API');
            const stock = await fetchBarmanStock();
            setBarmanStock(stock);
            
            // Update cache with fresh data
            cacheBarmanStock(stock);
        } catch (error) {
            console.error('❌ Error refreshing barman stock:', error);
            setStockError('Failed to refresh stock information. Please try again.');
        } finally {
            setStockLoading(false);
        }
    };

    if (!menuItems || menuItems.length === 0) return <div>Loading menu...</div>;

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
                    {onBack && <MdArrowBack size={36} onClick={onBack} style={{ cursor: 'pointer' }} />}
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
                                    disabled={stockLoading}
                                    className="refresh-button"
                                    style={{
                                        background: stockLoading ? '#9ca3af' : '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '8px 16px',
                                        fontSize: '14px',
                                        cursor: stockLoading ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                    onMouseOver={e => {
                                        if (!stockLoading) {
                                            e.currentTarget.style.background = '#2563eb';
                                        }
                                    }}
                                    onMouseOut={e => {
                                        e.currentTarget.style.background = stockLoading ? '#9ca3af' : '#3b82f6';
                                    }}
                                >
                                    <span>{stockLoading ? '⏳' : '🔄'}</span>
                                    {stockLoading ? 'Refreshing...' : 'Refresh Stock'}
                                </button>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>
                                    Stock status updates automatically from bartender inventory
                                </div>
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
        </div>
    );
};

export default MenuPage;
