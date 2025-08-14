import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaTachometerAlt,
  FaUserFriends,
  FaClipboardList,
  FaUtensils,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaAngleDoubleRight,
  FaAngleDoubleLeft,
} from "react-icons/fa";

export default function SidebarNav({ isOpen, onToggle }) {
  const { t } = useTranslation();
  //const [isOpen, setIsOpen] = useState(true); // default open on desktop

  const toggleSidebar = () => setIsOpen(!isOpen);

  const navItems = [
    { label: t("dashboard"), icon: <FaTachometerAlt />, path: "/branch-manager" },
    { label: t("staff_management"), icon: <FaUserFriends />, path: "/branch-manager/staff" },
    { label: t("inventory"), icon: <FaClipboardList />, path: "/branch-manager/inventory" },
    { label: t("request"), icon: <FaClipboardList />, path: "/branch-manager/request" },
    { label: t("menu_management"), icon: <FaUtensils />, path: "/branch-manager/menu" },
 
  ];

  return (
    <>
      {/* Desktop Sidebar Toggle (hidden on mobile) */}
      <button
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        className="hidden lg:flex items-center justify-center fixed top-20 left-0 z-50 w-8 h-16 bg-indigo-600 text-white rounded-r-lg shadow-lg cursor-pointer hover:bg-indigo-700 transition-colors"
      >
        {isOpen ? <FaAngleDoubleLeft size={20} /> : <FaAngleDoubleRight size={20} />}
      </button>

      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <aside
        className={`hidden lg:block fixed top-0 left-0 h-screen bg-white border-r border-gray-200 shadow-lg p-4 sm:p-6 flex flex-col
          transform transition-transform duration-300 ease-in-out z-40
          ${isOpen ? "w-64 translate-x-0" : "w-16 -translate-x-0"}`}
      >
        {/* Logo/Brand */}
        <div className={`mb-8 flex flex-col items-center ${isOpen ? "" : "hidden lg:flex"}`}>
          <h1 className="text-2xl sm:text-3xl font-bold text-indigo-600 select-none">Kebede</h1>
          <p className="text-xs text-gray-500 mt-1 text-center">Management System</p>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-100 text-indigo-700 border-r-2 border-indigo-600"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`
              }
              title={!isOpen ? item.label : undefined} // tooltip when collapsed
            >
              <span className="text-lg">{item.icon}</span>
              {isOpen && <span className="flex-1">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Logout Button */}
        <div className={`mt-auto pt-4 border-t border-gray-200 flex items-center justify-center lg:justify-start gap-3
          ${isOpen ? "px-3" : "flex-col py-3"}`}
        >
          <button
            onClick={() => {
              // Handle logout
              console.log("Logout clicked");
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <FaSignOutAlt className="text-lg" />
            {isOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
