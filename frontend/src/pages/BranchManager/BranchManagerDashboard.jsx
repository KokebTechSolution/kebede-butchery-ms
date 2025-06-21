// src/pages/BranchManager/BranchManagerDashboard.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
import SidebarNav from "../../components/ManagmentComponents/SidebarNav";

export default function BranchManagerDashboard() {
  const { user } = useAuth();
  const firstName = user?.first_name || "Guest";

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
          {/* Future: Profile, quick actions, or breadcrumbs can go here */}
        </header>

        {/* Dynamic Content via Routes */}
        <section className="space-y-6">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
