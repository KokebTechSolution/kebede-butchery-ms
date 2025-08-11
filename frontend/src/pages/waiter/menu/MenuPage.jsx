import React, { useState, useEffect } from 'react';
import { MdArrowBack, MdTableRestaurant } from 'react-icons/md';
import MenuItem from '../../../components/MenuItem/MenuItem';
import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';
import { fetchMenuItems } from '../../../api/menu';
import { formatCartTotal } from '../../../utils/priceUtils';
import './MenuPage.css';

const MenuPage = ({ table, onBack, editingOrderId, onOrder }) => {
    const [menuItems, setMenuItems] = useState([]);
    const [activeTab, setActiveTab] = useState('food');
    const [isOrdering, setIsOrdering] = useState(false);
    const { setActiveTable, cartItems, orders, clearCart } = useCart();
    const { user } = useAuth();

    useEffect(() => {
        if (table && table.id) {
            setActiveTable(table.id);
        }
    }, [table, setActiveTable]);

    useEffect(() => {
        const loadMenuItems = async () => {
            try {
                const items = await fetchMenuItems();
                setMenuItems(items);
            } catch (error) {
                console.error('❌ Error loading menu items:', error);
            }
        };
        loadMenuItems();
    }, []);

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

    // Filter items based on user role
    const userRole = user?.role;
    let foodItems = [];
    let beverageItems = [];
    
    if (userRole === 'bartender') {
        // Bartenders can only see beverage items
        beverageItems = menuItems.filter(item => item.item_type === 'beverage' && item.is_available);
        // Set active tab to beverage for bartenders
        if (activeTab === 'food') setActiveTab('beverage');
    } else if (userRole === 'meat') {
        // Meat staff can only see food items
        foodItems = menuItems.filter(item => item.item_type === 'food' && item.is_available);
        // Set active tab to food for meat staff
        if (activeTab === 'beverage') setActiveTab('food');
    } else {
        // Other roles (waiter, manager, etc.) can see both
        foodItems = menuItems.filter(item => item.item_type === 'food' && item.is_available);
        beverageItems = menuItems.filter(item => item.item_type === 'beverage' && item.is_available);
    }
    
    const foodByCategory = groupByCategory(foodItems);
    const beverageByCategory = groupByCategory(beverageItems);

    // Filter previous orders for this table
    const previousOrders = orders.filter(order => order.table_number === table?.id);

    // Find the latest order for this table
    const latestOrder = previousOrders.length > 0 ? [...previousOrders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] : null;
    const isPaid = latestOrder && latestOrder.has_payment;

    return (
        <div className="menu-page-container">
            {/* Header Section */}
            <div className="menu-header-section">
                <div className="menu-header-content">
                    <button 
                        onClick={onBack}
                        className="back-button-mobile"
                        aria-label="Back to tables"
                    >
                        <MdArrowBack size={24} />
                        <span className="back-text">Back to Tables</span>
                    </button>
                    
                    {table && (
                        <div className="table-info-card">
                            <div className="table-icon">
                                <MdTableRestaurant size={28} />
                            </div>
                            <div className="table-details">
                                <h2 className="table-title">Table {table.number}</h2>
                                <p className="table-subtitle">Select items from the menu below</p>
                            </div>
                            {cartItems.length > 0 && (
                                <div className="cart-indicator">
                                    <span className="cart-count">{cartItems.length}</span>
                                    <span className="cart-text">items</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Tab Navigation - Only show relevant tabs based on user role */}
            {(userRole !== 'bartender' && userRole !== 'meat') && (
                <div className="menu-tabs-container">
                    <div className="menu-tabs">
                        <button
                            className={`menu-tab ${activeTab === 'food' ? 'active' : ''}`}
                            onClick={() => setActiveTab('food')}
                        >
                            <span className="tab-icon">🍽️</span>
                            <span className="tab-text">Food</span>
                        </button>
                        <button
                            className={`menu-tab ${activeTab === 'beverage' ? 'active' : ''}`}
                            onClick={() => setActiveTab('beverage')}
                        >
                            <span className="tab-icon">🥤</span>
                            <span className="tab-text">Beverages</span>
                        </button>
                    </div>
                </div>
            )}
            
            {/* Role-specific header for single-item-type users */}
            {(userRole === 'bartender' || userRole === 'meat') && (
                <div className="role-specific-header">
                    <div className="role-header-content">
                        <div className="role-icon">
                            {userRole === 'bartender' ? '🥤' : '🍽️'}
                        </div>
                        <div className="role-title">
                            {userRole === 'bartender' ? 'Beverage Menu' : 'Food Menu'}
                        </div>
                        <div className="role-subtitle">
                            {userRole === 'bartender' 
                                ? 'Manage beverage orders and inventory' 
                                : 'Manage food orders and preparation'
                            }
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Grid - Menu and Cart Side by Side */}
            <div className="menu-cart-grid">
                {/* Menu Section */}
                <div className="menu-section-main">
                    {/* Menu Content - Display based on user role */}
                    <div className="menu-content">
                        {/* For bartenders and meat staff, show content based on their role */}
                        {userRole === 'bartender' && (
                            <div className="menu-section">
                                {Object.keys(beverageByCategory).map(category => (
                                    <div key={category} className="menu-category-section">
                                        <h3 className="category-title">{category}</h3>
                                        <div className="menu-items-grid">
                                            {beverageByCategory[category].map(item => (
                                                <MenuItem key={item.id} item={item} disabled={isPaid} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {userRole === 'meat' && (
                            <div className="menu-section">
                                {Object.keys(foodByCategory).map(category => (
                                    <div key={category} className="menu-category-section">
                                        <h3 className="category-title">{category}</h3>
                                        <div className="menu-items-grid">
                                            {foodByCategory[category].map(item => (
                                                <MenuItem key={item.id} item={item} disabled={isPaid} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {/* For other roles (waiter, manager, etc.), show tabs-based content */}
                        {userRole !== 'bartender' && userRole !== 'meat' && (
                            <>
                                {activeTab === 'food' && (
                                    <div className="menu-section">
                                        {Object.keys(foodByCategory).map(category => (
                                            <div key={category} className="menu-category-section">
                                                <h3 className="category-title">{category}</h3>
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
                                        {Object.keys(beverageByCategory).map(category => (
                                            <div key={category} className="menu-category-section">
                                                <h3 className="category-title">{category}</h3>
                                                <div className="menu-items-grid">
                                                    {beverageByCategory[category].map(item => (
                                                        <MenuItem key={item.id} item={item} disabled={isPaid} />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Cart Section - Always Visible on Right Side */}
                <div className="cart-section-main">
                    <div className="cart-container-visible">
                        <div className="cart-header">
                            <h3 className="cart-title">🛒 Current Order</h3>
                            {editingOrderId && (
                                <span className="editing-badge">Editing Order #{editingOrderId}</span>
                            )}
                        </div>
                        
                        {/* Cart Items */}
                        <div className="cart-items-list">
                            {cartItems.length === 0 ? (
                                <div className="empty-cart">
                                    <div className="empty-cart-icon">📋</div>
                                    <p className="empty-cart-title">Your cart is empty</p>
                                    <p className="empty-cart-subtitle">Add items from the menu to get started</p>
                                </div>
                            ) : (
                                cartItems.map((item, index) => (
                                    <div key={index} className="cart-item-visible">
                                        <div className="cart-item-info">
                                            <span className="cart-item-name">{item.name}</span>
                                            <span className="cart-item-price">ETB {item.price}</span>
                                        </div>
                                        <div className="cart-item-quantity">
                                            <span className="quantity-display">×{item.quantity}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        {/* Cart Summary */}
                        {cartItems.length > 0 && (
                            <div className="cart-summary-visible">
                                <div className="cart-summary-row">
                                    <span className="summary-label">Total Items:</span>
                                    <span className="summary-value">{cartItems.reduce((total, item) => total + item.quantity, 0)}</span>
                                </div>
                                <div className="cart-summary-row">
                                    <span className="summary-label">Total Amount:</span>
                                    <span className="summary-value total-amount">{formatCartTotal(cartItems)}</span>
                                </div>
                            </div>
                        )}
                        
                        {/* Cart Actions */}
                        {cartItems.length > 0 && (
                            <div className="cart-actions-visible">
                                <button 
                                    onClick={() => clearCart()}
                                    className="cart-btn clear-cart-btn"
                                >
                                    🗑️ Clear Cart
                                </button>
                                <button 
                                    onClick={onOrder}
                                    className="cart-btn place-order-btn"
                                    disabled={cartItems.length === 0}
                                >
                                    ✅ {editingOrderId ? 'Update Order' : 'Place Order'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Order Summary - Only visible on small screens */}
            <div className="mobile-order-summary">
                <div className="mobile-order-header">
                    <h3>🛒 Current Order</h3>
                    <span className="mobile-total">
                        {formatCartTotal(cartItems)}
                    </span>
                </div>
                {cartItems.length === 0 ? (
                    <p className="mobile-empty-cart">No items in current order</p>
                ) : (
                    <div className="mobile-cart-items">
                        {cartItems.slice(0, 3).map((item, index) => (
                            <div key={index} className="mobile-cart-item">
                                <span className="mobile-item-name">{item.name}</span>
                                <span className="mobile-item-quantity">×{item.quantity}</span>
                            </div>
                        ))}
                        {cartItems.length > 3 && (
                            <div className="mobile-more-items">
                                +{cartItems.length - 3} more items
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MenuPage;
