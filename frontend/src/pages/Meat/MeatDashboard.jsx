


// src/pages/Meat/MeatDashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  FaDrumstickBite,
  FaClipboardList,
  FaBoxes,
  FaChartBar,
  FaUsers,
  FaBell,
  FaBars,
  FaTimes,
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaClock,
  FaUser,
  FaTable,
} from "react-icons/fa";
import { useNotifications } from "../../context/NotificationContext";
import NotificationToast from "../../components/NotificationToast";

import { Pending } from "./screens/Pending/Pending";
import { Inventory } from "./screens/Inventory/Inventory";
import { Reports } from "./screens/Reports/Reports";
import { useOrders } from "./hooks/useOrders";

export default function MeatDashboard() {
  const [activeSection, setActiveSection] = useState("Orders");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const sidebarRef = useRef(null);
  const mobileMenuButtonRef = useRef(null);
  const { notifications, removeNotification } = useNotifications();
  
  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarOpen && 
          sidebarRef.current && 
          !sidebarRef.current.contains(event.target) &&
          mobileMenuButtonRef.current &&
          !mobileMenuButtonRef.current.contains(event.target)) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [sidebarOpen]);

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
        .reduce((itemSum, item) => itemSum + Number(item.price || 0) * item.quantity, 0),
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
    { label: "Orders", icon: <FaClipboardList />, section: "Orders", color: "blue" },
    { label: "Inventory", icon: <FaBoxes />, section: "Inventory", color: "green" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50 flex flex-col lg:flex-row overflow-hidden">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between bg-white/95 backdrop-blur-sm p-4 shadow-lg sticky top-0 z-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            ref={mobileMenuButtonRef}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-orange-600 text-2xl focus:outline-none p-2 -m-2 active:bg-orange-50 rounded-full transition-colors"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
          <div className="flex items-center gap-2">
            <FaDrumstickBite className="text-2xl text-orange-600" />
            <h1 className="text-lg font-bold text-gray-800">Meat Dashboard</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 -m-2 text-gray-600 hover:text-orange-600 focus:outline-none relative">
            <FaBell className="text-xl" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          style={{
            opacity: sidebarOpen ? 1 : 0,
            pointerEvents: sidebarOpen ? 'auto' : 'none',
          }}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        ref={sidebarRef}
        className={`bg-white/95 backdrop-blur-sm w-72 p-6 shadow-2xl flex-shrink-0 transform transition-all duration-300 ease-in-out fixed inset-y-0 left-0 z-50 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          height: '100vh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
          scrollbarColor: '#f97316 #f3f4f6',
        }}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
              <FaDrumstickBite className="text-2xl text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Meat Operations</h2>
              <p className="text-sm text-gray-500">Kitchen Management</p>
            </div>
          </div>
          <button 
            className="lg:hidden text-gray-500 hover:text-gray-700 focus:outline-none p-2 -m-2 rounded-full hover:bg-gray-100"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <FaTimes />
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders, items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-3 mb-8">
          {navItems.map(({ label, icon, section, color }) => (
            <button
              key={section}
              onClick={() => {
                setActiveSection(section);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl font-medium transition-all duration-200 text-left group
                active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50
                ${activeSection === section
                  ? `bg-gradient-to-r from-${color}-500 to-${color}-600 text-white shadow-lg shadow-${color}-500/25`
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              style={{
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span className={`text-xl flex-shrink-0 transition-transform group-hover:scale-110 ${
                activeSection === section ? 'text-white' : `text-${color}-500`
              }`}>
                {icon}
              </span>
              <span className="truncate font-semibold">{label}</span>
              {activeSection === section && (
                <span className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></span>
              )}
            </button>
          ))}
        </nav>

        {/* Quick Stats */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Quick Stats</h3>
          
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <FaClipboardList className="text-white text-lg" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{activeOrdersCount}</p>
                <p className="text-sm text-blue-600">Pending Orders</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <FaChartBar className="text-white text-lg" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">${totalMoney.toFixed(2)}</p>
                <p className="text-sm text-green-600">Total Revenue</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Add padding for mobile header */}
      <div className="h-16 lg:h-0"></div>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 space-y-6 overflow-y-auto max-w-full">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-800 to-orange-600 bg-clip-text text-transparent">
                {activeSection === "Orders" ? "Order Management" : activeSection}
              </h1>
              <p className="text-gray-600 mt-2">
                {activeSection === "Orders" 
                  ? "Process and manage incoming food orders efficiently" 
                  : `Manage your ${activeSection.toLowerCase()} operations`
                }
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
              <button className="p-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">
                <FaFilter className="text-lg" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
          {renderContent()}
        </div>

        {/* Bottom Stats Grid */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {/* Pending Orders */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 shadow-lg border border-blue-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500 rounded-xl">
                <FaClipboardList className="text-white text-2xl" />
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-700">{activeOrdersCount}</p>
                <p className="text-blue-600 font-medium">Pending Orders</p>
                <p className="text-blue-500 text-sm">Awaiting processing</p>
              </div>
            </div>
          </div>

          {/* Closed Orders */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-500 rounded-xl">
                <FaClipboardList className="text-white text-2xl" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-700">{closedOrdersCount}</p>
                <p className="text-gray-600 font-medium">Closed Orders</p>
                <p className="text-gray-500 text-sm">Orders completed</p>
              </div>
            </div>
          </div>

          {/* Total Money */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 shadow-lg border border-green-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500 rounded-xl">
                <FaChartBar className="text-white text-2xl" />
              </div>
              <div>
                <p className="text-3xl font-bold text-green-700">
                  ${totalMoney.toFixed(2)}
                </p>
                <p className="text-green-600 font-medium">Total Revenue</p>
                <p className="text-green-500 text-sm">From closed orders</p>
              </div>
            </div>
          </div>

          {/* Staff Available */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 shadow-lg border border-purple-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500 rounded-xl">
                <FaUsers className="text-white text-2xl" />
              </div>
              <div>
                <p className="text-3xl font-bold text-purple-700">8</p>
                <p className="text-purple-600 font-medium">Staff Available</p>
                <p className="text-purple-500 text-sm">Processing staff</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pro Tip Banner */}
        <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 border border-orange-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-500 rounded-xl">
              <span className="text-2xl">💡</span>
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">Pro Tips for Efficiency</h4>
              <div className="grid gap-2 text-gray-700">
                <p className="flex items-center gap-2">
                  <FaClock className="text-orange-500" />
                  Process orders in priority sequence for faster service
                </p>
                <p className="flex items-center gap-2">
                  <FaBoxes className="text-orange-500" />
                  Check inventory levels before starting new orders
                </p>
                <p className="flex items-center gap-2">
                  <FaClipboardList className="text-orange-500" />
                  Update order status promptly to keep system current
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Notification Toast */}
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onRemove={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}
