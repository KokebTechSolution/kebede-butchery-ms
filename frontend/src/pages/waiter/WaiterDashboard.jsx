import React, { useState, useEffect } from 'react';
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
import { FaTable, FaUtensils, FaClipboardList, FaUser, FaTimes, FaPrint, FaCheck } from 'react-icons/fa';
import { printOrder } from '../../api/waiterApi';

const WaiterDashboard = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const startPage = params.get('start') || 'tables';

  const [currentPage, setCurrentPage] = useState(() => {
    // Check if there's a saved page state from reload
    const savedPage = localStorage.getItem('waiterCurrentPage');
    if (savedPage) {
      localStorage.removeItem('waiterCurrentPage'); // Clear it after use
      return savedPage;
    }
    return startPage;
  }); // 'tables', 'menu', or 'orderDetails'
  const [selectedTable, setSelectedTable] = useState(null);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [message, setMessage] = useState('');
  const [tablesData, setTablesData] = useState([]);

  const {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    user,
    orders,
    setActiveTable,
    activeTableId,
    placeOrder,
    loadCartForEditing,
    updateOrder,
    deleteOrder,
    refreshOrders,
    refreshTables,
    refreshAll
  } = useCart();

  // Function to fetch tables data
  const fetchTablesData = async () => {
    try {
      const response = await axiosInstance.get('/branches/tables/');
      setTablesData(response.data);
      
      // Also refresh orders when tables are refreshed
      await refreshOrders();
    } catch (error) {
      console.error('Failed to fetch tables:', error);
      setMessage('Failed to fetch tables data.');
    }
  };

  // Function to get table information by ID
  const getTableInfo = (tableId) => {
    if (!tableId) return null;
    
    // First try to find in tablesData
    const tableFromData = tablesData.find(table => table.id === tableId);
    if (tableFromData) {
      return {
        id: tableFromData.id,
        number: tableFromData.number
      };
    }
    
    // Then try to find in orders to get table number
    const orderWithTable = orders?.find(order => 
      order.table === tableId || order.branch === tableId
    );
    
    if (orderWithTable) {
      return {
        id: tableId,
        number: orderWithTable.table_number || 'Unknown'
      };
    }
    
    // Fallback to a default table object
    return {
      id: tableId,
      number: 'Table ' + tableId
    };
  };

  // Function to check if a table is in ordering status
  const isTableOrdering = (tableId) => {
    if (!tableId || !orders) return false;
    
    // Check if there's an active order for this table
    const tableOrder = orders.find(order => {
      const orderTableNumber = order.table_number || order.table || order.table_id;
      const tableNumber = tableId;
      return orderTableNumber == tableNumber;
    });
    
    // Return true if table has an active order (not completed/cancelled)
    return tableOrder && !tableOrder.has_payment && tableOrder.status !== 'cancelled';
  };

  // Ensure selectedTable is always available when on menu page
  useEffect(() => {
    if (currentPage === 'menu' && activeTableId && !selectedTable) {
      const tableInfo = getTableInfo(activeTableId);
      setSelectedTable(tableInfo);
    }
  }, [currentPage, activeTableId, selectedTable]);

  // Debug logging for state changes
  useEffect(() => {
    // console.log('[DEBUG] State changed:', {
    //   currentPage,
    //   selectedTable,
    //   activeTableId,
    //   editingOrderId,
    //   cartItems: cartItems?.length || 0
    // });
  }, [currentPage, selectedTable, activeTableId, editingOrderId, cartItems]);

  // Fetch tables data on component mount
  useEffect(() => {
    fetchTablesData();
  }, []);

  // Function to print order and send to cashier
  const handlePrintOrder = async (orderId) => {
    try {
      setMessage('Sending order to cashier...');
      
      // Use the dedicated print endpoint
      const response = await printOrder(orderId);
      
      if (response) {
        setMessage('Order sent to cashier successfully!');
        // Refresh orders list and tables to show updated status
        await refreshAll();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error printing order:', error);
      setMessage('Failed to send order to cashier');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Function to show order details in modal
  const handleShowOrderModal = (order) => {
    setSelectedOrderForModal(order);
    setShowOrderModal(true);
  };

  // Function to close order modal
  const handleCloseOrderModal = () => {
    setShowOrderModal(false);
    setSelectedOrderForModal(null);
    // Stay on the current page (tables) instead of redirecting
  };

  // Function to handle table selection
  const handleTableSelect = async (table) => {
    if (!table || !table.id) {
      setMessage('Invalid table selected');
      return;
    }

    setSelectedTable(table);
    setActiveTable(table.id);
    
    // Check if this table has an existing order (passed from TablesPage)
    if (table.orderId) {
      // Find the order data to show in modal
      const existingOrder = orders?.find(order => order.id === table.orderId);
      
      if (existingOrder) {
        setSelectedOrderForModal(existingOrder);
        setShowOrderModal(true);
        setMessage(`Table ${table.number} selected. Viewing existing order.`);
      } else {
        // Fallback to page redirect if order not found in current state
        setSelectedOrderId(table.orderId);
        setCurrentPage('orderDetails');
        setMessage(`Table ${table.number} selected. Viewing existing order.`);
      }
      return;
    }
    
    // FALLBACK: If no orderId but table status indicates ordering, try to find the order
    if (table.status === 'ordering' || table.status === 'ready_to_pay') {
      // Try to find order by table number
      const orderForTable = orders?.find(order => {
        const orderTableNumber = order.table_number || order.table || order.table_id;
        const tableNumber = table.number || table.id;
        return orderTableNumber == tableNumber;
      });
      
      if (orderForTable) {
        setSelectedOrderForModal(orderForTable);
        setShowOrderModal(true);
        setMessage(`Table ${table.number} selected. Viewing existing order.`);
        return;
      }
    }
    
    // Check if there's already an open order for this table
    try {
      // First check if there's an active table
      if (activeTableId === table.id) {
        // Then try to find in orders to get table number
        const orderWithTable = orders?.find(order =>
          order.table === table.id || order.branch === table.id
        );
        
        if (orderWithTable) {
          // Show order in modal instead of redirecting
          setSelectedOrderForModal(orderWithTable);
          setShowOrderModal(true);
          setMessage(`Table ${table.number} selected. Viewing existing order.`);
          return;
        }
      }
      
      // Check if table can accept new orders before going to menu
      if (isTableOrdering(table.id)) {
        setMessage(`Table ${table.number} already has an active order. Please edit the existing order instead.`);
        return;
      }
      
      // If no existing order and table can accept orders, proceed to menu
      setCurrentPage('menu');
      setMessage(`Table ${table.number} selected. Ready to take orders.`);
      
    } catch (error) {
      // Check if table can accept new orders before going to menu
      if (isTableOrdering(table.id)) {
        setMessage(`Table ${table.number} already has an active order. Please edit the existing order instead.`);
        return;
      }
      
      setCurrentPage('menu');
      setMessage(`Table ${table.number} selected. Ready to take orders.`);
    }
  };

  // Function to check if table can accept new orders
  const canTableAcceptNewOrder = (tableId) => {
    return !isTableOrdering(tableId);
  };

  const handleNavigate = (page) => {
    if (page === 'order') {
      setCurrentPage('orderDetails');
      return;
    }
    if (page === 'tables' || page === 'menu') {
      setSelectedOrderId(null);
      setEditingOrderId(null);
    }
    
    if (page === 'profile') {
      setCurrentPage(page);
      setMessage('');
      return;
    }
    
    setCurrentPage(page);
    // Don't clear selectedTable when navigating to tables - it should be preserved
    // setSelectedTable(null);
  };

  const handleOrder = async () => {
    let tableToUse = selectedTable;
    if (!tableToUse && activeTableId) {
      tableToUse = getTableInfo(activeTableId);
    }
    if (!tableToUse || !tableToUse.id) {
      setMessage('No valid table selected. Please select a table first.');
      setCurrentPage('tables');
      return;
    }

    // Check if table is already in ordering status
    if (isTableOrdering(tableToUse.id)) {
      setMessage('This table already has an active order. Please edit the existing order instead.');
      return;
    }

    const newOrderData = {
      table: tableToUse.id,
      items: cartItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        item_type: item.item_type || 'food',
        status: item.status
      })),
      waiter_username: user?.username,
      waiter_table_number: tableToUse?.number
    };
    
    try {
      const newOrderId = await placeOrder(newOrderData);
      
      if (!newOrderId) {
        throw new Error('Failed to place order.');
      }
      setSelectedOrderId(newOrderId);
      setMessage('Order placed successfully!');
      
      // Refresh orders and tables after placing new order
      await refreshAll();
    } catch (error) {
      console.error('Order submission error:', error);
      setMessage(error.message || 'There was an issue placing your order.');
    }
    setEditingOrderId(null);
    setCurrentPage('orderDetails');
  };

  const handleBackFromMenu = () => {
    setCurrentPage('tables');
    setSelectedTable(null);
    setEditingOrderId(null);
  };

  const handleClearCart = () => {
    if (editingOrderId) {
      deleteOrder(editingOrderId);
      setSelectedOrderId(null);
      setEditingOrderId(null);
      setMessage('Order removed due to cart clear during edit.');
      setCurrentPage('tables');
    } else {
      clearCart();
      setMessage('Cart cleared.');
    }
  };

  const handleEditOrder = (orderToEdit) => {
    if (orderToEdit) {
      // Determine the table ID - check both branch and table fields
      const tableId = orderToEdit.branch || orderToEdit.table;
      
      if (!tableId) {
        console.error("Cannot edit order: order has no table or branch information.", orderToEdit);
        setMessage("Could not edit the selected order - missing table information.");
        return;
      }
      
      // Create a proper table object for the order being edited
      const tableForEditing = getTableInfo(tableId);
      if (orderToEdit.table_number) {
        tableForEditing.number = orderToEdit.table_number; // Use the actual table number from order
      }
      
      // Set the table and editing state first
      setSelectedTable(tableForEditing);
      setActiveTable(tableId);
      setEditingOrderId(orderToEdit.id);
      setSelectedOrderId(null);
      
      // Load editing items directly without clearing cart first
      // This ensures the items are loaded properly
      loadCartForEditing(tableId, orderToEdit.items);
      
      // Navigate to menu page
      setCurrentPage('menu');
    } else {
      console.error("Cannot edit order: order data is missing.", orderToEdit);
      setMessage("Could not edit the selected order.");
    }
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrderId(orderId);
    setEditingOrderId(null);
    setCurrentPage('orderDetails');
  };

  const handleOrderDeleted = () => {
    setCurrentPage('tables');
    setSelectedTable(null);
    setActiveTable(null);
    setSelectedOrderId(null);
    setEditingOrderId(null);
    setMessage('Order deleted successfully.');
    
    // Refresh orders and tables after deleting order
    refreshAll();
  };

  // Handle when order is done (Done button clicked)
  const handleOrderDone = () => {
    // Close the modal
    setShowOrderModal(false);
    setSelectedOrderForModal(null);
    
    // Navigate to tables page
    setCurrentPage('tables');
    setSelectedOrderId(null);
    setEditingOrderId(null);
    
    // Show success message
    setMessage('Order completed successfully! Redirected to tables.');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleAddItems = async (newItems) => {
    try {
      // This will be handled by the OrderDetails component
      // The backend API will create order additions
      setMessage('Items added to order successfully!');
      
      // Refresh the orders list and tables
      await refreshAll();
      
    } catch (error) {
      console.error('Error adding items to order:', error);
      setMessage('Failed to add items to order.');
    }
  };

  // Navigation items for sidebar
  const navItems = [
    { label: 'Tables', icon: <FaTable />, page: 'tables', color: 'blue' },
    { label: 'Menu', icon: <FaUtensils />, page: 'menu', color: 'emerald' },
    { label: 'Orders', icon: <FaClipboardList />, page: 'orderDetails', color: 'indigo' },
    { label: 'Profile', icon: <FaUser />, page: 'profile', color: 'slate' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple, Clean Header - Mobile Optimized */}
      <header className="bg-white border-b border-gray-200 px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <FaTable className="text-white text-sm sm:text-base" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-semibold text-gray-900">Waiter Dashboard</h1>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Manage tables & orders</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={refreshAll}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
              title="Refresh all data"
            >
              🔄 Refresh
            </button>
            <div className="text-xs sm:text-sm text-gray-600">
              {user?.username || 'Waiter'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile Optimized */}
      <main className="p-2 sm:p-4 pb-20 sm:pb-6">
        {/* Success Message - Mobile Optimized */}
        {message && (
          <div className="mb-3 sm:mb-4 bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3">
            <div className="flex items-center gap-2 text-green-800">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs sm:text-sm">{message}</span>
            </div>
          </div>
        )}

        {/* Content Area - Mobile Optimized */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {currentPage === 'tables' && (
            <div className="p-2 sm:p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Tables</h2>
                <button
                  onClick={refreshAll}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                  title="Refresh tables and orders"
                >
                  🔄 Refresh All
                </button>
              </div>
              <TablesPage onSelectTable={handleTableSelect} />
            </div>
          )}
          
          {currentPage === 'menu' && (
            <div className="p-2 sm:p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Menu</h2>
                <button
                  onClick={refreshAll}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                  title="Refresh menu and orders"
                >
                  🔄 Refresh All
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="order-2 sm:order-1">
                  <MenuPage table={selectedTable || (activeTableId ? getTableInfo(activeTableId) : null)} onBack={handleBackFromMenu} onOrder={handleOrder} />
                </div>
                <div className="order-1 sm:order-2">
                  <Cart 
                    onOrder={handleOrder} 
                    onClearCart={handleClearCart}
                    onPrintOrder={handlePrintOrder}
                    table={selectedTable || (activeTableId ? getTableInfo(activeTableId) : null)}
                    isTableOrdering={selectedTable ? isTableOrdering(selectedTable.id) : (activeTableId ? isTableOrdering(activeTableId) : false)}
                  />
                </div>
              </div>
            </div>
          )}
          
          {currentPage === 'orderDetails' && (
            <div className="p-2 sm:p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Orders</h2>
                <button
                  onClick={refreshAll}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                  title="Refresh orders and tables"
                >
                  🔄 Refresh All
                </button>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-4">
                <OrderList
                  onSelectOrder={handleShowOrderModal}
                  selectedOrderId={selectedOrderId}
                />
              </div>
            </div>
          )}
          
          {currentPage === 'profile' && (
            <div className="p-2 sm:p-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Profile</h2>
              <WaiterProfile onBack={() => handleNavigate('tables')} />
            </div>
          )}
        </div>
      </main>

      {/* Order Details Modal - Mobile Optimized */}
      {showOrderModal && selectedOrderForModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header - Mobile Optimized */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                  Order Details - Table {selectedOrderForModal.table_number || selectedOrderForModal.table || 'Unknown'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  Order #{selectedOrderForModal.order_number || selectedOrderForModal.id}
                </p>
              </div>
              <button
                onClick={handleCloseOrderModal}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 ml-2 flex-shrink-0"
              >
                <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Modal Content - Mobile Optimized */}
            <div className="p-3 sm:p-4">
              <OrderDetails
                selectedOrderId={selectedOrderForModal.id}
                onEditOrder={handleEditOrder}
                onOrderDeleted={handleOrderDeleted}
                onAddItems={handleAddItems}
                onDone={handleOrderDone}
              />
            </div>

            {/* Modal Footer - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 p-3 sm:p-4 border-t border-gray-200">
              <button
                onClick={handleOrderDone}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
              >
                <FaCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Done - Return to Tables</span>
                <span className="sm:hidden">Done</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile-Optimized Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="flex items-center justify-around py-2 sm:py-3">
          {navItems.map(({ label, icon, page, color }) => (
            <button
              key={page}
              onClick={() => handleNavigate(page)}
              className={`flex flex-col items-center gap-1 px-2 sm:px-3 py-2 rounded-lg transition-all duration-200 min-w-0 ${
                currentPage === page
                  ? `text-${color}-600 bg-${color}-50`
                  : "text-gray-500 hover:text-gray-700"
              }`}
              title={`Go to ${label}`}
            >
              <span className="text-lg sm:text-xl">{icon}</span>
              <span className="text-xs font-medium truncate max-w-full">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

const WaiterDashboardWrapper = () => (
  <CartProvider>
    <WaiterDashboard />
  </CartProvider>
);

export default WaiterDashboard;