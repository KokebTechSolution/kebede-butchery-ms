import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
import SidebarNav from "../../components/ManagmentComponents/SidebarNav";
import StaffListPage from '../Staff/StaffListPage';
import { useTranslation } from "react-i18next";
import { 
  FaTachometerAlt, 
  FaUserFriends, 
  FaClipboardList, 
  FaUtensils, 
  FaSignOutAlt,
  FaHome,
  FaUsers,
  FaBoxes,
  FaClipboardCheck
} from "react-icons/fa";

export default function BranchManagerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const firstName = user?.first_name || "Guest";
  const [tab, setTab] = useState('dashboard');
  const [activeNav, setActiveNav] = useState('dashboard');

  // Navigation items for mobile bottom tabs
  const navItems = [
    { 
      key: 'dashboard', 
      label: t('dashboard'), 
      icon: <FaTachometerAlt className="w-5 h-5" />,
      path: '/branch-manager'
    },
    { 
      key: 'staff', 
      label: t('staff_management'), 
      icon: <FaUserFriends className="w-5 h-5" />,
      path: '/branch-manager/staff'
    },
    { 
      key: 'inventory', 
      label: t('inventory'), 
      icon: <FaBoxes className="w-5 h-5" />,
      path: '/branch-manager/inventory'
    },
    { 
      key: 'menu', 
      label: t('menu_management'), 
      icon: <FaUtensils className="w-5 h-5" />,
      path: '/branch-manager/menu'
    },
    { 
      key: 'requests', 
      label: 'requests', 
      icon: <FaClipboardCheck className="w-5 h-5" />,
      path: '/branch-manager/request'
    },
  ];

  // Handle navigation for mobile tabs
  const handleNavigate = (navKey) => {
    setActiveNav(navKey);
    const navItem = navItems.find(item => item.key === navKey);
    if (navItem) {
      navigate(navItem.path);
    }
  };

  // Determine current active nav based on location
  React.useEffect(() => {
    const currentPath = location.pathname;
    const currentNav = navItems.find(item => item.path === currentPath);
    if (currentNav) {
      setActiveNav(currentNav.key);
    }
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-100">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:block">
        <SidebarNav />
      </div>
      
      {/* Mobile-First Main Content */}
      <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-x-hidden">
        {/* Mobile-Optimized Header */}
        <header className="bg-white rounded-xl shadow-lg px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 truncate">
                {t('welcome', { name: firstName })}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">
                {t('dashboard_intro')}
              </p>
            </div>
          </div>
        </header>
        
        {/* Mobile-Optimized Content Section */}
        <section className="space-y-4 sm:space-y-6">
          {tab === 'dashboard' ? <Outlet /> : <StaffListPage />}
        </section>
      </main>

      {/* Mobile Bottom Navigation - Only visible on mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => handleNavigate(item.key)}
              className={`flex flex-col items-center justify-center w-full py-3 text-xs transition-colors ${
                activeNav === item.key 
                  ? 'text-indigo-600 bg-indigo-50' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="text-xl mb-1">
                {React.cloneElement(item.icon, {
                  className: `w-6 h-6 ${activeNav === item.key ? 'text-indigo-600' : 'text-gray-500'}`
                })}
              </div>
              <span className={`font-medium ${activeNav === item.key ? 'text-indigo-600' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Add bottom padding to account for mobile nav */}
      <div className="h-20 md:hidden"></div>
    </div>
  );
}
