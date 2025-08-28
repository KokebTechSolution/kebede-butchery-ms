// src/pages/BranchManager/DashboardHome.jsx
import React, { useState } from 'react';
import SalesSummary from "../../components/ManagmentComponents/Dashboard/SalesSummary";
import StockLevels from "../../components/ManagmentComponents/Dashboard/StockLevels";
import WaiterEarnings from "../../components/ManagmentComponents/Dashboard/WaiterEarnings";
import TopSellingItems from "../../components/ManagmentComponents/Dashboard/TopSellingItems";
import { FaCashRegister, FaBoxes, FaCalendarAlt, FaTrophy, FaUserTie } from "react-icons/fa";
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

        {/* Stock Levels */}
        <Card icon={<FaBoxes />} title={t('stock_levels')} color="text-red-600">
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
