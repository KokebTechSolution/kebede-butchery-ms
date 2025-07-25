import React, { useState, useEffect } from "react";
import { FaBeer, FaClipboardList, FaBoxes, FaChartBar, FaLock } from "react-icons/fa";
import { useNotifications } from "../../context/NotificationContext";
import ClosedOrders from "./screens/Pending/ClosedOrders";
import { useBeverages } from "./hooks/useBeverages";
import Pending from "./screens/Pending/Pending";
import Inventory from "./Inventory/InventoryRequests";
import Reports from "./screens/Reports";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { useTranslation } from "react-i18next";

export default function BartenderDashboard() {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('Orders');
  const [filterDate, setFilterDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const userName = "Bartender"; 
  const { lastMessage } = useNotifications();
  const { orders } = useBeverages(filterDate);
//  const { pendingOrders, inventoryItems, lowStock, staffCount } = useDashboardStats();
  useEffect(() => {
    if (lastMessage) {
      alert(lastMessage.message);
    }
  }, [lastMessage]);

  useEffect(() => {
    async function fetchRequests() {
      try {
        const res = await axios.get("http://localhost:8000/api/inventory/inventoryrequests/", {
          withCredentials: true,  // send session cookies
        });
        setInventoryRequests(
          res.data.filter(req => String(req.branch_id) === String(branchId))
        );
      } catch (err) {
        console.error("Failed to fetch inventory requests", err);
      }
    }
    if (branchId) fetchRequests();
  }, [branchId]);

  const getClosedOrders = () =>
    orders.filter(order =>
      String(order.branch_id) === String(branchId) &&
      order.has_payment &&
      order.items.length > 0 &&
      order.items.every(item => item.status === 'accepted' || item.status === 'rejected')
    );

  const renderContent = () => {
    switch (activeSection) {
      case 'Inventory':
        return <Inventory requests={inventoryRequests} />;
      case 'Reports':
        return <Reports />;
      case 'Closed':
        return <ClosedOrders orders={getClosedOrders()} filterDate={filterDate} setFilterDate={setFilterDate} />;
        return <ClosedOrders orders={getClosedOrders()} filterDate={filterDate} setFilterDate={setFilterDate} />;
      case 'Orders':
      default:
        return <Pending orders={orders} filterDate={filterDate} setFilterDate={setFilterDate} />;
        return <Pending orders={orders} filterDate={filterDate} setFilterDate={setFilterDate} />;
    }
  };

  const navItems = [
    { label: t('orders'), icon: <FaClipboardList />, section: 'Orders' },
    { label: t('closed'), icon: <FaLock />, section: 'Closed' },
    { label: t('inventory'), icon: <FaBoxes />, section: 'Inventory' },
    { label: t('reports'), icon: <FaChartBar />, section: 'Reports' },
  ];

  return (
    <div className="bg-gray-100">
      <main className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-blue-100 text-blue-800 p-4 md:p-6 rounded shadow-sm">
          <h1 className="text-3xl font-bold">
            {t("welcome", { name: userName })} 🍻
          </h1>
          <p className="text-md mt-1">
            {t("dashboard_intro")}
          </p>
        </div>

        {/* Bar Operations Navigation */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3 mb-4">
            <FaBeer className="text-2xl text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-700">{t("bar_operations")}</h2>
          </div>

          <div className="flex flex-wrap gap-3">
            {navItems.map(({ label, icon, section }) => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                  activeSection === section
                    ? 'bg-blue-100 text-blue-700 shadow'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <span className="text-lg">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-lg shadow">
          {renderContent()}
        </div>

        {/* Tip Banner */}
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg text-blue-700 text-sm">
          💡 <strong>{t("tip")}:</strong> {t("tip_text")}
        </div>
      </main>
    </div>
  );
}
