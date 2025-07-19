import React, { useState, useEffect } from 'react';
import { MdArrowBack } from 'react-icons/md';
import MenuItem from '../../../components/MenuItem/MenuItem';
import Cart from '../../../components/Cart/Cart';
import { useCart } from '../../../context/CartContext';
import { fetchMenuItems } from '../../../api/menu'; // Updated import
import './MenuPage.css';

// Import original hardcoded menu items as fallback
import { mainCourseItems, fishDishesItems, otherFoodItems } from './items/food/foodItems';
import { coldbeverageItems, hotbeverageItems } from './items/drink/drinkItems';

const MenuPage = ({ table, onBack, editingOrderId, onOrder }) => {
    const [menuItems, setMenuItems] = useState([]);
    const [activeTab, setActiveTab] = useState('food');
    const [loading, setLoading] = useState(true);
    const { setActiveTable, orders, clearCart } = useCart();

    useEffect(() => {
        if (table && table.id) {
            setActiveTable(table.id);
        }
    }, [table, setActiveTable]);

    useEffect(() => {
        const loadMenuItems = async () => {
            try {
                setLoading(true);
                const items = await fetchMenuItems();
                setMenuItems(items);
            } catch (error) {
                console.error('❌ Error loading menu items from API, using fallback items:', error);
                // Use original hardcoded items as fallback
                const fallbackItems = [
                    ...mainCourseItems,
                    ...fishDishesItems,
                    ...otherFoodItems,
                    ...coldbeverageItems,
                    ...hotbeverageItems
                ];
                setMenuItems(fallbackItems);
            } finally {
                setLoading(false);
            }
        };
        loadMenuItems();
    }, []);

    if (loading) return <div>Loading menu...</div>;
    if (!menuItems || menuItems.length === 0) return <div>No menu items available.</div>;

    // Filter items by main type (food vs beverage)
    const foodItems = menuItems.filter(item => item.item_type === 'food' && item.is_available !== false);
    const beverageItems = menuItems.filter(item => item.item_type === 'beverage' && item.is_available !== false);

    // Filter previous orders for this table
    const previousOrders = orders.filter(order => order.table_number === table?.id);

    // Find the latest order for this table
    const latestOrder = previousOrders.length > 0 ? [...previousOrders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] : null;
    const isReadyToPay = latestOrder && latestOrder.cashier_status === 'ready_for_payment';

    return (
        <div className="menu-container" style={{ display: 'flex', gap: '2rem' }}>
            <div style={{ flex: 2, filter: isReadyToPay ? 'blur(2px)' : 'none', pointerEvents: isReadyToPay ? 'none' : 'auto', opacity: isReadyToPay ? 0.6 : 1 }}>
                <div className="menu-header">
                    <h2>{table ? ` Table ${table.id}` : ''}</h2>
                    {onBack && <MdArrowBack size={36} onClick={onBack} style={{ cursor: 'pointer' }} />}
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700 }} className="menu-tabs">
                    <button
                        className={`menu-tab ${activeTab === 'food' ? 'active' : ''}`}
                        onClick={() => setActiveTab('food')}
                        disabled={isReadyToPay}
                    >
                        FOOD
                    </button>
                    <button
                        className={`menu-tab ${activeTab === 'beverage' ? 'active' : ''}`}
                        onClick={() => setActiveTab('beverage')}
                        disabled={isReadyToPay}
                    >
                        DRINK
                    </button>
                </div>
                {activeTab === 'food' && (
                    <div className="menu-section">
                        <div className="menu-category-section">
                            <h3>FOOD</h3>
                            <div className="menu-items-grid">
                                {foodItems.map(item => (
                                    <MenuItem key={item.id || item.name} item={item} disabled={isReadyToPay} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'beverage' && (
                    <div className="menu-section">
                        <div className="menu-category-section">
                            <h3>DRINK</h3>
                            <div className="menu-items-grid">
                                {beverageItems.map(item => (
                                    <MenuItem key={item.id || item.name} item={item} disabled={isReadyToPay} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div style={{ flex: 1 }}>
                <div className="cart-container">
                    <Cart onOrder={onOrder} onClearCart={clearCart} />
                </div>
            </div>
        </div>
    );
};

export default MenuPage;
