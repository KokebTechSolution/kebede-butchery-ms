import React, { useState, useEffect } from 'react';
import { MdArrowBack, MdTableRestaurant } from 'react-icons/md';
import MenuItem from '../../../components/MenuItem/MenuItem';
import { useCart } from '../../../context/CartContext';
import { fetchMenuItems } from '../../../api/menu'; // Updated import
import './MenuPage.css';

const MenuPage = ({ table, onBack, editingOrderId, onOrder }) => {
    const [menuItems, setMenuItems] = useState([]);
    const [activeTab, setActiveTab] = useState('food');
    const { setActiveTable, cartItems, orders, clearCart } = useCart();

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

    const foodItems = menuItems.filter(item => item.item_type === 'food' && item.is_available);
    const drinkItems = menuItems.filter(item => item.item_type === 'drink' && item.is_available);
    const foodByCategory = groupByCategory(foodItems);
    const drinkByCategory = groupByCategory(drinkItems);

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
                        Food
                    </button>
                    <button
                        className={`menu-tab ${activeTab === 'drink' ? 'active' : ''}`}
                        onClick={() => setActiveTab('drink')}
                        disabled={isReadyToPay}
                    >
                        Drinks
                    </button>
                </div>
                {activeTab === 'food' && (
                    <div className="menu-section">
                        {Object.keys(foodByCategory).map(category => (
                            <div key={category} className="menu-category-section">
                                <h3>{category}</h3>
                                <div className="menu-items-grid">
                                    {foodByCategory[category].map(item => (
                                        <MenuItem key={item.id} item={item} disabled={isReadyToPay} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {activeTab === 'drink' && (
                    <div className="menu-section">
                        {Object.keys(drinkByCategory).map(category => (
                            <div key={category} className="menu-category-section">
                                <h3>{category}</h3>
                                <div className="menu-items-grid">
                                    {drinkByCategory[category].map(item => (
                                        <MenuItem key={item.id} item={item} disabled={isReadyToPay} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div style={{ flex: 1, minWidth: 300 }}>
                <div style={{ background: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 2px 8px #0001', marginBottom: 24 }}>
                    <h3 style={{ marginBottom: 8 }}>🛒 Current Order</h3>
                    {cartItems.length === 0 ? (
                        <div>No items in current order.</div>
                    ) : (
                        <ul style={{ marginBottom: 12 }}>
                            {cartItems.map(item => (
                                <li key={item.name}>
                                    {item.name} × {item.quantity} — ${(item.price * item.quantity).toFixed(2)}
                                </li>
                            ))}
                        </ul>
                    )}
                    <div style={{ fontWeight: 'bold', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>
                        Running Total: ${cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                      </span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          style={{
                            background: '#4ade80',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 4,
                            padding: '8px 20px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'background 0.2s, color 0.2s',
                          }}
                          disabled={cartItems.length === 0}
                          onClick={onOrder}
                          onMouseOver={e => e.currentTarget.style.background = '#22c55e'}
                          onMouseOut={e => e.currentTarget.style.background = '#4ade80'}
                          onMouseDown={e => e.currentTarget.style.background = '#16a34a'}
                          onMouseUp={e => e.currentTarget.style.background = '#22c55e'}
                        >
                          Order
                        </button>
                        {cartItems.length > 0 && (
                          <button
                            style={{
                              background: '#ff4444',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 4,
                              padding: '8px 20px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              marginLeft: 8,
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
                <div style={{ background: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 2px 8px #0001' }}>
                    <h4 style={{ marginBottom: 8 }}>Previous Orders</h4>
                    {previousOrders.length === 0 ? (
                        <div>No previous orders.</div>
                    ) : (
                        previousOrders.map(order => (
                            <div key={order.id} style={{ borderBottom: '1px solid #eee', marginBottom: 8, paddingBottom: 8, background: editingOrderId === order.id ? '#e0f7fa' : 'transparent' }}>
                                <div>
                                    Order #{order.order_number} <span style={{ float: 'right' }}>${order.total_money}</span>
                                    {editingOrderId === order.id && <span style={{ color: '#007bff', marginLeft: 8 }}>(Editing)</span>}
                                </div>
                                <div style={{ fontSize: 13, color: '#656565' }}>
                                    {order.items.length} item{order.items.length > 1 ? 's' : ''}
                                    {(() => {
                                      if (order.food_status && order.food_status !== 'not_applicable') {
                                        return ` • ${order.food_status}`;
                                      } else if (order.drink_status && order.drink_status !== 'not_applicable') {
                                        return ` • ${order.drink_status}`;
                                      } else {
                                        return '';
                                      }
                                    })()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default MenuPage;
