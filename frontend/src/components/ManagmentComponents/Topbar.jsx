import React from "react";
import { FaDrumstickBite, FaCocktail } from "react-icons/fa";
import { useAuth } from '../../context/AuthContext';
import UserProfile from './UserProfile';
import { FiMenu } from 'react-icons/fi';

const Topbar = ({ onMenuClick }) => {
  const { user } = useAuth();

  const first_name = user?.first_name || "Guest User";
  const role = user?.role || "No Role";

  return (
    <header className="shadow-md flex items-center justify-between text-white select-none" style={{ backgroundColor: '#7B1123' }}>
      <div className="flex items-center">
        {/* Hamburger Menu Button */}
        {onMenuClick && (
          <button onClick={onMenuClick} className="text-white p-4 md:hidden">
            <FiMenu size={24} />
          </button>
        )}
        
        {/* Logo */}
        <img src="/kebedelogo.png" alt="Logo" className="h-20 w-auto" />
        
        <div className="ml-4">
          <h1 className="text-3xl font-extrabold tracking-wide font-serif text-black">
            Kebede Meat & Bar
          </h1>
          <span className="text-sm font-light tracking-wide uppercase text-white">
            Management System
          </span>
        </div>
      </div>

      {/* Right: User Profile */}
      <div className="p-4">
        <UserProfile first_name={first_name} role={role} />
      </div>
    </header>
  );
};

export default Topbar;
