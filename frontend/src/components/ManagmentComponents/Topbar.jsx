import React from "react";
import { useAuth } from "../../context/AuthContext";
import UserProfile from "./UserProfile";

const Topbar = () => {
  const { user } = useAuth();

  const first_name = user?.first_name || "Guest User";
  const role = user?.role || "No Role";

  return (
    <header className="bg-gradient-to-r from-red-800 via-red-800 to-red-700 h-16 px-4 shadow-md flex items-center justify-between">
      {/* Left: logo + brand */}
      <div className="flex items-center gap-2">
        <img
          src="/Kebedelogo.png"
          alt="Kebede logo"
          className="h-12 w-12 object-contain"
        />
        <div className="leading-none">
          <h1 className="text-xl md:text-2xl font-extrabold text-black">Kebede Butchery</h1>
          <span className="text-sm md:text-base text-white tracking-wide">Management System</span>
        </div>
      </div>

      {/* Right: user name, role & profile */}
      <div className="flex items-center gap-2 text-white">
        <div className="flex flex-col items-end leading-tight text-sm">
          <span className="font-semibold">{first_name}</span>
          <span className="opacity-80">{role}</span>
        </div>
        {/* Ensure the avatar/icon inherits white color */}
        <UserProfile className="text-white" />
      </div>
    </header>
  );
};

export default Topbar;
