// src/pages/Bartender/BartenderDashboard.jsx
import React, { useState, useEffect } from "react";
import { FaBeer, FaClipboardList, FaBoxes, FaChartBar, FaUsers, FaBell, FaLock } from "react-icons/fa";
import { useNotifications } from "../../context/NotificationContext";
import ClosedOrders from "./screens/Pending/ClosedOrders";
 import { useBeverages } from  "./hooks/useBeverages";
// import { useDashboardStats } from "./hooks/useDashboardStats";

import Pending from "./screens/Pending/Pending";
import Inventory from "./Inventory/InventoryRequests";
import Reports from "./screens/Reports";

export default function BartenderDashboard() {
  const [activeSection, setActiveSection] = useState('Orders');
  const [filterDate, setFilterDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const userName = "Bartender"; 
  const { lastMessage } = useNotifications();
  const { orders } = useBeverages(filterDate);
//  const { pendingOrders, inventoryItems, lowStock, staffCount } = useDashboardStats();
  useEffect(() => {
    if (lastMessage) {
      alert(lastMessage.message);
    }
  }, [lastMessage]);

  // Helper to get closed orders: all items accepted or rejected (no pending/preparing) AND payment processed
  const getClosedOrders = () =>
    orders.filter(order =>
      order.has_payment &&
      order.items.length > 0 &&
      order.items.every(item => item.status === 'accepted' || item.status === 'rejected')
    );

  const renderContent = () => {
    switch (activeSection) {
      case 'Inventory':
        return <Inventory />;
      case 'Reports':
        return <Reports />;
      case 'Closed':
        return <ClosedOrders orders={getClosedOrders()} filterDate={filterDate} setFilterDate={setFilterDate} />;
      case 'Orders':
      default:
        return <Pending orders={orders} filterDate={filterDate} setFilterDate={setFilterDate} />;
    }
  };

  const navItems = [
    { label: 'Orders', icon: <FaClipboardList />, section: 'Orders' },
    { label: 'Closed', icon: <FaLock />, section: 'Closed' },
    { label: 'Inventory', icon: <FaBoxes />, section: 'Inventory' },
    { label: 'Reports', icon: <FaChartBar />, section: 'Reports' },
  ];

  return (
    <div className="bg-gray-100">
      {/* Main Content */}
      <main className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-blue-100 text-blue-800 p-4 md:p-6 rounded shadow-sm">
          <h1 className="text-3xl font-bold">Welcome, {userName} 🍻</h1>
          <p className="text-md mt-1">
            Manage beverage orders, bar inventory, and sales reports efficiently.
          </p>
        </div>

        {/* Bar Operations Navigation */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3 mb-4">
            <FaBeer className="text-2xl text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-700">Bar Operations</h2>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {navItems.map(({ label, icon, section }) => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                  activeSection === section
                    ? 'bg-blue-100 text-blue-700 shadow'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <span className="text-lg">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>


        {/* Main Content Area */}
        <div className="bg-white rounded-lg shadow">
          {renderContent()}
        </div>

        {/* Tip Banner */}
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg text-blue-700 text-sm">
          💡 <strong>Tip:</strong> Prepare beverages in the order they were received. Keep your bar station clean and organized.
        </div>
      </main>
    </div>
  );
}
