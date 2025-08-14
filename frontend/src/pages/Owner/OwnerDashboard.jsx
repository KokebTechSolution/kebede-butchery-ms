import React, { useState } from 'react';
import ResponsiveLayout from '../../components/ResponsiveLayout';
import ResponsiveNavbar from '../../components/ResponsiveNavbar';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import StaffPerformance from './StaffPerformance';
import StaffListPage from '../Staff/StaffListPage';
import FoodReportsDashboard from './components/FoodReportsDashboard';
import { useAuth } from '../../context/AuthContext';

function OwnerDashboard() {
  const [screen, setScreen] = useState('analytics');
  const { user, logout } = useAuth();

  const navItems = [
    { key: 'analytics', label: 'Analytics', icon: '📊' },
    { key: 'foodreports', label: 'Food Reports', icon: '🍽️' },
    { key: 'staff', label: 'Staff Performance', icon: '👥' },
    { key: 'staffmgmt', label: 'Staff Management', icon: '⚙️' },
  ];

  const handleLogout = () => {
    logout();
  };

  const header = (
    <ResponsiveNavbar
      title="Owner Dashboard"
      user={user}
      onLogout={handleLogout}
    />
  );

  const sidebar = (
    <div className="p-3 sm:p-4">
      {/* Mobile-Optimized Navigation */}
      <div className="space-y-2 sm:space-y-3">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setScreen(item.key)}
            className={`w-full text-left px-3 sm:px-4 py-3 sm:py-3 rounded-xl transition-all duration-200 touch-manipulation min-h-[48px] ${
              screen === item.key
                ? 'bg-primary-600 text-white shadow-lg transform scale-105'
                : 'text-gray-700 hover:bg-gray-100 hover:shadow-md'
            }`}
          >
            <div className="flex items-center space-x-2 sm:space-x-3">
              <span className="text-base sm:text-lg flex-shrink-0">{item.icon}</span>
              <span className="font-medium text-sm sm:text-base truncate">{item.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (screen) {
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'foodreports':
        return <FoodReportsDashboard />;
      case 'staff':
        return <StaffPerformance />;
      case 'staffmgmt':
        return <StaffListPage />;
      default:
        return <AnalyticsDashboard />;
    }
  };

  return (
    <ResponsiveLayout
      header={header}
      sidebar={sidebar}
      showSidebar={true}
      showHeader={true}
    >
      <div className="dashboard-container">
        <div className="dashboard-content">
          {renderContent()}
        </div>
      </div>
    </ResponsiveLayout>
  );
}

export default OwnerDashboard;
