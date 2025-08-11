import React, { useState, useRef, useEffect } from "react";
import { UserCircle2 } from "lucide-react";
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-2 py-1 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors h-10"
      >
        {/* User Icon */}
        <UserCircle2 className="w-6 h-6 text-white shrink-0" />

        {/* Name and Role */}
        <div className="flex flex-col items-start text-left min-w-0">
          <span className="text-white font-bold leading-none text-xs truncate">{first_name}</span>
          <span className="text-gray-200 text-[10px] italic truncate">({role})</span>
        </div>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-50">
          <button
            onClick={() => {
              setModalOpen(true);
              setIsOpen(false);
            }}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-800"
          >
            Edit Password
          </button>
          <button
            onClick={() => logout()}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-800"
          >
            Logout
          </button>
        </div>
      )}

      {/* Edit Profile Modal */}
      {modalOpen && <EditProfileModal onClose={() => setModalOpen(false)} />}
    </div>
  );
};

export default UserProfile;
