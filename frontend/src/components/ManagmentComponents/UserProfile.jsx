// src/components/ManagmentComponents/UserProfile.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaChevronDown } from "react-icons/fa";

const UserProfile = ({ first_name, role }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => setOpen(!open);

  const handleLogout = () => {
    setOpen(false);
    navigate("/logout"); // redirect to logout page
  };

  const handleEditProfile = () => {
    setOpen(false);
    navigate("/profile/edit"); // Replace with your actual route
  };

  return (
    <div
      className="relative flex items-center gap-3 cursor-pointer select-none"
      tabIndex={0}
      aria-label="User menu"
      ref={dropdownRef}
      onClick={handleToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleToggle();
        } else if (e.key === "Escape") {
          setOpen(false);
        }
      }}
    >
      <FaUserCircle className="text-white text-5xl" />
      <div className="hidden sm:flex flex-col">
        <p className="text-white font-semibold text-lg">{first_name}</p>
        <p className="text-white text-xs uppercase tracking-widest">{role}</p>
      </div>
      <FaChevronDown className="text-white ml-1 hidden sm:block" />

      {/* Dropdown menu */}
      {open && (
        <div className="absolute right-0 mt-12 w-44 bg-red-800 rounded shadow-lg z-50 ring-1 ring-black ring-opacity-5 focus:outline-none">
          <button
            onClick={handleEditProfile}
            className="block w-full text-left px-4 py-2 text-white hover:bg-red-900 transition-colors"
          >
            Edit Profile
          </button>
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-white hover:bg-red-900 transition-colors"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
