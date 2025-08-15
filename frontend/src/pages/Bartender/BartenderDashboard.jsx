import React, { useState, useEffect } from "react";
import { 
  FaBeer, 
  FaClipboardList, 
  FaBoxes, 
  FaChartBar, 
  FaLock,
  FaCalendarAlt,
  FaSyncAlt,
  FaCheckCircle
} from "react-icons/fa";
import { useNotifications } from "../../context/NotificationContext";
import NotificationToast from "../../components/NotificationToast";
import ClosedOrders from "./screens/Pending/ClosedOrders";
import { useBeverages } from "./hooks/useBeverages";
import Pending from "./screens/Pending/Pending";
import Inventory from "./Inventory/InventoryRequests";
import ReachedRequests from "./Inventory/ReachedRequests";
import Reports from "./screens/Reports";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { useTranslation } from "react-i18next";

export default function BartenderDashboard() {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('Orders');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userName = t("bartender");
  const { notifications, removeNotification } = useNotifications();
  
  const [filterDate, setFilterDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const { orders } = useBeverages(filterDate);
  const { user } = useAuth();
  const branchId = user?.branch;

  const [inventoryRequests, setInventoryRequests] = useState([]);

  useEffect(() => {
    async function fetchRequests() {
      try {
        const res = await axios.get("https://kebede-butchery-ms.onrender.com/api/inventory/requests/", {
          withCredentials: true,
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
      case 'Reached':
        return <ReachedRequests />;
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
    { 
      label: t('orders'), 
      icon: <FaClipboardList className="w-5 h-5" />, 
      section: 'Orders',
      color: 'blue'
    },
    { 
      label: t('closed'), 
      icon: <FaLock className="w-5 h-5" />, 
      section: 'Closed',
      color: 'green'
    },
    { 
      label: t('inventory'), 
      icon: <FaBoxes className="w-5 h-5" />, 
      section: 'Inventory',
      color: 'purple'
    },
    { 
      label: t('reached'), 
      icon: <FaCheckCircle className="w-5 h-5" />, 
      section: 'Reached',
      color: 'teal'
    },
    { 
      label: t('reports'), 
      icon: <FaChartBar className="w-5 h-5" />, 
      section: 'Reports',
      color: 'orange'
    },
  ];

  const handleNavClick = (section) => {
    setActiveSection(section);
    if (section === 'Closed') {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      setFilterDate(`${yyyy}-${mm}-${dd}`);
    }
  };

  const getActiveColor = (item) => {
    if (activeSection === item.section) {
      switch (item.color) {
        case 'blue': return 'bg-blue-100 text-blue-700 border-blue-300';
        case 'green': return 'bg-green-100 text-green-700 border-green-300';
        case 'purple': return 'bg-purple-100 text-purple-700 border-purple-300';
        case 'orange': return 'bg-orange-100 text-orange-700 border-orange-300';
        default: return 'bg-blue-100 text-blue-700 border-blue-300';
      }
    }
    return 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300';
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Notification Toast */}
      <NotificationToast 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
      
      {/* Mobile-First Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <FaBeer className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Bartender Dashboard</h1>
                <p className="text-sm text-gray-500">Bar Operations</p>
              </div>
            </div>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-2 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.section}
                  onClick={() => {
                    handleNavClick(item.section);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === item.section
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Desktop Navigation Tabs */}
        <div className="hidden md:block border-t border-gray-200 bg-white">
          <div className="px-4 py-2">
            <div className="flex space-x-1">
              {navItems.map((item) => {
                // Get count for each section
                let count = 0;
                switch (item.section) {
                  case 'Orders':
                    count = orders.length;
                    break;
                  case 'Closed':
                    count = getClosedOrders().length;
                    break;
                  case 'Inventory':
                    count = inventoryRequests.length;
                    break;
                  case 'Reached':
                    count = inventoryRequests.filter(req => req.status === 'accepted' && !req.reached_status).length;
                    break;
                  default:
                    count = 0;
                }
                
                return (
                  <button
                    key={item.section}
                    onClick={() => handleNavClick(item.section)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                      activeSection === item.section
                        ? 'bg-blue-100 text-blue-700 border border-blue-300 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800 border border-transparent'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                    {count > 0 && (
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full font-bold ${
                        activeSection === item.section
                          ? 'bg-blue-200 text-blue-800'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 space-y-4 pb-20 md:pb-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <FaBeer className="text-3xl" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">
                Welcome, {userName} 🍻
              </h2>
              <p className="text-blue-100 text-sm leading-relaxed">
                Manage your bar operations, handle beverage orders, and keep track of inventory from your mobile device.
              </p>
            </div>
          </div>
        </div>

        {/* Date Filter Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
              <FaCalendarAlt className="text-blue-500" />
              <span>Filter by Date</span>
            </h3>
            <button
              onClick={() => {
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                setFilterDate(`${yyyy}-${mm}-${dd}`);
              }}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Reset to today"
            >
              <FaSyncAlt className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                // Refresh orders when date filter changes
                if (activeSection === 'Orders' || activeSection === 'Closed') {
                  // Trigger refresh by calling refetch from useBeverages
                  // This will be handled by the useBeverages hook
                }
              }}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 capitalize">
                {activeSection}
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {activeSection === 'Orders' && `${orders.length} orders`}
                  {activeSection === 'Closed' && `${getClosedOrders().length} closed`}
                  {activeSection === 'Inventory' && `${inventoryRequests.length} requests`}
                  {activeSection === 'Reached' && `${inventoryRequests.filter(req => req.status === 'accepted' && !req.reached_status).length} pending`}
                </span>
              </div>
            </div>
          </div>
          
          <div className="min-h-[400px]">
            {renderContent()}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden shadow-lg">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <button
              key={item.section}
              onClick={() => handleNavClick(item.section)}
              className={`relative flex flex-col items-center justify-center w-full py-3 transition-all duration-200 ${
                activeSection === item.section 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className={`text-xl mb-1 transition-colors ${
                activeSection === item.section ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {item.icon}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
              
              {/* Active Indicator */}
              {activeSection === item.section && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-blue-600 rounded-t-full"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom padding for mobile navigation */}
      <div className="h-24 md:h-0"></div>
    </div>
  );
}
