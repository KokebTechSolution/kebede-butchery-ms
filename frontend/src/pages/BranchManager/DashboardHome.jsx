// src/pages/BranchManager/DashboardHome.jsx
import React from 'react';
import SalesSummary from "../../components/ManagmentComponents/Dashboard/SalesSummary";
import StockLevels from "../../components/ManagmentComponents/Dashboard/StockLevels";
import EmployeeActivity from "../../components/ManagmentComponents/Dashboard/EmployeeActivity";
import StaffRequests from "../../components/ManagmentComponents/Dashboard/StaffRequests";
import { FaCashRegister, FaBoxes, FaUsers, FaClipboardList } from "react-icons/fa";

export default function DashboardHome() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Sales */}
        <Card icon={<FaCashRegister />} title="Sales Overview" color="text-green-600">
          <SalesSummary />
        </Card>

        {/* Stock */}
        <Card icon={<FaBoxes />} title="Stock Alerts" color="text-red-600">
          <StockLevels />
        </Card>

        {/* Activity */}
        <Card icon={<FaUsers />} title="Staff Activity" color="text-yellow-600">
          <EmployeeActivity />
        </Card>
      </div>

      {/* Requests */}
      <Card icon={<FaClipboardList />} title="Pending Requests" color="text-purple-600" full>
        <StaffRequests />
      </Card>
    </div>
  );
}

function Card({ icon, title, color, children, full }) {
  return (
    <div className={`${full ? 'col-span-full' : 'col-span-1'} bg-white rounded-lg shadow p-4`}>
      <div className="flex items-center gap-3 mb-2">
        {React.cloneElement(icon, { className: `text-2xl ${color}` })}
        <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
      </div>
      {children}
    </div>
  );
}
