import React, { useState, useEffect } from 'react';
import { MdArrowBack } from 'react-icons/md';
import MenuItem from '../../../components/MenuItem/MenuItem';
import { useCart } from '../../../context/CartContext';
import { fetchMenuItems } from '../../../api/menu'; // Updated import
import './MenuPage.css';

const MenuPage = ({ table, onBack }) => {
    const [menuItems, setMenuItems] = useState([]);
    const [activeTab, setActiveTab] = useState('food');
    const { setActiveTable } = useCart();

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

    // Group items by type
    const foodItems = menuItems.filter(item => item.item_type === 'food' && item.is_available);
    const drinkItems = menuItems.filter(item => item.item_type === 'drink' && item.is_available);

    return (
        <div className="menu-container">
            <div className="menu-header">
                <h1>Menu {table ? `for Table ${table.id}` : ''}</h1>
                {onBack && <MdArrowBack size={36} onClick={onBack} className="back-button" />}
            </div>

            <div className="menu-tabs">
                <button
                    className={`menu-tab ${activeTab === 'food' ? 'active' : ''}`}
                    onClick={() => setActiveTab('food')}
                >
                    Food
                </button>
                <button
                    className={`menu-tab ${activeTab === 'drink' ? 'active' : ''}`}
                    onClick={() => setActiveTab('drink')}
                >
                    Drinks
                </button>
            </div>

            {activeTab === 'food' && (
                <div className="menu-section">
                    <h2>Food</h2>
                    <div className="menu-items-grid">
                        {foodItems.map(item => (
                            <MenuItem key={item.id} item={item} />
                        ))}
                    </div>
                </div>
            )}
            {activeTab === 'drink' && (
                <div className="menu-section">
                    <h2>Drinks</h2>
                    <div className="menu-items-grid">
                        {drinkItems.map(item => (
                            <MenuItem key={item.id} item={item} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuPage;
