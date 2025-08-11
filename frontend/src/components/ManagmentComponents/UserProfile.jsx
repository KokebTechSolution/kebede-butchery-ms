import React, { useState, useRef, useEffect } from "react";
import { UserCircle2, Settings, LogOut, ChevronDown, User, Shield, Clock } from "lucide-react";
import EditProfileModal from "./EditProfileModal";
import { useAuth } from "../../context/AuthContext";

const UserProfile = ({ first_name, role }) => {
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const dropdownRef = useRef();

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-1 md:py-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-200 group"
      >
        {/* User Avatar */}
        <div className="relative">
          <UserCircle2 className="w-7 h-7 md:w-8 md:h-8 text-white group-hover:scale-110 transition-transform duration-200" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
        </div>

        {/* Name and Role - Hidden on very small screens */}
        <div className="hidden sm:flex flex-col items-start text-left min-w-0">
          <span className="text-white font-bold leading-none text-sm truncate max-w-24 md:max-w-32">
            {first_name}
          </span>
          <span className="text-gray-200 text-xs italic truncate max-w-24 md:max-w-32">
            ({role})
          </span>
        </div>

        {/* Chevron Icon */}
        <ChevronDown 
          className={`w-4 h-4 text-white transition-transform duration-200 ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`} 
        />
      </button>

      {/* Enhanced Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 md:w-72 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          {/* User Info Header */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 px-4 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-800 truncate">{first_name}</h3>
                <p className="text-sm text-gray-600 truncate">{role}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={() => {
                setModalOpen(true);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 group"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-150">
                <Settings className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <span className="font-medium text-gray-800">Edit Password</span>
                <p className="text-xs text-gray-500">Change your account password</p>
              </div>
            </button>

            <button
              onClick={() => {
                // Add profile settings functionality
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 group"
            >
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors duration-150">
                <Shield className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <span className="font-medium text-gray-800">Account Settings</span>
                <p className="text-xs text-gray-500">Manage your account preferences</p>
              </div>
            </button>

            <button
              onClick={() => {
                // Add activity log functionality
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 group"
            >
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors duration-150">
                <Clock className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <span className="font-medium text-gray-800">Activity Log</span>
                <p className="text-xs text-gray-500">View your recent activities</p>
              </div>
            </button>

            {/* Divider */}
            <div className="border-t border-gray-100 my-2"></div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 transition-colors duration-150 group"
            >
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors duration-150">
                <LogOut className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <span className="font-medium text-red-600">Logout</span>
                <p className="text-xs text-red-500">Sign out of your account</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {modalOpen && <EditProfileModal onClose={() => setModalOpen(false)} />}
    </div>
  );
};

export default UserProfile;
