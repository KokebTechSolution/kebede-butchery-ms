


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
    <div className="bg-gray-100 min-h-screen flex flex-col md:flex-row overflow-x-hidden">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between bg-white p-4 shadow sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button
            ref={mobileMenuButtonRef}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-orange-600 text-2xl focus:outline-none p-2 -m-2 active:bg-orange-50 rounded-full"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
          <h1 className="text-lg font-semibold text-gray-700">Operations</h1>
        </div>
        <div className="flex items-center">
          <button className="p-2 -m-2 text-gray-600 hover:text-orange-600 focus:outline-none">
            <FaBell className="text-xl" />
          </button>
        </div>
      </header>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity duration-200"
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
        className={`bg-white w-64 p-4 shadow-lg flex-shrink-0 transform transition-all duration-300 ease-in-out fixed inset-y-0 left-0 z-40 md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0 shadow-xl" : "-translate-x-full md:translate-x-0"
        }`}
        style={{
          height: '100vh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
          scrollbarColor: '#f97316 #f3f4f6',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FaDrumstickBite className="text-2xl text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-700">Operations</h2>
          </div>
          <button 
            className="md:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <FaTimes />
          </button>
        </div>

        <nav className="space-y-2">
          {navItems.map(({ label, icon, section }) => (
            <button
              key={section}
              onClick={() => {
                setActiveSection(section);
                setSidebarOpen(false); // Close sidebar after selection on mobile
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 text-left 
                active:scale-95 active:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50
                ${activeSection === section
                  ? "bg-orange-100 text-orange-700 shadow-inner"
                  : "text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                }`}
              style={{
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span className="text-xl flex-shrink-0">{icon}</span>
              <span className="truncate">{label}</span>
              {activeSection === section && (
                <span className="ml-auto w-1.5 h-6 bg-orange-600 rounded-full"></span>
              )}
            </button>
          ))}
        </nav>
      </aside>
      
      {/* Add padding for mobile header */}
      <div className="h-16 md:h-0"></div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 overflow-y-auto pt-6 md:pt-8 max-w-full">
                 {/* Main Content Area (Orders section) now comes first */}
         <div className="bg-white rounded-lg shadow overflow-x-hidden max-w-6xl">{renderContent()}</div>

        {/* Quick Stats moved below orders */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {/* Pending Orders */}
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3 mb-2">
              <FaClipboardList className="text-2xl text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-700">
                Pending Orders
              </h3>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-2 sm:mt-3">{activeOrdersCount}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Awaiting processing</p>
          </div>

          {/* Closed Orders */}
          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="p-1.5 sm:p-2 bg-gray-50 rounded-lg">
                <FaClipboardList className="text-lg sm:text-xl text-gray-600" />
              </div>
              <h3 className="text-sm sm:text-base font-medium text-gray-700 truncate">
                Closed Orders
              </h3>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-700 mt-2 sm:mt-3">{closedOrdersCount}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Orders completed</p>
          </div>

          {/* Total Money */}
          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="p-1.5 sm:p-2 bg-green-50 rounded-lg">
                <FaChartBar className="text-lg sm:text-xl text-green-600" />
              </div>
              <h3 className="text-sm sm:text-base font-medium text-gray-700 truncate">
                Total Money
              </h3>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-2 sm:mt-3">
              ${totalMoney.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">From closed orders</p>
          </div>

          {/* Staff Available */}
          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="p-1.5 sm:p-2 bg-purple-50 rounded-lg">
                <FaUsers className="text-lg sm:text-xl text-purple-600" />
              </div>
              <h3 className="text-sm sm:text-base font-medium text-gray-700 truncate">
                Staff Available
              </h3>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-purple-600 mt-2 sm:mt-3">8</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Processing staff</p>
          </div>
        </div>

        {/* Debug message if no closed orders */}
        {closedOrdersCount === 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  No closed orders found for the selected date. Try adjusting your filters or check back later.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tip Banner */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 p-4 sm:p-5 rounded-xl text-sm sm:text-base">
          <div className="flex items-start">
            <span className="flex-shrink-0 text-orange-500 text-lg mr-3">💡</span>
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Pro Tip</h4>
              <p className="text-gray-700 leading-relaxed">
                Process orders in priority sequence. Check inventory levels before starting new orders. 
                Update order status promptly to keep the system current and accurate.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
