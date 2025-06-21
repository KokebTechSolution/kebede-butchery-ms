import React from "react";
import { FaDrumstickBite, FaCocktail } from "react-icons/fa";
import { useAuth } from '../../context/AuthContext';
import UserProfile from './UserProfile';

const Topbar = () => {
  const { user } = useAuth();

  // Extract user details with fallbacks
  const first_name = user?.first_name || user?.username || "Guest User";
  // Roles are in the 'groups' array, get the first one
  const role = user?.groups?.[0] || "No Role";

  return (
    <header className="bg-gradient-to-r from-red-800 via-red-800 to-red-700 p-4 shadow-md flex justify-between items-center text-white select-none">
      {/* Left: Logo and Title */}
      <div className="flex items-center gap-3">
        <FaDrumstickBite className="text-yellow-400 text-4xl" aria-hidden="true" />
        <FaCocktail className="text-yellow-400 text-3xl -ml-2" aria-hidden="true" />
        <div>
          <h1 className="text-3xl font-extrabold tracking-wide font-serif">
            Kebede Meat & Bar
          </h1>
          <span className="text-sm font-light tracking-wide uppercase text-yellow-300">
            Management System
          </span>
        </div>
      </div>

      {/* Right: User Profile */}
      <UserProfile first_name={first_name} role={role} />
    </header>
  );
};

export default Topbar;
