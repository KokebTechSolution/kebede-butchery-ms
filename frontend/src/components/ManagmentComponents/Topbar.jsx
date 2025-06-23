import React from "react";
import { FaDrumstickBite, FaCocktail } from "react-icons/fa";
import { useAuth } from '../../context/AuthContext';
import UserProfile from './UserProfile';

const Topbar = () => {
  const { user } = useAuth();

  const first_name = user?.first_name || "Guest User";
  const role = user?.role || "No Role";

  return (
    <header className="p-4 shadow-md flex justify-between items-center text-white select-none" style={{ backgroundColor: '#7B1123', height: '80px' }}>
      {/* Left: Logo and Title */}
      <div className="flex items-center">
        {/* Logo fills the top bar height, no gap */}
        <img src="/kebedelogo.png" alt="Logo" style={{ height: '80px', width: 'auto', margin: 0, padding: 0, display: 'block' }} />
        <div className="ml-3">
          <h1 className="text-3xl font-extrabold tracking-wide font-serif text-black">
            Kebede Meat & Bar
          </h1>
          <span className="text-sm font-light tracking-wide uppercase text-white">
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
