// src/pages/Bartender/BartenderDashboard.jsx
import React, { useState } from "react";
import { FaClipboardList, FaBox, FaChartBar } from "react-icons/fa";
import { DrinkInventory } from "./screens/DrinkInventory";
import { DrinkOrders } from "./screens/DrinkOrders";
import { DrinkReports } from "./screens/DrinkReports";
import { useAuth } from "../../context/AuthContext";

export default function BartenderDashboard() {
  const [activeSection, setActiveSection] = useState('Orders');
  const { user } = useAuth();
  const userName = user?.first_name || user?.username || "Bartender";

  const renderContent = () => {
    switch (activeSection) {
      case 'Inventory':
        return <DrinkInventory />;
      case 'Reports':
        return <DrinkReports />;
      case 'Orders':
      default:
        return <DrinkOrders />;
    }
  };

  const navItems = [
    { label: 'Orders', icon: <FaClipboardList />, section: 'Orders' },
    { label: 'Inventory', icon: <FaBox />, section: 'Inventory' },
    { label: 'Reports', icon: <FaChartBar />, section: 'Reports' },
  ];

  return (
    <div className="bg-gray-100 p-4">
      <div className="bg-white p-4 rounded-lg shadow-md mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Welcome, {userName} 🍹</h1>
        <p className="text-gray-600">
          Manage drink orders, inventory, and sales reports from the bar.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex flex-wrap gap-3">
            {navItems.map(({ label, icon, section }) => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                  activeSection === section
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="text-lg">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

      <div className="bg-white rounded-lg shadow p-4">
        {renderContent()}
      </div>
    </div>
  );
}
