import {
  DollarSignIcon,
  FileTextIcon,
  ListChecksIcon,
  UsersIcon,
  Menu,
  X,
  User,
  LogOut,
  Settings,
  Bell
} from "lucide-react";
import React from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../../components/ui/avatar";
import { Button } from "../../../../components/ui/button";

export const OrdersSection = ({ activeSection, onSectionChange }) => {
  // Navigation menu items data
  const menuItems = [
    {
      icon: <ListChecksIcon className="w-6 h-6" />,
      label: "Orders",
      key: "orders",
    },
    {
      icon: <UsersIcon className="w-6 h-6" />,
      label: "Waiters",
      key: "waiters",
    },
    {
      icon: <DollarSignIcon className="w-6 h-6" />,
      label: "shift checkout",
      key: "checkout",
    },
    {
      icon: <FileTextIcon className="w-6 h-6" />,
      label: "report",
      key: "report",
    },
  ];

  return (
    <div className="w-full h-full flex flex-col">
      {/* Mobile header (only visible on mobile) */}
      <div className="md:hidden p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
        <button 
          onClick={() => document.querySelector('#mobile-menu-close-button')?.click()}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 sm:p-4">
        {/* Navigation menu */}
        <nav className="space-y-1">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => onSectionChange(item.key)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors duration-200 text-left
                ${activeSection === item.key 
                  ? 'bg-orange-50 text-orange-700' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-orange-600'
                }`}
            >
              <span className={`p-1.5 rounded-lg ${
                activeSection === item.key ? 'bg-orange-100' : 'bg-gray-50'
              }`}>
                {React.cloneElement(item.icon, {
                  className: `w-5 h-5 ${activeSection === item.key ? 'text-orange-600' : 'text-gray-500'}`
                })}
              </span>
              <span className="font-medium text-sm sm:text-base">
                {item.label}
              </span>
              {activeSection === item.key && (
                <span className="ml-auto w-1 h-6 bg-orange-600 rounded-full"></span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Bottom section for user profile */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200">
          <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Cashier</p>
            <p className="text-xs text-gray-500 truncate">Active</p>
          </div>
          <button className="p-1.5 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};