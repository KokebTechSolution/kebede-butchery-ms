import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar.jsx';
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

  const handleTableSelect = (table) => {
    setSelectedTable(table);
    setActiveTable(table.id);
    setCurrentPage('menu');
    setMessage('');
    setSelectedOrderId(null);
    setEditingOrderId(null);

    // Always check for open order for this table (not printed)
    const tableOrders = (orders || []).filter(
      o => (o.table === table.id || o.table_number === table.number)
    );
    const openOrder = tableOrders.find(o => o.cashier_status !== 'printed');
    const lastOrder = tableOrders.length > 0 ? tableOrders[tableOrders.length - 1] : null;
    if (openOrder) {
      // Load open order's items into cart for editing
      clearCart();
      loadCartForEditing(table.id, openOrder.items);
      setEditingOrderId(openOrder.id);
      console.log('[DEBUG] Editing open order:', openOrder.id, 'Status:', openOrder.cashier_status);
    } else {
      clearCart();
      setEditingOrderId(null);
      if (lastOrder && lastOrder.cashier_status === 'printed') {
        setMessage('Last order is printed. Creating a new order.');
        console.log('[DEBUG] Last order is printed. New order will be created.');
      }
    }
  };

  const handleOrder = async () => {
    if (!editingOrderId && (!selectedTable || !selectedTable.id)) {
      setMessage('You must select a table before placing an order.');
      setCurrentPage('tables');
      return;
    }
    if (!activeTableId) {
      setMessage('Please select a table first.');
      return;
    }

    if (cartItems.length === 0) {
      if (editingOrderId) {
        try {
          await axiosInstance.delete(`/orders/${editingOrderId}/`);
          deleteOrder(editingOrderId);
          setMessage('Order cancelled and deleted.');
        } catch (error) {
          console.error('Error deleting order:', error);
          setMessage('Failed to delete order from server.');
        }
        setEditingOrderId(null);
        setCurrentPage('tables');
        return;
      }
      setMessage('Your cart is empty.');
      return;
    }

    // Always check for open order before editing
    const tableOrders = (orders || []).filter(
      o => (o.table === selectedTable.id || o.table_number === selectedTable.number)
    );
    const openOrder = tableOrders.find(o => o.cashier_status !== 'printed');
    const lastOrder = tableOrders.length > 0 ? tableOrders[tableOrders.length - 1] : null;
    let editingOrder = null;
    if (editingOrderId) {
      editingOrder = orders.find(o => o.id === editingOrderId);
      if (editingOrder && editingOrder.cashier_status === 'printed') {
        setEditingOrderId(null);
        clearCart();
        setMessage('Last order is printed. Creating a new order.');
        console.log('[DEBUG] Last order is printed. New order will be created.');
      }
    }

    if (openOrder && editingOrderId && editingOrder && editingOrder.cashier_status !== 'printed') {
      // Logic for UPDATING an order
      const updatedOrderData = {
        items: cartItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          item_type: item.item_type || 'food'
        }))
      };
      try {
        const response = await axiosInstance.patch(`/orders/${editingOrderId}/`, updatedOrderData);
        const updatedOrder = response.data;
        updateOrder(editingOrderId, updatedOrder.items);
        setSelectedOrderId(editingOrderId);
        setMessage('Order updated successfully!');
        console.log('[DEBUG] Updated order:', editingOrderId);
      } catch (error) {
        console.error('Order update error:', error);
        setMessage('There was an issue updating your order.');
      }
    } else {
      // Logic for CREATING a new order
      const newOrderData = {
        table: selectedTable.id,
        items: cartItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          item_type: item.item_type || 'food'
        })),
        waiter_username: user?.username,
        waiter_table_number: selectedTable?.number
      };
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
    if (orderToEdit && orderToEdit.branch) {
      const tableId = orderToEdit.branch;
      clearCart();
      loadCartForEditing(tableId, orderToEdit.items);
      setSelectedTable(null);
      setActiveTable(tableId);
      setEditingOrderId(orderToEdit.id);
      setSelectedOrderId(null);
      setCurrentPage('menu');
    } else {
      console.error("Cannot edit order: order data is missing or has no branch.", orderToEdit);
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
              <MenuPage table={selectedTable} onBack={handleBackFromMenu} onOrder={handleOrder} />
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
        {currentPage === 'profile' && (
          <WaiterProfile onBack={() => handleNavigate('tables')} />
        )}
      </div>
    </div>
  );
};

const WaiterDashboardWrapper = () => (
  
    <WaiterDashboard />
  
);

export default WaiterDashboard;
