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

  const userName = t("bartender"); // use translated name
  const { lastMessage } = useNotifications();
  // Move filterDate state above useBeverages
  const [filterDate, setFilterDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  // Pass filterDate to useBeverages
  const { orders } = useBeverages(filterDate);
  const { user } = useAuth();
  const branchId = user?.branch;

  const [inventoryRequests, setInventoryRequests] = useState([]);
//  const { pendingOrders, inventoryItems, lowStock, staffCount } = useDashboardStats();
  useEffect(() => {
    if (lastMessage) {
      alert(lastMessage.message);
    }
  }, [lastMessage]);

  useEffect(() => {
    async function fetchRequests() {
      try {
        const res = await axios.get("https://kebede-butchery-ms.onrender.com/api/inventory/requests/", {
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
      case 'Orders':
      default:
        return <Pending orders={orders} filterDate={filterDate} setFilterDate={setFilterDate} />;
    }
  };

  const navItems = [
    { label: t('orders'), icon: <FaClipboardList />, section: 'Orders' },
    { label: t('closed'), icon: <FaLock />, section: 'Closed' },
    { label: t('inventory'), icon: <FaBoxes />, section: 'Inventory' },
    { label: t('reports'), icon: <FaChartBar />, section: 'Reports' },
  ];

  const handleNavClick = (section) => {
    setActiveSection(section);
    if (section === 'Closed') {
      // Set filterDate to today when Closed tab is clicked
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      setFilterDate(`${yyyy}-${mm}-${dd}`);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Mobile-First Main Content */}
      <main className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Mobile-Optimized Welcome Banner */}
        <div className="bg-blue-100 text-blue-800 p-3 sm:p-4 md:p-6 rounded-xl shadow-lg">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">
            {t("welcome", { name: userName })} 🍻
          </h1>
          <p className="text-sm sm:text-base md:text-md mt-1 line-clamp-2">
            {t("dashboard_intro")}
          </p>
        </div>

        {/* Mobile-Optimized Bar Operations Navigation */}
        <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <FaBeer className="text-xl sm:text-2xl text-blue-600 flex-shrink-0" />
            <h2 className="text-base sm:text-lg font-semibold text-gray-700 truncate">{t("bar_operations")}</h2>
          </div>

          {/* Mobile-First Navigation Grid */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
            {navItems.map(({ label, icon, section }) => (
              <button
                key={section}
                onClick={() => handleNavClick(section)}
                className={`flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-3 sm:py-2 rounded-xl font-medium transition-all duration-200 touch-manipulation min-h-[48px] ${
                  activeSection === section
                    ? 'bg-blue-100 text-blue-700 shadow-md transform scale-105'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm'
                }`}
              >
                <span className="text-base sm:text-lg flex-shrink-0">{icon}</span>
                <span className="text-xs sm:text-sm md:text-base truncate">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile-Optimized Main Content Area */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {renderContent()}
        </div>

        {/* Remove per-page footer. Footer is now global. */}
      </main>
    </div>
  );
}
