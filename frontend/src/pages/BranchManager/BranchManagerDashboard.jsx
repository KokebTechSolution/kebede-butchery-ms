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
      <SidebarNav />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
        <header className="bg-white rounded-xl shadow-mobile px-4 sm:px-6 py-4 sm:py-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                {t('welcome', { name: firstName })}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {t('dashboard_intro')}
              </p>
            </div>
          </div>
        </header>
        <section className="space-y-6">
          {tab === 'dashboard' ? <Outlet /> : <StaffListPage />}
        </section>
      </main>
    </div>
  );
}
