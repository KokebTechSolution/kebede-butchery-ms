import React, { useState, useEffect } from 'react';
import ResponsiveLayout from '../../components/ResponsiveLayout';
import ResponsiveNavbar from '../../components/ResponsiveNavbar';
import TablesPage from './tables/TablesPage.jsx';
import MenuPage from './menu/MenuPage.jsx';
import Cart from '../../components/Cart/Cart.jsx';
import { CartProvider, useCart } from '../../context/CartContext.jsx';
import OrderDetails from './order/OrderDetails.jsx';
import OrderList from './order/OrderList.jsx';
import WaiterProfile from './WaiterProfile.jsx';
import '../../App.css';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../api/axiosInstance';
import { Utensils, ClipboardList, UserCircle, Menu as MenuIcon } from 'lucide-react';

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
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const startPage = params.get('start') || 'tables';

  const [currentPage, setCurrentPage] = useState(startPage);
  const [selectedTable, setSelectedTable] = useState(null);
  const [message, setMessage] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [editingOrderId, setEditingOrderId] = useState(null);

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
  const { tokens } = useAuth();

  const handleNavigate = (page) => {
    if (page === 'order') {
      setCurrentPage('orderDetails');
      return;
    }
    if (page === 'orderDetails') {
      // Allow navigation to orders without requiring table selection
      setCurrentPage('orderDetails');
      return;
    }
    if (page === 'tables' || page === 'menu') {
      setSelectedOrderId(null);
      setEditingOrderId(null);
    }
    
    if (page === 'profile') {
      setCurrentPage('profile');
      setMessage('');
      return;
    }
    
    setCurrentPage(page);
    if (page === 'tables') setSelectedTable(null);
  };

  const handleTableSelect = async (table) => {
    setSelectedTable(table);
    setActiveTable(table.id);
    setCurrentPage('menu');
  };

  const handleOrder = async () => {
    if (cartItems.length === 0) {
      setMessage('Cart is empty');
      return;
    }

    const orderData = {
      table: selectedTable.id,
      items: cartItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        item_type: item.item_type || 'beverage'
        }))
      };

    try {
      await placeOrder(orderData);
        setMessage('Order placed successfully!');
      clearCart();
      setCurrentPage('tables');
      setSelectedTable(null);
    } catch (error) {
      setMessage('Error placing order. Please try again.');
    }
  };

  const handleEditOrder = (orderToEdit) => {
      setEditingOrderId(orderToEdit.id);
    setSelectedOrderId(orderToEdit.id);
      setCurrentPage('menu');
    
    // Load cart with existing items - pass both tableId and items
    const existingItems = orderToEdit.items || [];
    const tableId = orderToEdit.table || activeTableId;
    loadCartForEditing(tableId, existingItems);
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrderId(orderId);
    setCurrentPage('orderDetails');
  };

  const handleOrderDeleted = () => {
    setSelectedOrderId(null);
    setEditingOrderId(null);
    setCurrentPage('orderDetails');
  };

  const handleBackFromMenu = () => {
    setCurrentPage('tables');
    clearCart();
    setSelectedTable(null);
  };

  const handleClearCart = () => {
    clearCart();
    setMessage('Cart cleared');
  };

  const navItems = [
    { key: 'tables', label: 'Tables', icon: <Utensils size={20} /> },
    { key: 'orderDetails', label: 'Orders', icon: <ClipboardList size={20} /> },
    { key: 'profile', label: 'Profile', icon: <UserCircle size={20} /> },
  ];

  const header = (
    <ResponsiveNavbar
      title="Waiter Dashboard"
      user={user}
    />
  );

  const sidebar = (
    <div className="p-4">
      <div className="space-y-2">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => handleNavigate(item.key)}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              currentPage === item.key
                ? 'bg-primary-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center space-x-3">
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentPage) {
      case 'tables':
  return (
          <div className="dashboard-container">
            <div className="dashboard-content">
              <TablesPage onSelectTable={handleTableSelect} />
            </div>
          </div>
        );
      case 'menu':
        return (
          <div className="dashboard-container">
            <div className="dashboard-content">
              <div className="mb-4">
                <button
                  onClick={handleBackFromMenu}
                  className="mobile-button-secondary mb-4"
                >
                  ← Back to Tables
                </button>
                {selectedTable && (
                  <h2 className="text-responsive-lg font-semibold mb-4">
                    Table {selectedTable.number} - Menu
                  </h2>
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
        );
      case 'orderDetails':
        return (
          <div className="dashboard-container">
            <div className="dashboard-content">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
            <OrderList
              onSelectOrder={handleSelectOrder}
              selectedOrderId={selectedOrderId}
            />
                </div>
                <div className="lg:col-span-2">
                  {selectedOrderId ? (
            <OrderDetails
                      selectedOrderId={selectedOrderId}
              onEditOrder={handleEditOrder}
              onOrderDeleted={handleOrderDeleted}
            />
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">Select an order to view details</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className="dashboard-container">
            <div className="dashboard-content">
              <WaiterProfile />
            </div>
          </div>
        );
      default:
        return (
          <div className="dashboard-container">
            <div className="dashboard-content">
              <TablesPage onSelectTable={handleTableSelect} />
      </div>
    </div>
        );
    }
  };

  return (
    <ResponsiveLayout
      header={header}
      sidebar={sidebar}
      showSidebar={true}
      showHeader={true}
    >
      {message && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {message}
        </div>
      )}
      {renderContent()}
    </ResponsiveLayout>
  );
};

const WaiterDashboardWrapper = () => (
  <CartProvider>
    <WaiterDashboard />
  </CartProvider>
);

export default WaiterDashboardWrapper;
