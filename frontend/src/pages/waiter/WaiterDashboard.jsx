import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Coffee, 
  ClipboardList, 
  UserCircle, 
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Plus,
  ArrowLeft,
  Bell,
  Utensils,
  Menu as MenuIcon,
  X,
  LogOut
} from 'lucide-react';

// Components
import TablesPage from './tables/TablesPage';
import MenuPage from './menu/MenuPage';
import Cart from '../../components/Cart/Cart';

import OrderList from './order/OrderList';
import WaiterProfile from './WaiterProfile';

// Context
import { CartProvider, useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

// API
import axiosInstance from '../../api/axiosInstance';

function mergeOrderItems(existingItems, cartItems) {
  const normalize = name => name.trim().toLowerCase();
  const mergedMap = {};

  // First, add all existing items to the map
  for (const existingItem of existingItems) {
    const normName = normalize(existingItem.name);
    mergedMap[normName] = { ...existingItem };
  }

  // Then, merge cart items
  for (const cartItem of cartItems) {
    const normName = normalize(cartItem.name);
    if (mergedMap[normName]) {
      // If exists, sum quantities and set status to pending
      mergedMap[normName] = {
        ...mergedMap[normName],
        quantity: mergedMap[normName].quantity + cartItem.quantity,
        price: cartItem.price || mergedMap[normName].price,
        item_type: cartItem.item_type || mergedMap[normName].item_type,
        status: 'pending',
      };
    } else {
      // If not exists, add as new (pending)
      mergedMap[normName] = {
        ...cartItem,
        status: 'pending',
      };
    }
  }

  // Return as array
  return Object.values(mergedMap);
}

const WaiterDashboard = () => {
  // Router hooks
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const startPage = params.get('start') || 'dashboard';

  // State management
  const [currentPage, setCurrentPage] = useState(startPage);
  const [selectedTable, setSelectedTable] = useState(null);
  const [message, setMessage] = useState('');
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [occupiedTables, setOccupiedTables] = useState(0);
  const [totalTables, setTotalTables] = useState(15);
  const [activeNav, setActiveNav] = useState('dashboard');

  // Navigation items
  const navItems = [
    { 
      key: 'dashboard', 
      label: 'Dashboard', 
      icon: <Home className="w-5 h-5" />,
      onClick: () => handleNavigate('dashboard')
    },
    { 
      key: 'tables', 
      label: 'Tables', 
      icon: <Utensils className="w-5 h-5" />,
      onClick: () => handleNavigate('tables')
    },
    { 
      key: 'orders', 
      label: 'Orders', 
      icon: <ClipboardList className="w-5 h-5" />,
      onClick: () => handleNavigate('orders')
    },
    { 
      key: 'profile', 
      label: 'Profile', 
      icon: <UserCircle className="w-5 h-5" />,
      onClick: () => handleNavigate('profile')
    },
  ];

  // Context hooks
  const { 
    activeTableId, 
    setActiveTable, 
    placeOrder, 
    cartItems, 
    loadCartForEditing, 
    updateOrder, 
    deleteOrder, 
    clearCart,
    user,
    orders
  } = useCart();
  
  const { tokens, user: authUser } = useAuth();

  const handleNavigate = (page) => {
    setIsMobileMenuOpen(false);
    
    // Handle navigation based on the page
    switch(page) {
      case 'order':
      case 'orderDetails':
      case 'orders':
        setCurrentPage('orderDetails');
        setActiveNav('orders');
        break;
        
      case 'tables':
      case 'menu':
        setEditingOrderId(null);
        setCurrentPage(page);
        setActiveNav(page);
        if (page === 'tables') setSelectedTable(null);
        break;
        
      case 'profile':
        setCurrentPage('profile');
        setActiveNav('profile');
        setMessage('');
        break;
        
      case 'dashboard':
      default:
        setCurrentPage('dashboard');
        setActiveNav('dashboard');
        break;
    }
  };

  // Render dashboard cards for the main dashboard view
  const renderDashboardCards = () => {
    const cards = [
      {
        key: 'tables',
        title: 'Manage Tables',
        description: 'View and manage all tables',
        icon: <Utensils className="w-8 h-8" />,
        bgColor: 'bg-blue-600',
        hoverColor: 'hover:bg-blue-700',
        onClick: () => handleNavigate('tables')
      },
      {
        key: 'orders',
        title: 'View Orders',
        description: 'Track and manage all orders',
        icon: <ClipboardList className="w-8 h-8" />,
        bgColor: 'bg-green-600',
        hoverColor: 'hover:bg-green-700',
        onClick: () => handleNavigate('orderDetails')
      },
      {
        key: 'new-order',
        title: 'New Order',
        description: 'Create a new order',
        icon: <Plus className="w-8 h-8" />,
        bgColor: 'bg-purple-600',
        hoverColor: 'hover:bg-purple-700',
        onClick: () => {
          setSelectedTable(null);
          setCurrentPage('tables');
        }
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <motion.div 
            key={card.key}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={card.onClick}
            className={`${card.bgColor} ${card.hoverColor} text-white rounded-xl p-6 shadow-lg cursor-pointer transition-all duration-200`}
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                {card.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold">{card.title}</h3>
                <p className="text-sm opacity-90">{card.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const handleTableSelect = async (table) => {
    setSelectedTable(table);
    setActiveTable(table.id);
    setCurrentPage('menu');
  };

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const handleOrder = async () => {
    // Check if user is authenticated
    if (!authUser || !authUser.isAuthenticated) {
      setMessage('❌ Please log in to place orders!');
      return;
    }

    if (cartItems.length === 0) {
      setMessage('🛒 Your cart is empty! Please add some items first.');
      return;
    }

    if (!selectedTable) {
      setMessage('❌ Please select a table first!');
      return;
    }

    setIsPlacingOrder(true);
    
    // Check if this is an edit operation
    if (editingOrderId) {
      setMessage('📝 Updating your order... Please wait!');
      
      try {
        console.log('WaiterDashboard: About to update order with cartItems:', cartItems);
        
        // Use updateOrder to replace the entire order with current cart items
        const result = await updateOrder(editingOrderId, cartItems);
        console.log('WaiterDashboard: Order update result:', result);
        
        setMessage(`✅ Order updated successfully! Order #${editingOrderId} has been updated.`);
        
        // Clear edit mode
        setEditingOrderId(null);
        
        // Clear the cart after successful update
        if (selectedTable && selectedTable.id) {
          setActiveTable(selectedTable.id);
          clearCart();
        }
        
        // Force a refresh of the order list to show updated data
        // This will trigger the OrderList to refetch and show the updated quantities
        console.log('WaiterDashboard: Dispatching orderUpdated event for order:', editingOrderId);
        const event = new CustomEvent('orderUpdated', { detail: { orderId: editingOrderId } });
        window.dispatchEvent(event);
        
        // Also try to manually refresh the order list by calling the parent's refresh function
        if (window.refreshOrderList) {
          console.log('WaiterDashboard: Calling window.refreshOrderList');
          window.refreshOrderList();
        }
        
        // Give the event a moment to process, then navigate back to tables
        setTimeout(() => {
          setCurrentPage('tables');
        }, 1000);
        
      } catch (error) {
        console.error('Order update error:', error);
        setMessage(`❌ Failed to update order: ${error.message || 'Please try again.'}`);
      } finally {
        setIsPlacingOrder(false);
        setTimeout(() => {
          setMessage('');
        }, 5000); // Show error message longer
        setCurrentPage('tables');
        setSelectedTable(null);
      }
    } else {
      // This is a new order
      setMessage('📝 Placing your order... Please wait!');

      const orderData = {
        table: selectedTable.id,
        waiter_id: authUser?.id,
        waiter_username: authUser?.username,
        waiter_name: authUser?.first_name || authUser?.username,
        items: cartItems.map(item => {
          console.log('[DEBUG] Order item mapping:', item);
          return {
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            item_type: item.item_type, // Remove default fallback - item_type must be set
            product: item.id || item.product_id || item.product || null
          };
        })
      };

      try {
        await placeOrder(orderData);
        setMessage(`✅ Great! Order for Table ${selectedTable.number} has been placed successfully! The kitchen will start preparing it now.`);
        clearCart();
        
        setTimeout(() => {
          setMessage('');
        }, 3000);
        
        setCurrentPage('tables');
        setSelectedTable(null);
      } catch (error) {
        console.error('Order placement error:', error);
        setMessage('❌ Oops! Something went wrong while placing the order. Please check your connection and try again.');
      } finally {
        setIsPlacingOrder(false);
      }
    }
  };

  const handleEditOrder = (orderToEdit) => {
    // Check if user is authenticated
    if (!authUser || !authUser.isAuthenticated) {
      setMessage('❌ Please log in to edit orders!');
      return;
    }
    
    // Check if this order belongs to the current user
    if (orderToEdit.waiter_id && authUser.id && orderToEdit.waiter_id !== authUser.id) {
      setMessage('❌ You can only edit your own orders!');
      return;
    }
    
    setEditingOrderId(orderToEdit.id);
    
    // Fix: Pass tableId and items separately, with safety checks
    const tableId = orderToEdit.table || orderToEdit.table_number;
    const items = orderToEdit.items || [];
    
    console.log('[DEBUG] handleEditOrder - tableId:', tableId, 'items:', items);
    
    // Set the selected table for the order being edited
    // Create a table object with the table ID and number
    const table = {
      id: tableId,
      number: orderToEdit.table_number || tableId
    };
    setSelectedTable(table);
    
    // IMPORTANT: Set active table FIRST, then load cart for editing
    setActiveTable(tableId);
    
    // Now load the cart for editing with the correct active table
    loadCartForEditing(tableId, items);
    
    setCurrentPage('menu');
  };



  const handleBackFromMenu = () => {
    setCurrentPage('tables');
    clearCart();
    setSelectedTable(null);
  };

  const handleClearCart = () => {
    if (cartItems.length === 0) {
      setMessage('🛒 Your cart is already empty!');
      return;
    }
    
    // Simple confirmation for non-technical users
    const itemCount = cartItems.length;
    const confirmMessage = `Are you sure you want to remove all ${itemCount} item${itemCount > 1 ? 's' : ''} from your cart?`;
    
    if (window.confirm(confirmMessage)) {
      clearCart();
      setMessage('🗑️ Cart cleared! All items have been removed.');
      
      // Auto-hide message after 2 seconds
      setTimeout(() => {
        setMessage('');
      }, 2000);
    }
  };

  // Fetch active orders and table status
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // In a real app, you would fetch this from your API
        // const response = await axiosInstance.get('/api/waiter/dashboard-stats');
        // setActiveOrdersCount(response.data.activeOrders);
        // setOccupiedTables(response.data.occupiedTables);
        // setTotalTables(response.data.totalTables);
        
        // Mock data for now
        setActiveOrdersCount(5);
        setOccupiedTables(8);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
  }, []);

  // Render the sidebar navigation
  const renderSidebar = () => (
    <div className="space-y-6">
      {/* User Info */}
      <div className="p-4 bg-white rounded-xl shadow-sm">
        <p className="text-sm text-gray-600">
          🔒 Your personal workspace - only your orders & tables
        </p>
        {authUser?.username && (
          <p className="text-xs text-blue-600 mt-1">
            Logged in as: {authUser.username}
          </p>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="space-y-2">
        <button
          onClick={() => handleNavigate('tables')}
          className={`w-full flex items-center space-x-4 px-5 py-4 rounded-xl transition-all duration-200 transform hover:scale-105 ${
            currentPage === 'tables'
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-green-50 hover:text-green-700 shadow-md border border-gray-200'
          }`}
        >
          <div className={`p-2 rounded-lg ${
            currentPage === 'tables' ? 'bg-white bg-opacity-20' : 'bg-green-100'
          }`}>
            <Home className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="font-semibold text-base">Tables</span>
            <p className="text-xs opacity-75">View & select tables</p>
          </div>
        </button>
        
        <button
          onClick={() => handleNavigate('orderDetails')}
          className={`w-full flex items-center space-x-4 px-5 py-4 rounded-xl transition-all duration-200 transform hover:scale-105 ${
            currentPage === 'orderDetails'
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-700 shadow-md border border-gray-200'
          }`}
        >
          <div className={`p-2 rounded-lg ${
            currentPage === 'orderDetails' ? 'bg-white bg-opacity-20' : 'bg-orange-100'
          }`}>
            <ClipboardList className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="font-semibold text-base">Orders</span>
            <p className="text-xs opacity-75">Manage all orders</p>
          </div>
          {orders?.length > 0 && (
            <div className="ml-auto">
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {orders.length}
              </span>
            </div>
          )}
        </button>
        
        <button
          onClick={() => handleNavigate('profile')}
          className={`w-full flex items-center space-x-4 px-5 py-4 rounded-xl transition-all duration-200 transform hover:scale-105 ${
            currentPage === 'profile'
              ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-purple-50 hover:text-purple-700 shadow-md border border-gray-200'
          }`}
        >
          <div className={`p-2 rounded-lg ${
            currentPage === 'profile' ? 'bg-white bg-opacity-20' : 'bg-purple-100'
          }`}>
            <UserCircle className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="font-semibold text-base">My Profile</span>
            <p className="text-xs opacity-75">View your info</p>
          </div>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="p-4 bg-gray-50 rounded-xl border">
        <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
          <Bell className="w-4 h-4 mr-2" />
          Today's Summary
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Active Orders:</span>
            <span className="font-semibold text-orange-600">{orders?.filter(o => o.status === 'pending').length || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Completed:</span>
            <span className="font-semibold text-green-600">{orders?.filter(o => o.status === 'completed').length || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentPage) {
      case 'tables':
        return (
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
            <div className="max-w-7xl mx-auto">
              {/* Header Section */}
              <div className="mb-8 text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-green-500 p-3 rounded-full mr-4">
                    <Home className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800">Restaurant Tables</h1>
                    <p className="text-gray-600 mt-1">Choose a table to start taking orders</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100">
                  <div className="flex items-center justify-center space-x-6 text-sm">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-gray-700">Available</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-gray-700">Occupied</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
                      <span className="text-gray-700">Needs Service</span>
                    </div>
                  </div>
                </div>
              </div>
              <TablesPage onSelectTable={handleTableSelect} />
            </div>
          </div>
        );
      case 'menu':
        return (
          <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-4">
            <div className="max-w-7xl mx-auto">
              {/* Header with Back Button */}
              <div className="mb-6">
                <button
                  onClick={handleBackFromMenu}
                  className="flex items-center space-x-2 bg-white hover:bg-gray-50 px-6 py-3 rounded-xl shadow-md border border-gray-200 transition-all duration-200 transform hover:scale-105 mb-4"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                  <span className="font-semibold text-gray-700">Back to Tables</span>
                </button>
                {selectedTable && (
                  <div className="bg-white rounded-xl p-6 shadow-lg border border-orange-100">
                    <div className="flex items-center space-x-4">
                      <div className="bg-orange-500 p-3 rounded-full">
                        <Coffee className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">Table {selectedTable.number}</h2>
                        <p className="text-gray-600">Select items from the menu below</p>
                      </div>
                      {cartItems.length > 0 && (
                        <div className="ml-auto bg-orange-100 px-4 py-2 rounded-full">
                          <span className="text-orange-700 font-semibold">
                            {cartItems.length} item{cartItems.length > 1 ? 's' : ''} in cart
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <MenuPage 
                    table={selectedTable}
                    onBack={handleBackFromMenu}
                    editingOrderId={editingOrderId}
                    onOrder={handleOrder}
                  />
                </div>
                <div className="lg:col-span-1">
                  <div className="sticky top-4">
                    <Cart 
                      onOrder={handleOrder}
                      onClearCart={handleClearCart}
                      editingOrderId={editingOrderId}
                      onUpdateOrder={updateOrder}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'orderDetails':
        return (
          <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
            <div className="max-w-7xl mx-auto">
              {/* Header Section */}
              <div className="mb-8">
                <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-100">
                  <div className="flex items-center space-x-4">
                    <div className="bg-purple-500 p-3 rounded-full">
                      <ClipboardList className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-800">Order Management</h1>
                      <p className="text-gray-600">View and manage all customer orders</p>
                    </div>
                    <div className="ml-auto flex space-x-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {orders?.filter(o => o.status === 'pending').length || 0}
                        </div>
                        <div className="text-xs text-gray-600">Pending</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {orders?.filter(o => o.status === 'completed').length || 0}
                        </div>
                        <div className="text-xs text-gray-600">Completed</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Mobile-First Responsive Grid Layout */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
                <div className="xl:col-span-1 order-2 xl:order-1">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                    <div className="p-3 sm:p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-800 flex items-center text-sm sm:text-base">
                        <ClipboardList className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">All Orders</span>
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1 hidden sm:block">Click on any order to view details</p>
                      <p className="text-xs text-gray-600 mt-1 sm:hidden">Tap to view details</p>
                    </div>
                    <OrderList
                      onEditOrder={handleEditOrder}
                    />
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8 lg:p-12 text-center">
                    <div className="mb-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ClipboardList className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">Order Management</h3>
                      <p className="text-sm sm:text-base text-gray-500 px-2">Click on any order in the list to view details, edit, print, or cancel orders</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <p className="text-sm text-blue-700">
                        💡 <strong>Tip:</strong> Use the filter buttons to view orders by status, and expand table sections to see individual orders
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
            <div className="max-w-4xl mx-auto">
              {/* Header Section */}
              <div className="mb-8">
                <div className="bg-white rounded-xl p-6 shadow-lg border border-indigo-100">
                  <div className="flex items-center space-x-4">
                    <div className="bg-indigo-500 p-3 rounded-full">
                      <UserCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
                      <p className="text-gray-600">View and update your personal information</p>
                    </div>
                  </div>
                </div>
              </div>
              <WaiterProfile />
            </div>
          </div>
        );
      default:
        return (
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
            <div className="max-w-7xl mx-auto">
              <TablesPage onSelectTable={handleTableSelect} />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-blue-600">Kebede Butchery</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={item.onClick}
                    className={`${activeNav === item.key
                      ? 'border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium'
                      }`}
                  >
                    <span className="mr-1">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="ml-3 relative">
                <div>
                  <button
                    type="button"
                    className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    id="user-menu"
                    aria-expanded="false"
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      {authUser?.first_name?.[0] || authUser?.username?.[0] || 'U'}
                    </div>
                  </button>
                </div>
              </div>
            </div>
            <div className="-mr-2 flex items-center sm:hidden">
              <div className="sm:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <MenuIcon className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden"
          >
            <div className="pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    item.onClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`${
                    activeNav === item.key
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left`}
                >
                  <div className="flex items-center">
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                  </div>
                </button>
              ))}
              <button
                onClick={() => {
                  navigate('/logout');
                }}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <div className="flex items-center">
                  <LogOut className="w-5 h-5 mr-3" />
                  Sign out
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Status Message */}
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-lg shadow-md ${
              message.includes('Error') ? 'bg-red-100 text-red-700' : 
              message.includes('success') || message.includes('placed') ? 'bg-green-100 text-green-700' : 
              'bg-blue-100 text-blue-700'
            }`}
          >
            <div className="flex justify-between items-center">
              <p className="flex items-center">
                {message.includes('Error') ? (
                  <AlertCircle className="w-5 h-5 mr-2" />
                ) : message.includes('success') || message.includes('placed') ? (
                  <CheckCircle className="w-5 h-5 mr-2" />
                ) : (
                  <Bell className="w-5 h-5 mr-2" />
                )}
                {message}
              </p>
              <button 
                onClick={() => setMessage('')}
                className="text-xl font-semibold hover:opacity-75 transition-opacity"
                aria-label="Close message"
              >
                &times;
              </button>
            </div>
          </motion.div>
        )}

        {/* Page Content */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {renderContent()}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setActiveNav(item.key);
                handleNavigate(item.key);
              }}
              className={`flex flex-col items-center justify-center w-full py-3 text-xs ${
                activeNav === item.key ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <div className="text-xl mb-1">
                {React.cloneElement(item.icon, {
                  className: `w-6 h-6 ${activeNav === item.key ? 'text-blue-600' : 'text-gray-500'}`
                })}
              </div>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Add bottom padding to account for mobile nav */}
      <div className="h-16 md:hidden"></div>
    </div>
  );
};

const WaiterDashboardWrapper = () => (
  <CartProvider>
    <WaiterDashboard />
  </CartProvider>
);

export default WaiterDashboardWrapper;