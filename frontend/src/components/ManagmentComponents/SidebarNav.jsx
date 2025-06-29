import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FaTachometerAlt,
  FaUserFriends,
  FaBoxes,
  FaSignOutAlt,
  FaBars,
  FaTimes,
} from "react-icons/fa";
export default function SidebarNav() {
  const [isOpen, setIsOpen] = useState(false);

const navItems = [
  { label: "Dashboard", icon: <FaTachometerAlt />, path: "/branch-manager" },
  { label: "Staff Management", icon: <FaUserFriends />, path: "/branch-manager/staff" },
  { label: "Product", icon: <FaBoxes />, path: "/branch-manager/products" },
  { label: "Inventory", icon: <FaBoxes />, path: "/branch-manager/inventory" },
  { label: "Menu Management", icon: <FaBoxes />, path: "/branch-manager/menu" },
];

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      <button
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        className="fixed top-4 left-4 z-50 p-2 bg-indigo-600 text-white rounded-md md:hidden focus:outline-none focus:ring-2 focus:ring-indigo-400"
      >
        {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
      </button>

      <aside
        className={`
          fixed top-0 left-0 h-screen bg-white border-r shadow-lg
          w-64 p-6 flex flex-col min-h-0
          transform transition-transform duration-300 ease-in-out
          md:static md:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          z-40
        `}
      >
        <h2 className="text-3xl font-bold text-indigo-600 mb-10 text-center select-none">
          🏢 Branch Panel
        </h2>

        <div className="flex flex-col flex-grow min-h-0">
          <nav className="flex flex-col space-y-3 overflow-auto">
            {navItems.map(({ label, icon, path }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 rounded-md text-lg font-semibold
                   transition-colors
                   ${
                     isActive
                       ? "bg-indigo-100 text-indigo-700 shadow"
                       : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                   }`
                }
                onClick={() => setIsOpen(false)}
              >
                <span className="text-xl">{icon}</span>
                {label}
              </NavLink>
            ))}
          </nav>

          <button
            className="mt-auto flex items-center gap-3 px-4 py-3 text-red-600 font-semibold rounded-md hover:bg-red-50 transition-colors text-lg"
            onClick={() => {
              alert("Logging out...");
            }}
            aria-label="Logout"
          >
            <FaSignOutAlt className="text-xl" />
            Logout
          </button>
        </div>
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
