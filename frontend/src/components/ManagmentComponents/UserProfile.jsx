// src/components/ManagmentComponents/UserProfile.jsx
import React, { useState, useRef, useEffect } from "react";
import { FaUserCircle, FaChevronDown } from "react-icons/fa";

const UserProfile = ({ username, role }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

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
    // Implement your logout logic
    alert("Logged out! Implement your logout logic.");
  };

  const handleEditProfile = () => {
    setOpen(false);
    // Navigate or open edit profile modal/page
    alert("Edit profile clicked! Implement navigation or modal.");
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
      <FaUserCircle className="text-yellow-400 text-5xl" />
      <div className="hidden sm:flex flex-col">
        <p className="text-yellow-300 font-semibold text-lg">{username}</p>
        <p className="text-yellow-200 text-xs uppercase tracking-widest">{role}</p>
      </div>
      <FaChevronDown className="text-yellow-300 ml-1 hidden sm:block" />

      {/* Dropdown menu */}
      {open && (
        <div className="absolute right-0 mt-12 w-44 bg-red-800 rounded shadow-lg z-50 ring-1 ring-black ring-opacity-5 focus:outline-none">
          <button
            onClick={handleEditProfile}
            className="block w-full text-left px-4 py-2 text-yellow-300 hover:bg-red-900 transition-colors"
          >
            Edit Profile
          </button>
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-yellow-300 hover:bg-red-900 transition-colors"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
