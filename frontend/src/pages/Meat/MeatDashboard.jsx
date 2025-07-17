


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

export default function MeatDashboard() {
  const [activeSection, setActiveSection] = useState("Orders");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeSection) {
      case "Inventory":
        return <Inventory />;
      case "Reports":
        return <Reports />;
      case "Orders":
      default:
        return <Pending />;
    }
  };

  const navItems = [
    { label: "Orders", icon: <FaClipboardList />, section: "Orders" },
    { label: "Inventory", icon: <FaBoxes />, section: "Inventory" },
    { label: "Reports", icon: <FaChartBar />, section: "Reports" },
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
        {/* Main Content Area */}
        <div className="bg-white rounded-lg shadow">{renderContent()}</div>

        {/* Quick Stats (moved below main content) */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        </div>
      </main>
    </div>
  );
}
