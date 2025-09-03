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

function mergeOrderItems(existingItems, cartItems) {
  // Keep all existing items (don't merge by name)
  const result = [...existingItems];
  
  // Add all cart items as separate items (don't merge quantities)
  cartItems.forEach(cartItem => {
    result.push({
      ...cartItem,
      status: 'pending'
    });
  });
  
  return result;
}

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
    
    // Check if we're coming from a print action
    const isFromPrint = sessionStorage.getItem('orderPrinted');
    if (isFromPrint) {
      sessionStorage.removeItem('orderPrinted'); // Clear it after use
      return 'orderDetails'; // Navigate to order list
    }
    
    return startPage;
  }); // 'tables', 'menu', or 'orderDetails'
  const [selectedTable, setSelectedTable] = useState(null);
  const [message, setMessage] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

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

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleNavigate = (page) => {
    if (page === 'order' || page === 'orderDetails') {
      setCurrentPage('orderDetails');
      setSelectedOrderId(null); // Clear selected order to show order list first
      setEditingOrderId(null);
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
    setMessage('');
    setSelectedOrderId(null);
    setEditingOrderId(null);

    // Always check for open order for this table (not printed)
    // Check both table.id and table_number for consistency
    const tableOrders = (orders || []).filter(
      o => (o.table === table.id || o.table_number === table.number || o.table_number === table.id)
    );
    const openOrder = tableOrders.find(o => o.cashier_status !== 'printed');
    const lastOrder = tableOrders.length > 0 ? tableOrders[tableOrders.length - 1] : null;
    
    if (openOrder) {
      // Fetch the latest order from backend before editing
      try {
        const response = await axiosInstance.get(`/orders/order-list/${openOrder.id}/`);
        const latestOrder = response.data;
        clearCart();
        loadCartForEditing(table.id, latestOrder.items);
        setEditingOrderId(openOrder.id);
        console.log('[DEBUG] Editing open order:', openOrder.id, 'Status:', openOrder.cashier_status, 'Table:', table.id);
      } catch (error) {
        console.error('Failed to fetch latest order for editing:', error);
        // Fallback to cached items if fetch fails
        clearCart();
        loadCartForEditing(table.id, openOrder.items);
        setEditingOrderId(openOrder.id);
      }
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
          await axiosInstance.delete(`/orders/order-list/${editingOrderId}/`);
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
      o => (o.table === selectedTable.id || o.table_number === selectedTable.number || o.table_number === selectedTable.id)
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

    // --- DON'T MERGE CART ITEMS - KEEP THEM SEPARATE ---
    function mergeCartItems(items) {
      // Don't merge quantities - keep items separate
      return items;
    }
    const mergedCartItems = mergeCartItems(cartItems);
    // --------------------------------------------------

    if (openOrder && editingOrderId && editingOrder && editingOrder.cashier_status !== 'printed') {
      // --- MERGE CART ITEMS WITH EXISTING ORDER ITEMS ---
      // 1. Start with all existing items (from editingOrder.items)
      // 2. For each item in existing items:
      //    - If it is accepted/rejected and not in cartItems, KEEP it
      //    - If it is pending and not in cartItems, REMOVE it
      //    - If it is in cartItems, use the cart version (updated quantity/status)
      // 3. For each item in cartItems not in existing items, ADD it
      const mergedItems = [];
      const cartMap = new Map();
      cartItems.forEach(item => {
        cartMap.set(item.id, item);
      });
      // Add/merge existing items
      editingOrder.items.forEach(existingItem => {
        const cartItem = cartMap.get(existingItem.id);
        if (cartItem) {
          // Use cart version (updated quantity/status)
          if (cartItem.quantity > 0) {
            mergedItems.push({ ...cartItem });
          }
          cartMap.delete(existingItem.id);
        } else {
          // Not in cart
          if (existingItem.status === 'accepted' || existingItem.status === 'rejected') {
            // Always keep accepted/rejected items, even if cart is empty
            mergedItems.push({ ...existingItem });
          }
          // If pending and not in cart, remove (do not add)
        }
      });
      // If cart is empty, still keep accepted/rejected items
      if (cartItems.length === 0) {
        editingOrder.items.forEach(existingItem => {
          if ((existingItem.status === 'accepted' || existingItem.status === 'rejected') && !mergedItems.find(i => i.id === existingItem.id)) {
            mergedItems.push({ ...existingItem });
          }
        });
      }
      // Add new items from cart that weren't in existing items
      cartMap.forEach(item => {
        if (item.quantity > 0) {
          mergedItems.push({ ...item });
        }
      });
      const updatedOrderData = {
        items: mergedItems.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          item_type: item.item_type || 'food',
          status: item.status // preserve status
        }))
      };
      console.log('PATCH payload (merged):', updatedOrderData);
      try {
        const response = await axiosInstance.patch(`/orders/order-list/${editingOrderId}/`, updatedOrderData);
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
        items: mergedCartItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          item_type: item.item_type || 'food',
          status: item.status // <-- preserve status!
        })),
        waiter_username: user?.username,
        waiter_table_number: selectedTable?.number
      };
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
    // Only clear the selected order, stay in orders section
    setSelectedOrderId(null);
    setEditingOrderId(null);
    setMessage('Order deleted successfully.');
    // Don't change currentPage - stay in orderDetails
    // Don't clear selectedTable or activeTable - keep them
  };

  const handleCloseOrderDetails = () => {
    // Just close the order details view, stay in orders section
    setSelectedOrderId(null);
    setEditingOrderId(null);
    setMessage('');
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <div className="sidebar">
        <Navbar onNavigate={handleNavigate} />
      </div>
      
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
              onClose={handleCloseOrderDetails}
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
