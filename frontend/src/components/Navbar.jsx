import React, { useState } from 'react';
import { Utensils, ClipboardList, UserCircle } from 'lucide-react';

const navItems = [
  { key: 'tables', label: 'Tables', icon: <Utensils size={28} /> },
  { key: 'orderDetails', label: 'Orders', icon: <ClipboardList size={28} /> },
  { key: 'profile', label: 'Profile', icon: <UserCircle size={28} /> },
];

const Navbar = ({ onNavigate }) => {
  const [activeKey, setActiveKey] = useState('tables');

  const handleClick = (key) => {
    setActiveKey(key);
    onNavigate(key);
  };

  return (
    <div className="sidebar">
      {navItems.map((item) => (
        <div
          key={item.key}
          className={`sidebar-icon transition-colors duration-150 cursor-pointer
            ${activeKey === item.key ? 'bg-blue-200 text-blue-700' : 'hover:bg-blue-100 hover:text-blue-600 active:bg-blue-200 active:text-blue-700'}`}
          onClick={() => handleClick(item.key)}
        >
          {item.icon}
          <br />
          {item.label.toUpperCase()}
        </div>
      ))}
    </div>
  );
};

export default Navbar; 