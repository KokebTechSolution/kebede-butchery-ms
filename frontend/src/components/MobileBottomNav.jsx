import React from 'react';
import { Home, Users, BarChart3, Settings, ShoppingCart, ClipboardList } from 'lucide-react';

const MobileBottomNav = ({ 
  currentPage, 
  onNavigate, 
  items = [],
  className = "" 
}) => {
  const defaultItems = [
    { key: 'dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { key: 'orders', label: 'Orders', icon: <ClipboardList size={20} /> },
    { key: 'inventory', label: 'Inventory', icon: <ShoppingCart size={20} /> },
    { key: 'reports', label: 'Reports', icon: <BarChart3 size={20} /> },
    { key: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  const navItems = items.length > 0 ? items : defaultItems;

  return (
    <nav className={`mobile-nav ${className}`}>
      <div className="flex justify-around">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={`mobile-nav-item ${
              currentPage === item.key ? 'active' : ''
            }`}
          >
            {item.icon}
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default MobileBottomNav; 