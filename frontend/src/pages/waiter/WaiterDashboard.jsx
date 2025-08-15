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
import { FaTable, FaUtensils, FaClipboardList, FaUser, FaTimes, FaPrint } from 'react-icons/fa';

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

  // Function to fetch tables data
  const fetchTablesData = async () => {
    try {
      const response = await axiosInstance.get('/branches/tables/');
      setTablesData(response.data);
      console.log('[DEBUG] Tables data fetched:', response.data);
    } catch (error) {
      console.error('[DEBUG] Failed to fetch tables data:', error);
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

  // Ensure selectedTable is always available when on menu page
  useEffect(() => {
    if (currentPage === 'menu' && activeTableId && !selectedTable) {
      console.log('[DEBUG] Restoring selectedTable from activeTableId:', activeTableId);
      const tableInfo = getTableInfo(activeTableId);
      console.log('[DEBUG] Restored table info:', tableInfo);
      setSelectedTable(tableInfo);
    }
  }, [currentPage, activeTableId, selectedTable]);

  // Debug logging for state changes
  useEffect(() => {
    console.log('[DEBUG] State changed:', {
      currentPage,
      selectedTable,
      activeTableId,
      editingOrderId
    });
  }, [currentPage, selectedTable, activeTableId, editingOrderId]);

  // Fetch tables data on component mount
  useEffect(() => {
    fetchTablesData();
  }, []);

  // Function to print order and send to cashier
  const handlePrintOrder = async (orderId) => {
    try {
      setMessage('Sending order to cashier...');
      
      // Update order status to printed and send to cashier
      const response = await axiosInstance.patch(`/orders/order-list/${orderId}/`, {
        cashier_status: 'printed',
        status: 'ready_to_pay'
      });
      
      if (response.status === 200) {
        setMessage('Order sent to cashier successfully!');
        // Refresh orders list
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
  };

  // Function to handle table selection
  const handleTableSelect = async (table) => {
    console.log('[DEBUG] handleTableSelect called with:', table);
    
    if (!table || !table.id) {
      setMessage('Invalid table selected');
      return;
    }

    setSelectedTable(table);
    setActiveTable(table.id);
    
    // Check if there's already an open order for this table
    try {
      // First check if there's an active table
      if (activeTableId === table.id) {
        // Then try to find in orders to get table number
        const orderWithTable = orders?.find(order =>
          order.table === table.id || order.branch === table.id
        );
        
        if (orderWithTable) {
          console.log('[DEBUG] Found existing order for table:', orderWithTable);
          setSelectedOrderId(orderWithTable.id);
          setCurrentPage('orderDetails');
          return;
        }
      }
      
      // If no existing order, proceed to menu
      setCurrentPage('menu');
      setMessage(`Table ${table.number} selected. Ready to take orders.`);
      
    } catch (error) {
      console.error('[DEBUG] Error checking existing orders:', error);
      setCurrentPage('menu');
      setMessage(`Table ${table.number} selected. Ready to take orders.`);
    }
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
      setCurrentPage('profile');
      setMessage('');
      return;
    }
    
    setCurrentPage(page);
    if (page === 'tables') setSelectedTable(null);
  };

  const handleOrder = async () => {
    if (!selectedTable || !selectedTable.id) {
      setMessage('No valid table selected. Please select a table first.');
      setCurrentPage('tables');
      return;
    }
    
    const newOrderData = {
      table: selectedTable.id,
      items: cartItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        item_type: item.item_type || 'food',
        status: item.status // <-- preserve status!
      })),
      waiter_username: user?.username,
      waiter_table_number: selectedTable?.number
    };
    
    console.log('[DEBUG] New order data:', newOrderData);
    console.log('POST payload:', newOrderData); // <-- log payload
    try {
      const newOrderId = await placeOrder(newOrderData);
      if (!newOrderId) {
        throw new Error('Failed to place order.');
      }
      setSelectedOrderId(newOrderId);
      setMessage('Order placed successfully!');
      console.log('[DEBUG] Placed new order:', newOrderId);
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
    console.log('[DEBUG] handleEditOrder called with:', orderToEdit);
    
    if (orderToEdit) {
      // Determine the table ID - check both branch and table fields
      const tableId = orderToEdit.branch || orderToEdit.table;
      console.log('[DEBUG] Editing order for table:', tableId, 'Order ID:', orderToEdit.id);
      
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
      console.log('[DEBUG] Table for editing:', tableForEditing);
      
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
    
      console.log('[DEBUG] Order editing setup complete - editingOrderId:', orderToEdit.id, 'selectedTable:', tableForEditing);
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
  };

  const handleAddItems = async (newItems) => {
    try {
      console.log('[DEBUG] Adding items to order:', newItems);
      
      // This will be handled by the OrderDetails component
      // The backend API will create order additions
      setMessage('Items added to order successfully!');
      
      // Refresh the orders list
      // TODO: Implement order refresh logic
      
    } catch (error) {
      console.error('[DEBUG] Error adding items to order:', error);
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
          <div className="text-xs sm:text-sm text-gray-600">
            {user?.username || 'Waiter'}
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
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Tables</h2>
              <TablesPage onSelectTable={handleTableSelect} />
            </div>
          )}
          
          {currentPage === 'menu' && (
            <div className="p-2 sm:p-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Menu</h2>
              <div className="grid grid-cols-1 gap-4">
                <div className="order-2 sm:order-1">
                  <MenuPage table={selectedTable || (activeTableId ? getTableInfo(activeTableId) : null)} onBack={handleBackFromMenu} onOrder={handleOrder} />
                </div>
                <div className="order-1 sm:order-2">
                  <Cart 
                    onOrder={handleOrder} 
                    onClearCart={handleClearCart}
                    onPrintOrder={handlePrintOrder}
                  />
                </div>
              </div>
            </div>
          )}
          
          {currentPage === 'orderDetails' && (
            <div className="p-2 sm:p-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Orders</h2>
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
                  Order Details - Table {selectedOrderForModal.table_number || selectedOrderForModal.branch}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  Order ID: {selectedOrderForModal.id}
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
                onEditOrder={handleEditOrder}
                selectedOrderId={selectedOrderForModal.id}
                onOrderDeleted={handleOrderDeleted}
                onAddItems={handleAddItems}
                onPrintOrder={handlePrintOrder}
                isModal={true}
              />
            </div>

            {/* Modal Footer - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 p-3 sm:p-4 border-t border-gray-200">
              <button
                onClick={() => handleEditOrder(selectedOrderForModal)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                Edit Order
              </button>
              <button
                onClick={() => handlePrintOrder(selectedOrderForModal.id)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
              >
                <FaPrint className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Print & Send to Cashier</span>
                <span className="sm:hidden">Print</span>
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