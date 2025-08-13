import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
import SidebarNav from "../../components/ManagmentComponents/SidebarNav";
import ManagerOperationsMenu from "../../components/ManagmentComponents/ManagerOperationsMenu";
import StaffListPage from '../Staff/StaffListPage';
import { useTranslation } from "react-i18next";

export default function BranchManagerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const firstName = user?.first_name || "Guest";
  const [tab, setTab] = useState('dashboard');

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-100">
      <SidebarNav />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        {/* Manager Operations Menu */}
        <ManagerOperationsMenu />
        
        <header className="bg-white rounded-xl shadow-md px-6 py-5 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {t('welcome', { name: firstName })} 44b
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {t('dashboard_intro')}
            </p>
          </div>
        </header>
        <section className="space-y-6">
          {tab === 'dashboard' ? <Outlet /> : <StaffListPage />}
        </section>
      </main>
      {/* Remove per-page footer. Footer is now global. */}
    </div>
  );
}
