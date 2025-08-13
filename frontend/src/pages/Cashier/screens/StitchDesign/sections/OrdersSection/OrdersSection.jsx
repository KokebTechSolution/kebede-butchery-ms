import {
  DollarSignIcon,
  FileTextIcon,
  ListChecksIcon,
  UsersIcon,
  MenuIcon,
} from "lucide-react";
import React, { useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../../components/ui/avatar";
import { Button } from "../../../../components/ui/button";

export const OrdersSection = ({ activeSection, onSectionChange }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  const handleSectionChange = (sectionKey) => {
    onSectionChange(sectionKey);
    setIsDropdownOpen(false); // Close dropdown after selection
  };

  const getCurrentSectionLabel = () => {
    const currentItem = menuItems.find(item => item.key === activeSection);
    return currentItem ? currentItem.label : "Orders";
  };

  const getCurrentSectionIcon = () => {
    const currentItem = menuItems.find(item => item.key === activeSection);
    return currentItem ? currentItem.icon : <ListChecksIcon className="w-6 h-6" />;
  };

  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className="hidden md:block w-80 flex flex-col h-full">
        <div className="flex flex-col min-h-[700px] p-4 bg-white w-full h-full flex-1 justify-between">
          <div className="space-y-4">
            {/* Navigation menu */}
            <nav className="flex flex-col gap-2">
              {menuItems.map((item, index) => (
                <Button
                  key={index}
                  variant={activeSection === item.key ? "secondary" : "ghost"}
                  className={`justify-start gap-3 w-full py-2 px-3 h-auto ${
                    activeSection === item.key ? "bg-[#f4efef] hover:bg-[#ebe5e5]" : ""
                  }`}
                  onClick={() => onSectionChange(item.key)}
                >
                  {item.icon}
                  <span className="font-['Work_Sans',Helvetica] font-medium text-sm text-[#161111] leading-[21px]">
                    {item.label}
                  </span>
                </Button>
              ))}
            </nav>
          </div>
        </div>
      </aside>

      {/* Mobile Navigation - Visible only on mobile */}
      <div className="md:hidden w-full">
        <div className="bg-white p-4 shadow-sm border-b">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <DollarSignIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Cashier Dashboard</h1>
          </div>
          
          {/* Mobile Dropdown Navigation */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between gap-3 px-4 py-4 bg-gray-50 border border-gray-200 rounded-lg text-left hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl text-gray-600">{getCurrentSectionIcon()}</span>
                <span className="font-semibold text-gray-700 text-lg">{getCurrentSectionLabel()}</span>
              </div>
              <MenuIcon className="text-gray-600 w-5 h-5" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                {menuItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSectionChange(item.key)}
                    className={`w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-50 transition-colors ${
                      activeSection === item.key
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                        : 'text-gray-700'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};