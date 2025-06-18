import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import TablesPage, { tables } from './pages/waiter/tables/TablesPage.jsx';
import MenuPage from './pages/waiter/menu/MenuPage.jsx';
import Cart from './components/Cart/Cart.jsx';
import { CartProvider, useCart } from './context/CartContext';
import OrderDetails from './pages/waiter/order/OrderDetails.jsx';
import OrderList from './pages/waiter/order/OrderList.jsx';
import './App.css';

// New component to encapsulate logic that uses CartContext
const MainAppLogic = ({ currentPage, setCurrentPage, selectedTable, setSelectedTable }) => {
  const [message, setMessage] = useState(''); // State for messages
  const [selectedOrderId, setSelectedOrderId] = useState(null); // New state for selected order
  const [editingOrderId, setEditingOrderId] = useState(null); // State to track order being edited

  const { 
    activeTableId, 
    setActiveTable, 
    placeOrder, 
    cartItems, 
    loadCartForEditing, 
    updateOrder, 
    deleteOrder, 
    clearCart 
  } = useCart();

  useEffect(() => {
    // No specific effect for current page or stored order ID needed here yet
  }, []);

  const handleNavigate = (page) => {
    if (page === 'orderDetails') {
      if (!activeTableId && !selectedOrderId) {
        setMessage('Please select a table or an existing order to view order details.');
        setCurrentPage('tables');
        return;
      }
    } else if (page === 'tables' || page === 'menu') {
      setSelectedOrderId(null); // Clear selected order when navigating away from order details
      setEditingOrderId(null); // Clear editing order when navigating away from menu/order details
    }
    setCurrentPage(page);
    if (page === 'tables') {
      setSelectedTable(null);
    }
  };

  const handleTableSelect = (table) => {
    setSelectedTable(table);
    setActiveTable(table.id); // Explicitly set active table in context
    setCurrentPage('menu');
    setMessage(''); // Clear message on table selection
    setSelectedOrderId(null); // Ensure no order is pre-selected when selecting a new table
    setEditingOrderId(null); // Clear editing order when selecting a new table
  };

  const handleOrder = () => {
    if (!activeTableId) {
      setMessage('Please select a table first to place an order.');
      setCurrentPage('tables');
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      setMessage('Your cart is empty. Please add items before placing an order.');
      setCurrentPage('menu');
      return;
    }

    console.log('Attempting to place order for table:', activeTableId, 'with items:', cartItems);

    if (editingOrderId) {
      if (cartItems.length === 0) {
        // If we are editing an order and the cart is now empty, delete the order
        deleteOrder(editingOrderId);
        setSelectedOrderId(null); // Clear selected order
        setMessage('Order successfully deleted due to empty cart.');
      } else {
        updateOrder(editingOrderId, cartItems); // Update existing order
        setSelectedOrderId(editingOrderId); // Keep the updated order selected
      }
    } else {
      const newOrderId = placeOrder(); // Place new order
      if (!newOrderId) {
        setMessage('Failed to place order. Please try again.');
        return;
      }
      setSelectedOrderId(newOrderId);
    }

    setEditingOrderId(null); // Reset editing state after action
    setCurrentPage('orderDetails');
    setMessage('');
  };

  const handleBackFromMenu = () => {
    setCurrentPage('tables');
    setSelectedTable(null);
    setEditingOrderId(null); // Also clear editing state when going back from menu
  };

  const handleClearCart = () => {
    if (editingOrderId) {
      // If we are editing an existing order and the user clicks 'Clear Cart'
      // it implies they want to discard changes AND remove the original order
      deleteOrder(editingOrderId); // Delete the original order
      setSelectedOrderId(null); // No order is selected anymore
      setEditingOrderId(null); // Reset editing state
      setMessage('Order removed due to cart clear during edit.');
      setCurrentPage('tables'); // Navigate back to tables as the order is gone
    } else {
      // If not editing, just clear the active table's cart
      clearCart();
      setMessage('Cart cleared.');
    }
  };

  const handleEditOrder = (orderToEdit) => {
    if (orderToEdit) {
      loadCartForEditing(orderToEdit.tableId, orderToEdit.items);
      setSelectedTable(tables.find(table => table.id === orderToEdit.tableId)); // Set selected table
      setActiveTable(orderToEdit.tableId); // Ensure active table is set in context
      setEditingOrderId(orderToEdit.id); // Set the order being edited
      setSelectedOrderId(null); // Clear selected order ID as we are now editing the active cart
    }
    setCurrentPage('menu');
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrderId(orderId);
    setEditingOrderId(null); // Clear editing state when selecting a different order
    setCurrentPage('orderDetails');
  };

  const handleOrderDeleted = () => {
    setCurrentPage('tables');
    setSelectedTable(null);
    setActiveTable(null); // Clear active table in context
    setSelectedOrderId(null);
    setEditingOrderId(null);
    setMessage('Order deleted successfully.'); // Optional: show a confirmation message
  };

  return (
    <div className="app-container">
      <Navbar onNavigate={handleNavigate} />
      <div className="main-content white-bg">
        {message && <div className="app-message" style={{ color: 'red', textAlign: 'center', padding: '10px' }}>{message}</div>}
        {currentPage === 'tables' && (
          <TablesPage onSelectTable={handleTableSelect} />
        )}
        {currentPage === 'menu' && (
          <div className="menu-cart-container">
            <div className="menu-section">
              <MenuPage table={selectedTable} onBack={handleBackFromMenu} />
            </div>
            <div className="cart-section">
              <Cart onOrder={handleOrder} onClearCart={handleClearCart} />
            </div>
          </div>
        )}
        {currentPage === 'orderDetails' && (
          <div className="order-details-layout">
            <OrderList onSelectOrder={handleSelectOrder} selectedOrderId={selectedOrderId} />
            <OrderDetails onEditOrder={handleEditOrder} selectedOrderId={selectedOrderId} onOrderDeleted={handleOrderDeleted} />
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  const [currentPage, setCurrentPage] = useState('tables'); // 'tables', 'menu', or 'order'
  const [selectedTable, setSelectedTable] = useState(null);

  return (
    <CartProvider initialActiveTableId={selectedTable ? selectedTable.id : null}>
      <MainAppLogic
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        selectedTable={selectedTable}
        setSelectedTable={setSelectedTable}
      />
    </CartProvider>
  );
}

export default App;
