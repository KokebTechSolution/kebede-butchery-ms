import React, { useState, useEffect } from 'react';
import { MdArrowBack } from 'react-icons/md';
import MenuItem from '../../../components/MenuItem/MenuItem';
import { useCart } from '../../../context/CartContext';
import { fetchMenuById } from '../../../api/menu'; // ✅ Import from your backend API
import './MenuPage.css';

const MenuPage = ({ table, onBack }) => {
    const [menu, setMenu] = useState(null);
    const [activeTab, setActiveTab] = useState('');
    const { setActiveTable } = useCart();

    useEffect(() => {
        if (table && table.id) {
            setActiveTable(table.id);
        }
    }, [table, setActiveTable]);

    useEffect(() => {
        const loadMenu = async () => {
            try {
                // ✅ Change 1 to the ID of your current menu, or pass as prop
                const menuData = await fetchMenuById(1);
                setMenu(menuData);

                if (menuData.sections.length > 0) {
                    setActiveTab(menuData.sections[0].name); // ✅ Auto-select first section
                }
            } catch (error) {
                console.error('❌ Error loading menu:', error);
            }
        };

        loadMenu();
    }, []);

    if (!menu) return <div>Loading menu...</div>;

    const tabs = menu.sections.map(section => section.name);

    const filteredSections = menu.sections.filter(section => section.name === activeTab);

    return (
        <div className="menu-container">
            <div className="menu-header">
                <h1>Menu {table ? `for Table ${table.id}` : ''}</h1>
                {onBack && <MdArrowBack size={36} onClick={onBack} className="back-button" />}
            </div>

            <div className="menu-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        className={`menu-tab ${tab === activeTab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {filteredSections.map(section => (
                <div key={section.id} className="menu-section">
                    <h2>{section.name}</h2>
                    <div className="menu-items-grid">
                        {section.items
                            .filter(item => item.is_available)
                            .map(item => (
                                <MenuItem key={item.id} item={item} />
                            ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MenuPage;
