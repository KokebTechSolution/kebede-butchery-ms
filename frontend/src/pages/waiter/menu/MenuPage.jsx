import React, { useState, useEffect } from 'react';
import { MdArrowBack } from 'react-icons/md';
import { coldDrinkItems, hotDrinkItems } from './items/drink/drinkItems.jsx';
import { mainCourseItems, fishDishesItems, otherFoodItems } from './items/food/foodItems.jsx';
import MenuItem from '../../../components/MenuItem/MenuItem';
import { useCart } from '../../../context/CartContext';
import './MenuPage.css';

export const tabs = ['Main Course', 'Beverages', 'Snacks', 'Desserts'];

const menuData = [
  {
    category: 'Main Course',
    items: mainCourseItems.concat(fishDishesItems, otherFoodItems),
  },
  {
    category: 'Cold Drinks',
    items: coldDrinkItems,
  },
  {
    category: 'Hot Drinks',
    items: hotDrinkItems,
  },
];

const MenuPage = ({ table, onBack }) => {
  const [activeTab, setActiveTab] = useState('Main Course');
  const { setActiveTable } = useCart();

  useEffect(() => {
    if (table && table.id) {
      setActiveTable(table.id);
    }
  }, [table, setActiveTable]);

  const filteredMenuData = menuData.filter(section => {
    if (activeTab === 'Main Course') {
      return section.category === 'Main Course';
    } else if (activeTab === 'Beverages') {
      return section.category === 'Cold Drinks' || section.category === 'Hot Drinks';
    }
    // Add more conditions for other tabs if needed (Snacks, Desserts)
    return false;
  });

  return (
    <div className="menu-container">
      <div className="menu-header">
        <h1>Menu{table ? ` for Table ${table.id}` : ''}</h1>
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
      {filteredMenuData.map(section => (
        <div key={section.category} className="menu-section">
          <h2>{section.category}</h2>
          <div className="menu-items-grid">
            {section.items.map(item => (
              <MenuItem key={item.name} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MenuPage; 