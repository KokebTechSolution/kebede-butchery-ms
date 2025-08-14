// Topbar.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import UserProfile from "./UserProfile";
import { Menu, X, Bell, Search } from "lucide-react";

const LANGUAGES = [
  { code: "en", label: "English", icon: "🇬🇧" },
  { code: "am", label: "አማርና", icon: "🇪🇹" },
  { code: "om", label: "Afaan Oromoo", icon: "🌍" },
];

const Topbar = () => {
  const { user } = useAuth();
  const { i18n, t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const first_name = user?.first_name || "Guest";
  const role = user?.role || "No Role";

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-gradient-to-r from-red-900 via-red-800 to-red-700 shadow-xl border-b-2 border-red-950 relative z-50">
      {/* Main Topbar */}
      <div className="h-16 md:h-20 px-3 md:px-6 flex items-center justify-between">
        {/* Left side - Logo and Brand */}
        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
          <a href="/" className="transition-transform hover:scale-105 shrink-0 group">
            <div className="relative">
              <img 
                src="/Kebedelogo.png" 
                alt="Kebede logo" 
                className="h-10 w-10 md:h-12 md:w-12 object-contain rounded-full shadow-lg group-hover:shadow-xl transition-all duration-300" 
              />
              <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </div>
          </a>
          <div className="leading-none truncate min-w-0">
            <h1 className="text-base md:text-xl lg:text-2xl font-extrabold text-white drop-shadow-lg truncate">
              Kebede Butchery
            </h1>
            <span className="text-xs md:text-sm text-gray-200 tracking-wide font-semibold truncate hidden sm:block">
              Management System
            </span>
          </div>
        </div>

        {/* Center - Search Bar (Desktop only) */}
        <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-white bg-opacity-90 backdrop-blur-sm border border-white border-opacity-30 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:bg-opacity-100 transition-all duration-200"
            />
          </div>
        </div>

        {/* Right side - Language, Notifications, User Profile */}
        <div className="flex items-center gap-2 md:gap-4 text-white">
          {/* Language Selector */}
          <div className="hidden sm:flex items-center gap-1 md:gap-2">
            <span className="hidden md:inline font-semibold text-sm">{t("choose_language") || "Language"}:</span>
            <select
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="rounded px-2 py-1 text-black bg-white bg-opacity-90 backdrop-blur-sm focus:outline-none border border-white border-opacity-30 shadow-sm text-sm hover:bg-opacity-100 transition-all duration-200"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.icon} {lang.label}</option>
              ))}
            </select>
          </div>

          {/* Notifications Icon */}
          <button className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-all duration-200 relative group">
            <Bell className="w-5 h-5 md:w-6 md:h-6" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
            <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="p-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800">Notifications</h3>
              </div>
              <div className="p-3">
                <p className="text-sm text-gray-600">No new notifications</p>
              </div>
            </div>
          </button>

          {/* User Profile */}
          {user && user.isAuthenticated && window.location.pathname !== '/login' && (
            <UserProfile first_name={first_name} role={role} />
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-all duration-200"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-red-800 border-t border-red-700 shadow-lg">
          <div className="px-4 py-4 space-y-4">
            {/* Mobile Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-3 bg-white bg-opacity-90 border border-white border-opacity-30 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              />
            </div>

            {/* Mobile Language Selector */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm">{t("choose_language") || "Language"}:</span>
              <select
                value={i18n.language}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                className="flex-1 rounded px-3 py-2 text-black bg-white bg-opacity-90 focus:outline-none border border-white border-opacity-30"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>{lang.icon} {lang.label}</option>
                ))}
              </select>
            </div>

            {/* Mobile Quick Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-2 px-4 rounded-lg transition-all duration-200 text-sm font-medium">
                Quick Actions
              </button>
              <button className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-2 px-4 rounded-lg transition-all duration-200 text-sm font-medium">
                Help & Support
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Topbar;
