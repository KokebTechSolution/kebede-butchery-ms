import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FaTachometerAlt,
  FaUserFriends,
  FaBoxOpen,
  FaClipboardList,
  FaUtensils,
  FaSignOutAlt,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";

export default function SidebarNav() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const toggleSidebar = () => setIsOpen(!isOpen);

  const navItems = [
    { label: t("dashboard"), icon: <FaTachometerAlt />, path: "/branch-manager" },
    { label: t("staff_management"), icon: <FaUserFriends />, path: "/branch-manager/staff" },
    { label: t("inventory"), icon: <FaClipboardList />, path: "/branch-manager/inventory" },
    { label: t("request"), icon: <FaBoxOpen />, path: "/branch-manager/request" },
    { label: t("menu_management"), icon: <FaUtensils />, path: "/branch-manager/menu" },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        className="fixed top-4 left-4 z-50 p-2 bg-indigo-600 text-white rounded-md md:hidden focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-lg"
      >
        {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-200 shadow-lg w-64 p-4 md:p-6 flex flex-col
        transform transition-transform duration-300 ease-in-out z-40
        md:translate-x-0 md:static md:z-auto
        ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Logo/Title */}
        <div className="flex items-center justify-center mb-8 pt-4">
          <h1 className="text-2xl md:text-3xl font-bold text-indigo-600 text-center select-none">
            🏢 {t("branch_panel")}
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col space-y-2 flex-grow overflow-y-auto">
          {navItems.map(({ label, icon, path }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-md text-sm md:text-base font-medium transition-colors duration-200
                 ${
                   isActive
                     ? "bg-indigo-100 text-indigo-700 shadow-sm"
                     : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                 }`
              }
              onClick={() => setIsOpen(false)}
            >
              <span className="text-lg flex-shrink-0">{icon}</span>
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          <button
            onClick={() => alert("Logging out...")}
            className="w-full flex items-center gap-3 px-3 py-3 text-red-600 font-semibold rounded-md hover:bg-red-50 transition-colors text-sm md:text-base"
          >
            <FaSignOutAlt className="text-lg flex-shrink-0" />
            <span className="truncate">{t("logout")}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
          aria-hidden="true"
        />
      )}
    </>
  );
}
