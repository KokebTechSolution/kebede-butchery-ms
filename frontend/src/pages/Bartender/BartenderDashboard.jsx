import React, { useState, useEffect } from "react";
import { FaBeer, FaClipboardList, FaBoxes, FaChartBar, FaLock, FaBars } from "react-icons/fa";
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
        const res = await axios.get("http://localhost:8000/api/inventory/requests/", {
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

  const handleNavClick = (section) => {
    setActiveSection(section);
    setIsDropdownOpen(false); // Close dropdown after selection
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
    <div className="bg-gray-100 min-h-screen overflow-x-hidden">
      <main className="p-4 md:p-6 lg:p-8 space-y-6 max-w-full">
        {/* Welcome Banner */}
        <div className="bg-blue-100 text-blue-800 p-4 md:p-6 rounded shadow-sm">
          <h1 className="text-3xl font-bold">
            {t("welcome", { name: userName })} 🍻
          </h1>
          <p className="text-md mt-1">
            {t("dashboard_intro")}
          </p>
        </div>

                 {/* Bar Operations Navigation - Direct Buttons + Dropdown */}
         <div className="bg-white rounded-lg shadow p-4 max-w-2xl mx-auto">
           <div className="flex items-center gap-3 mb-4">
             <FaBeer className="text-2xl text-blue-600" />
             <h2 className="text-lg font-semibold text-gray-700">{t("bar_operations")}</h2>
           </div>

           <div className="grid grid-cols-3 gap-3">
             {/* Direct Buttons for Orders and Closed */}
             <button
               onClick={() => handleNavClick('Orders')}
               className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition-colors ${
                 activeSection === 'Orders'
                   ? 'bg-blue-600 text-white shadow'
                   : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
               }`}
             >
               <FaClipboardList className="text-lg" />
               {t('orders')}
             </button>

             <button
               onClick={() => handleNavClick('Closed')}
               className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition-colors ${
                 activeSection === 'Closed'
                   ? 'bg-blue-600 text-white shadow'
                   : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
               }`}
             >
               <FaLock className="text-lg" />
               {t('closed')}
             </button>

             {/* Dropdown for Inventory and Reports */}
             <div className="relative">
               <button
                 onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                 className="flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors w-full"
               >
                 <FaBars className="text-lg" />
                 More
               </button>

               {/* Dropdown Menu */}
               {isDropdownOpen && (
                 <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48">
                   <button
                     onClick={() => handleNavClick('Inventory')}
                     className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                       activeSection === 'Inventory'
                         ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                         : 'text-gray-700'
                     }`}
                   >
                     <FaBoxes className="text-lg" />
                     {t('inventory')}
                   </button>
                   <button
                     onClick={() => handleNavClick('Reports')}
                     className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                       activeSection === 'Reports'
                         ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                         : 'text-gray-700'
                     }`}
                   >
                     <FaChartBar className="text-lg" />
                     {t('reports')}
                   </button>
                 </div>
               )}
             </div>
           </div>
         </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow overflow-x-hidden">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
