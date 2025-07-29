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
    { label: t("request"), icon: <FaClipboardList />, path: "/branch-manager/request" },
    { label: t("menu_management"), icon: <FaUtensils />, path: "/branch-manager/menu" },
    // Add Closed Orders for meat dashboard
    { label: "Closed Orders", icon: <FaClipboardList />, path: "/meat/closed-orders" },
  ];

  return (
    <>
      <button
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        className="fixed top-4 left-4 z-50 p-2 bg-indigo-600 text-white rounded-md md:hidden focus:outline-none focus:ring-2 focus:ring-indigo-400"
      >
        {isOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
      </button>

      <aside
        className={`fixed top-0 left-0 h-screen bg-white border-r shadow-lg w-64 p-6 flex flex-col
        transform transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static
        ${isOpen ? "translate-x-0" : "-translate-x-full"} z-40`}
      >
        <h1 className="text-3xl font-bold text-indigo-600 mb-10 text-center select-none">
          🏢 {t("branch_panel")}
        </h1>

        <nav className="flex flex-col space-y-2 flex-grow overflow-auto">
          {navItems.map(({ label, icon, path }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium transition
                 ${
                   isActive
                     ? "bg-indigo-100 text-indigo-700 shadow"
                     : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                 }`
              }
              onClick={() => setIsOpen(false)}
            >
              <span className="text-lg">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => alert("Logging out...")}
          className="mt-8 flex items-center gap-3 px-4 py-3 text-red-600 font-semibold rounded-md hover:bg-red-50 transition-colors text-base"
        >
          <FaSignOutAlt className="text-lg" />
          {t("logout")}
        </button>
      </aside>

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
