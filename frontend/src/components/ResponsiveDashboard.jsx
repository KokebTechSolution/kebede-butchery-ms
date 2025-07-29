import React, { useState, useEffect } from 'react';
import ResponsiveLayout from './ResponsiveLayout';
import ResponsiveNavbar from './ResponsiveNavbar';
import MobileBottomNav from './MobileBottomNav';
import ResponsiveModal from './ResponsiveModal';
import { Menu, X, Bell, User, Settings, LogOut } from 'lucide-react';

const ResponsiveDashboard = ({
  title,
  user,
  onLogout,
  sidebarItems = [],
  children,
  showBottomNav = false,
  bottomNavItems = [],
  onBottomNavChange,
  notifications = [],
  onNotificationClick,
  className = "",
  showHeader = true,
  showSidebar = true,
  headerActions = null
}) => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSidebarItemClick = (key) => {
    setCurrentPage(key);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const handleBottomNavChange = (key) => {
    setCurrentPage(key);
    onBottomNavChange && onBottomNavChange(key);
  };

  const header = showHeader ? (
    <ResponsiveNavbar
      title={title}
      user={user}
      onLogout={onLogout}
      notifications={notifications}
      onNotificationClick={onNotificationClick}
      headerActions={headerActions}
    />
  ) : null;

  const sidebar = showSidebar ? (
    <div className="p-4">
      <div className="space-y-2">
        {sidebarItems.map((item) => (
          <button
            key={item.key}
            onClick={() => handleSidebarItemClick(item.key)}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              currentPage === item.key
                ? 'bg-primary-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center space-x-3">
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <ResponsiveLayout
        header={header}
        sidebar={sidebar}
        showSidebar={showSidebar}
        showHeader={showHeader}
      >
        <div className="dashboard-container">
          <div className="dashboard-content">
            {children}
          </div>
        </div>
      </ResponsiveLayout>

      {/* Mobile Bottom Navigation */}
      {showBottomNav && isMobile && (
        <MobileBottomNav
          currentPage={currentPage}
          onNavigate={handleBottomNavChange}
          items={bottomNavItems}
        />
      )}
    </div>
  );
};

// Dashboard Card Component
const DashboardCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  trendValue, 
  className = "",
  onClick 
}) => {
  return (
    <div 
      className={`dashboard-stat-card ${onClick ? 'cursor-pointer hover:shadow-mobile-lg transition-shadow' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-primary-100 rounded-lg">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-4 flex items-center">
          <span className={`text-sm font-medium ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend === 'up' ? '↗' : '↘'} {trendValue}
          </span>
          <span className="text-sm text-gray-500 ml-2">vs last period</span>
        </div>
      )}
    </div>
  );
};

// Dashboard Grid Component
const DashboardGrid = ({ 
  children, 
  cols = 1,
  className = "" 
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
  };

  return (
    <div className={`grid gap-4 ${gridCols[cols]} ${className}`}>
      {children}
    </div>
  );
};

// Dashboard Section Component
const DashboardSection = ({ 
  title, 
  subtitle,
  children, 
  className = "",
  actions = null 
}) => {
  return (
    <div className={`dashboard-card ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>
      {children}
    </div>
  );
};

// Export components
ResponsiveDashboard.Card = DashboardCard;
ResponsiveDashboard.Grid = DashboardGrid;
ResponsiveDashboard.Section = DashboardSection;

export default ResponsiveDashboard; 