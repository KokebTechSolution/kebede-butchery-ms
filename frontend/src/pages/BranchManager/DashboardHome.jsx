// src/pages/BranchManager/DashboardHome.jsx
import React, { useState } from 'react';
import SalesSummary from "../../components/ManagmentComponents/Dashboard/SalesSummary";
import StockAlerts from "../../components/ManagmentComponents/Dashboard/StockAlerts";
import StockLevels from "../../components/ManagmentComponents/Dashboard/StockLevels";
import EmployeeActivity from "../../components/ManagmentComponents/Dashboard/EmployeeActivity";
import StaffRequests from "../../components/ManagmentComponents/Dashboard/StaffRequests";
import WaiterEarnings from "../../components/ManagmentComponents/Dashboard/WaiterEarnings";
import TopSellingItems from "../../components/ManagmentComponents/Dashboard/TopSellingItems";
import { FaCashRegister, FaBoxes, FaUsers, FaClipboardList, FaCalendarAlt, FaTrophy, FaUserTie } from "react-icons/fa";
import { useTranslation } from 'react-i18next';

export default function DashboardHome() {
  const { t } = useTranslation();
  const [filterDate, setFilterDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  return (
    <div className="space-y-6">
      {/* Date Filter Header */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800">{t('dashboard_overview')}</h1>
          <div className="flex items-center gap-3">
            <FaCalendarAlt className="text-blue-500" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Enhanced Sales Summary */}
        <Card icon={<FaCashRegister />} title={t('sales_summary')} color="text-green-600">
          <SalesSummary filterDate={filterDate} />
        </Card>

        {/* Waiter Earnings */}
        <Card icon={<FaUserTie />} title={t('waiter_earnings')} color="text-blue-600">
          <WaiterEarnings filterDate={filterDate} />
        </Card>

        {/* Top Selling Items */}
        <Card icon={<FaTrophy />} title={t('top_selling_items')} color="text-yellow-600">
          <TopSellingItems filterDate={filterDate} />
        </Card>

        {/* Stock Alerts */}
        <Card icon={<FaBoxes />} title={t('stock_alerts')} color="text-red-600">
          <StockLevels />
        </Card>

        {/* Staff Activity */}
        <Card icon={<FaUsers />} title={t('staff_activity')} color="text-purple-600">
          <EmployeeActivity />
        </Card>

        {/* Stock Alerts */}
        <Card icon={<FaBoxes />} title={t('stock_alerts')} color="text-orange-600">
          <StockAlerts />
        </Card>
      </div>

      {/* Full Width Components */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Staff Requests */}
        <Card icon={<FaClipboardList />} title={t('pending_requests')} color="text-indigo-600" full>
          <StaffRequests />
        </Card>

        {/* Enhanced Stock Overview */}
        <Card icon={<FaBoxes />} title={t('inventory_overview')} color="text-teal-600" full>
          <StockLevels />
        </Card>
      </div>
    </div>
  );
}

function Card({ icon, title, color, children, full }) {
  return (
    <div className={`${full ? 'col-span-full' : 'col-span-1'} bg-white rounded-lg shadow p-4`}>
      <div className="flex items-center gap-3 mb-4">
        {React.cloneElement(icon, { className: `text-2xl ${color}` })}
        <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
      </div>
      {children}
    </div>
  );
}
