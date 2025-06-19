import React from "react";
import { FaCashRegister, FaBoxes, FaUsers, FaClipboardList } from "react-icons/fa";

import SalesSummary from "../../components/ManagmentComponents/Dashboard/SalesSummary";
import StockLevels from "../../components/ManagmentComponents/Dashboard/StockLevels";
import EmployeeActivity from "../../components/ManagmentComponents/Dashboard/EmployeeActivity";
import StaffRequests from "../../components/ManagmentComponents/Dashboard/StaffRequests";
import SidebarNav from "../../components/ManagmentComponents/SidebarNav";

export default function BranchManagerDashboard() {
  const userName = "Ali"; // Replace this with dynamic user name from auth if available

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <SidebarNav />

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-blue-100 text-blue-800 p-4 md:p-6 rounded shadow-sm">
          <h1 className="text-3xl font-bold">Welcome, {userName} 👋</h1>
          <p className="text-md mt-1">
            Here’s a quick overview of your branch today. Use the summaries and actions
            below to manage efficiently.
          </p>
        </div>

        {/* KPIs Grid */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {/* Sales Overview */}
          <div className="col-span-1 bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3 mb-2">
              <FaCashRegister className="text-2xl text-green-600" />
              <h2 className="text-lg font-semibold text-gray-700">Sales Overview</h2>
            </div>
            <p className="text-sm text-gray-500 mb-2">
              A summary of revenue and order activity.
            </p>
            <SalesSummary />
          </div>

          {/* Stock Levels */}
          <div className="col-span-1 bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3 mb-2">
              <FaBoxes className="text-2xl text-red-600" />
              <h2 className="text-lg font-semibold text-gray-700">Stock Alerts</h2>
            </div>
            <p className="text-sm text-gray-500 mb-2">
              Check for low inventory before it runs out.
            </p>
            <StockLevels />
          </div>

          {/* Employee Activity */}
          <div className="col-span-1 bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3 mb-2">
              <FaUsers className="text-2xl text-yellow-600" />
              <h2 className="text-lg font-semibold text-gray-700">Staff Activity</h2>
            </div>
            <p className="text-sm text-gray-500 mb-2">
              Know how your team is performing today.
            </p>
            <EmployeeActivity />
          </div>

          {/* Staff Requests */}
          <div className="col-span-1 lg:col-span-3 bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3 mb-2">
              <FaClipboardList className="text-2xl text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-700">Pending Requests</h2>
            </div>
            <p className="text-sm text-gray-500 mb-2">
              Review and respond to staff supply requests.
            </p>
            <StaffRequests />
          </div>
        </div>

        {/* Tip Banner */}
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg text-yellow-700 text-sm">
          💡 <strong>Tip:</strong> Click the green <em>Approve</em> or red <em>Reject</em> buttons
          to manage requests quickly. If unsure, ask your supervisor for guidance.
        </div>
      </main>
    </div>
  );
}
