import React, { useState } from 'react';
import { Menu, X, Bell, User, Settings, LogOut } from 'lucide-react';

const ResponsiveNavbar = ({ 
  title, 
  user, 
  onLogout, 
  notifications = [],
  onNotificationClick,
  className = ""
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className={`bg-white shadow-sm border-b border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Title and Mobile Menu Button */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            </div>
          </div>

          {/* Center - Desktop Navigation (hidden on mobile) */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {/* Add any center navigation items here */}
            </div>
          </div>

          {/* Right side - User menu and notifications */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
                onClick={() => onNotificationClick && onNotificationClick()}
              >
                <Bell size={20} className="text-gray-600" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
            </div>

            {/* Desktop User Menu */}
            <div className="hidden md:block">
              <div className="ml-3 relative">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <User size={16} className="text-gray-600" />
                    </div>
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-900 font-medium">
                      {user?.first_name || user?.username || 'User'}
                    </p>
                    <p className="text-gray-500">{user?.role || 'Role'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            {/* Mobile User Info */}
            <div className="px-3 py-2 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                  <User size={20} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user?.first_name || user?.username || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">{user?.role || 'Role'}</p>
                </div>
              </div>
            </div>

            {/* Mobile Menu Items */}
            <div className="space-y-1">
              <button
                className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => {
                  // Add settings functionality
                  closeMenu();
                }}
              >
                <div className="flex items-center space-x-2">
                  <Settings size={16} />
                  <span>Settings</span>
                </div>
              </button>
              
              <button
                className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                onClick={() => {
                  onLogout && onLogout();
                  closeMenu();
                }}
              >
                <div className="flex items-center space-x-2">
                  <LogOut size={16} />
                  <span>Logout</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default ResponsiveNavbar; 