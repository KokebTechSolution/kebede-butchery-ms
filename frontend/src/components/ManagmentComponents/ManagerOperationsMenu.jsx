import React, { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import SidebarNav from "./SidebarNav";

const ManagerOperationsMenu = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <>
      {/* Operations Menu Button - Only for managers */}
      <div className="bg-white shadow-sm border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSidebar}
            className="text-purple-600 hover:text-purple-700 transition-colors p-2 rounded-md hover:bg-purple-50"
          >
            {isSidebarOpen ? <FaTimes className="text-lg" /> : <FaBars className="text-lg" />}
          </button>
          <span className="text-sm font-medium text-gray-700">Operations</span>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <SidebarNav isOpen={isSidebarOpen} onToggle={toggleSidebar} />
    </>
  );
};

export default ManagerOperationsMenu;
