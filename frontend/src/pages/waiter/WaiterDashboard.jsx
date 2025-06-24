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

  const handleOrder = async () => {
    if (!activeTableId) {
      setMessage('Please select a table first.');
      return;
    }

    if (cartItems.length === 0) {
      // If editing, deleting the last item should DELETE the order
      if (editingOrderId) {
        try {
          const response = await fetch(`/api/orders/${editingOrderId}/`, { method: 'DELETE' });
          if (!response.ok) { throw new Error('Failed to delete order'); }
          deleteOrder(editingOrderId); // Update local state
          setMessage('Order cancelled and deleted.');
        } catch (error) {
          console.error("Error deleting order:", error);
          setMessage("Failed to delete order from server.");
        }
        setEditingOrderId(null);
        setCurrentPage('tables');
        return;
      }
      setMessage('Your cart is empty.');
      return;
    }

    // Determine if we are updating an existing order or creating a new one
    if (editingOrderId) {
      // Logic for UPDATING an order
      const updatedOrderData = {
        items: cartItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          item_type: 'food' 
        }))
      };

      try {
        const response = await fetch(`/api/orders/${editingOrderId}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedOrderData)
        });

        if (!response.ok) {
          throw new Error('Failed to update order');
        }
        
        const updatedOrder = await response.json();
        updateOrder(editingOrderId, updatedOrder.items);
        setSelectedOrderId(editingOrderId);
        setMessage('Order updated successfully!');

      } catch (error) {
        console.error('Order update error:', error);
        setMessage('There was an issue updating your order.');
      }

    } else {
      // Logic for CREATING a new order
      const newOrderData = {
        branch: 1, 
        status: 'pending',
        items: cartItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          item_type: 'food'
        }))
      };

      try {
        const response = await fetch('/api/orders/order-list/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newOrderData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to place order: ${JSON.stringify(errorData)}`);
        }

        const newOrder = await response.json();
        placeOrder(newOrder);
        setSelectedOrderId(newOrder.id);
        setMessage('Order placed successfully!');

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

      loadCartForEditing(tableId, orderToEdit.items);
      setSelectedTable(tables.find(table => table.id === tableId));
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
