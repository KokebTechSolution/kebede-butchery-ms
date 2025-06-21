import React from 'react';
import { BellIcon, HomeIcon, SearchIcon } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../../../../components/ui/avatar';
import { Input } from '../../../../components/ui/input';

export const OrdersSection = ({ activeSection = 'Orders', onSectionChange }) => {
  const navItems = [
    { label: 'Orders', active: activeSection === 'Orders' },
    { label: 'Inventory', active: activeSection === 'Inventory' },
    { label: 'Reports', active: activeSection === 'Reports' },
  ];

  const handleNavClick = (section) => {
    if (onSectionChange) {
      onSectionChange(section);
    }
  };

  return (
    <header className="flex items-center justify-between px-10 py-3 border-b border-[#e5e8ea] w-full">
      {/* Logo and Brand Name */}
      <div className="flex items-center gap-4">
        <div className="relative w-4 h-4">
          <HomeIcon className="w-4 h-4" />
        </div>
        <h1 className="font-bold text-lg text-[#111416] font-['Work_Sans',Helvetica] leading-[23px]">
          Meat-Cashier
        </h1>
      </div>

      {/* Navigation and User Controls */}
      <div className="flex items-center justify-end gap-8 flex-1">
        {/* Navigation Links */}
        <nav className="flex items-center gap-9 h-10">
          {navItems.map((item, index) => (
            <button
              key={index}
              onClick={() => handleNavClick(item.label)}
              className={`font-medium text-sm leading-[21px] font-['Work_Sans',Helvetica] transition-colors hover:text-[#111416] ${
                item.active ? 'text-[#111416]' : 'text-[#6b7582]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Search Bar */}
        <div className="relative max-w-[480px]">
          <Input
            className="h-10 bg-[#f2f2f4] rounded-[20px] pl-8"
            placeholder="Search orders..."
          />
          <SearchIcon className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
        </div>

        {/* Notification Icon */}
        <BellIcon className="w-5 h-5 text-[#6b7582] hover:text-[#111416] cursor-pointer transition-colors" />

        {/* User Avatar */}
        <Avatar className="w-10 h-10 rounded-[20px]">
          <AvatarImage src="/depth-4--frame-2.png" alt="User profile" />
          <AvatarFallback>MC</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
};