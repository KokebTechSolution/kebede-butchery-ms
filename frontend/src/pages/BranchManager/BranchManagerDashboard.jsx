// src/pages/BranchManager/BranchManagerDashboard.jsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
import SidebarNav from "../../components/ManagmentComponents/SidebarNav";
import StaffListPage from '../Staff/StaffListPage';

export default function BranchManagerDashboard() {
  const { user } = useAuth();
  const firstName = user?.first_name || "Guest";
  const [tab, setTab] = useState('dashboard');

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-100">
      {/* Sidebar */}
      <SidebarNav />

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        {/* Header Section */}
        <header className="bg-white rounded-xl shadow-md px-6 py-5 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Welcome, {firstName} 👋</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your branch with insights, actions, and real-time updates.
            </p>
          </div>
        </header>
        <div className="flex gap-4 mb-6">
          <button
            className={`px-4 py-2 rounded ${tab === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`px-4 py-2 rounded ${tab === 'staff' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setTab('staff')}
          >
            Staff Management
          </button>
        </div>
        <section className="space-y-6">
          {tab === 'dashboard' ? <Outlet /> : <StaffListPage />}
        </section>
      </main>
    </div>
  );
}
