


// src/pages/Meat/MeatDashboard.jsx
import React, { useState } from "react";
import {
  FaDrumstickBite,
  FaClipboardList,
  FaBoxes,
  FaChartBar,
  FaUsers,
  FaBell,
  FaBars,
} from "react-icons/fa";

import { Pending } from "./screens/Pending/Pending";
import { Inventory } from "./screens/Inventory/Inventory";
import { Reports } from "./screens/Reports/Reports";
import { useEffect } from "react";
import { useOrders } from "./hooks/useOrders";

export default function MeatDashboard() {
  const [activeSection, setActiveSection] = useState("Orders");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Get today's date in yyyy-mm-dd format
  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const [filterDate, setFilterDate] = useState(getTodayDateString());
  const { getActiveOrders, getClosedOrders } = useOrders(filterDate);
  const activeOrdersCount = getActiveOrders().length;
  const closedOrders = getClosedOrders();
  const closedOrdersCount = closedOrders.length;
  // Calculate total money by summing accepted items in closed orders
  const totalMoney = closedOrders.reduce(
    (sum, order) =>
      sum + order.items
        .filter(item => item.status === 'accepted')
        .reduce((itemSum, item) => itemSum + item.price * item.quantity, 0),
    0
  );

  const renderContent = () => {
    switch (activeSection) {
      case "Inventory":
        return <Inventory />;
      case "Orders":
      default:
        return <Pending filterDate={filterDate} setFilterDate={setFilterDate} />;
    }
  };

  const navItems = [
    { label: "Orders", icon: <FaClipboardList />, section: "Orders" },
    { label: "Inventory", icon: <FaBoxes />, section: "Inventory" },
  ];

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center gap-4 bg-white p-4 shadow">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-orange-600 text-2xl focus:outline-none"
          aria-label="Open sidebar"
        >
          <FaBars />
        </button>
        <h1 className="text-lg font-semibold text-gray-700">Operations</h1>
      </header>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`bg-white w-64 p-4 shadow-lg flex-shrink-0 transform transition-transform duration-200 ease-in-out fixed inset-y-0 left-0 z-40 md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center gap-3 mb-6">
          <FaDrumstickBite className="text-2xl text-orange-600" />
          <h2 className="text-lg font-semibold text-gray-700">Operations</h2>
        </div>

        <nav className="space-y-2">
          {navItems.map(({ label, icon, section }) => (
            <button
              key={section}
              onClick={() => {
                setActiveSection(section);
                setSidebarOpen(false); // Close sidebar after selection on mobile
              }}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-md font-medium transition-colors text-left ${
                activeSection === section
                  ? "bg-orange-100 text-orange-700 shadow"
                  : "text-gray-700 hover:bg-orange-50 hover:text-orange-600"
              }`}
            >
              <span className="text-lg">{icon}</span>
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 overflow-y-auto">
        {/* Quick Stats (moved to top) */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {/* Pending Orders */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3 mb-2">
              <FaClipboardList className="text-2xl text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-700">
                Pending Orders
              </h3>
            </div>
            <p className="text-3xl font-bold text-blue-600">{activeOrdersCount}</p>
            <p className="text-sm text-gray-500">Awaiting processing</p>
          </div>

          {/* Closed Orders */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3 mb-2">
              <FaClipboardList className="text-2xl text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-700">
                Closed Orders
              </h3>
            </div>
            <p className="text-3xl font-bold text-gray-600">{closedOrdersCount}</p>
            <p className="text-sm text-gray-500">Orders completed</p>
          </div>

          {/* Total Money (replaces Low Stock) */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3 mb-2">
              <FaChartBar className="text-2xl text-green-600" />
              <h3 className="text-lg font-semibold text-gray-700">Total Money</h3>
            </div>
            <p className="text-3xl font-bold text-green-600">${totalMoney.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            <p className="text-sm text-gray-500">Total from closed orders</p>
          </div>

          {/* Staff Available */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3 mb-2">
              <FaUsers className="text-2xl text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-700">
                Staff Available
              </h3>
            </div>
            <p className="text-3xl font-bold text-purple-600">8</p>
            <p className="text-sm text-gray-500">Processing staff</p>
          </div>
        </div>
        {/* Debug message if no closed orders */}
        {closedOrdersCount === 0 && (
          <div className="text-center text-orange-600 font-semibold mt-4">
            No closed orders for the selected date.
          </div>
        )}

        {/* Main Content Area (Orders section) */}
        <div className="bg-white rounded-lg shadow">{renderContent()}</div>

        {/* Tip Banner */}
        <div className="bg-orange-50 border border-orange-200 p-6 rounded-lg text-orange-700 text-sm">
          💡 <strong>Tip:</strong> Process orders in priority sequence. Check
          inventory levels before starting new orders. Update order status
          promptly to keep the system current.
        </div>
      </main>
    </div>
  );
}
