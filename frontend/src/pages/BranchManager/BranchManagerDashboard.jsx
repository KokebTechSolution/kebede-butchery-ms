import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
import SidebarNav from "../../components/ManagmentComponents/SidebarNav";
import StaffListPage from '../Staff/StaffListPage';
import { useTranslation } from "react-i18next";

export default function BranchManagerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const firstName = user?.first_name || "Guest";
  const [tab, setTab] = useState('dashboard');

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-100">
      {/* Mobile-Optimized Sidebar */}
      <SidebarNav />
      
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
    </div>
  );
}
