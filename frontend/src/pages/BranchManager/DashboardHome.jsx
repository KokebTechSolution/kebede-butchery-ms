// src/pages/BranchManager/DashboardHome.jsx
import React from 'react';
import SalesSummary from "../../components/ManagmentComponents/Dashboard/SalesSummary";
import StockAlerts from "../../components/ManagmentComponents/Dashboard/StockAlerts";
import StockLevels from "../../components/ManagmentComponents/Dashboard/StockLevels";
import EmployeeActivity from "../../components/ManagmentComponents/Dashboard/EmployeeActivity";
import StaffRequests from "../../components/ManagmentComponents/Dashboard/StaffRequests";
import { FaCashRegister, FaBoxes, FaUsers, FaClipboardList } from "react-icons/fa";
import { useTranslation } from 'react-i18next';

export default function DashboardHome() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{t('stock_alert')}</h1>
        <p className="text-gray-600 text-sm sm:text-base">Monitor your inventory and staff activities</p>
      </div>
      
      {/* Stock Alerts - Full Width */}
      <div className="w-full">
        <StockAlerts />
      </div>
      
      {/* Dashboard Cards Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {/* Sales */}
        <Card icon={<FaCashRegister />} title={t('sales_overview')} color="text-green-600">
          <SalesSummary />
        </Card>

        {/* Stock */}
        <Card icon={<FaBoxes />} title={t('stock_alerts')} color="text-red-600">
          <StockLevels />
        </Card>

        {/* Activity */}
        <Card icon={<FaUsers />} title={t('staff_activity')} color="text-yellow-600">
          <EmployeeActivity />
        </Card>
      </div>

      {/* Requests - Full Width */}
      <div className="w-full">
        <Card icon={<FaClipboardList />} title={t('pending_requests')} color="text-purple-600" full>
          <StaffRequests />
        </Card>
      </div>
    </div>
  );
}

function Card({ icon, title, color, children, full }) {
  return (
    <div className={`${
      full ? 'col-span-full' : 'col-span-1'
    } bg-white rounded-xl shadow-mobile p-4 sm:p-6 transition-shadow hover:shadow-mobile-lg`}>
      <div className="flex items-center gap-3 mb-4">
        {React.cloneElement(icon, { className: `text-xl sm:text-2xl ${color}` })}
        <h2 className="text-lg sm:text-xl font-semibold text-gray-700">{title}</h2>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}
