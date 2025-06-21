import React, { useState } from 'react';
import Navbar from '../../components/Navbar.jsx';
import TablesPage, { tables } from './tables/TablesPage.jsx';
import MenuPage from './menu/MenuPage.jsx';
import Cart from '../../components/Cart/Cart.jsx';
import { CartProvider, useCart } from '../../context/CartContext.jsx';
import OrderDetails from './order/OrderDetails.jsx';
import OrderList from './order/OrderList.jsx';
import '../../App.css';
import { useLocation } from 'react-router-dom';

const WaiterDashboard = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const startPage = params.get('start') || 'tables';

  const [currentPage, setCurrentPage] = useState(startPage); // 'tables', 'menu', or 'orderDetails'
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
    clearCart 
  } = useCart();

  const handleNavigate = (page) => {
    if (page === 'orderDetails') {
      if (!activeTableId && !selectedOrderId) {
        setMessage('Please select a table or an existing order to view order details.');
        setCurrentPage('tables');
        return;
      }
    } else if (page === 'tables' || page === 'menu') {
      setSelectedOrderId(null);
      setEditingOrderId(null);
    }
    setCurrentPage(page);
    if (page === 'tables') setSelectedTable(null);
  };

  const handleTableSelect = (table) => {
    setSelectedTable(table);
    setActiveTable(table.id);
    setCurrentPage('menu');
    setMessage('');
    setSelectedOrderId(null);
    setEditingOrderId(null);
  };

  const handleOrder = () => {
    if (!activeTableId) {
      setMessage('Please select a table first to place an order.');
      setCurrentPage('tables');
      return;
    }
    if (!cartItems.length) {
      setMessage('Your cart is empty. Please add items before placing an order.');
      setCurrentPage('menu');
      return;
    }

    if (editingOrderId) {
      if (!cartItems.length) {
        deleteOrder(editingOrderId);
        setSelectedOrderId(null);
        setMessage('Order deleted due to empty cart.');
      } else {
        updateOrder(editingOrderId, cartItems);
        setSelectedOrderId(editingOrderId);
      }
    } else {
      const newOrderId = placeOrder();
      if (!newOrderId) {
        setMessage('Failed to place order. Please try again.');
        return;
      }
      setSelectedOrderId(newOrderId);
    }

    setEditingOrderId(null);
    setCurrentPage('orderDetails');
    setMessage('');
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
      loadCartForEditing(orderToEdit.tableId, orderToEdit.items);
      setSelectedTable(tables.find(table => table.id === orderToEdit.tableId));
      setActiveTable(orderToEdit.tableId);
      setEditingOrderId(orderToEdit.id);
      setSelectedOrderId(null);
    }
    setCurrentPage('menu');
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

  return (
    <div className="app-container">
      <Navbar onNavigate={handleNavigate} />
      <div className="main-content white-bg">
        {message && (
          <div className="app-message" style={{ color: 'red', textAlign: 'center', padding: '10px' }}>
            {message}
          </div>
        )}
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
            <OrderList
              onSelectOrder={handleSelectOrder}
              selectedOrderId={selectedOrderId}
            />
            <OrderDetails
              onEditOrder={handleEditOrder}
              selectedOrderId={selectedOrderId}
              onOrderDeleted={handleOrderDeleted}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const WaiterDashboardWrapper = () => (
  <CartProvider>
    <WaiterDashboard />
  </CartProvider>
);

export default WaiterDashboardWrapper;
