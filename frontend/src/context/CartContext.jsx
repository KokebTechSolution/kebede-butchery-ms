import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext'; // Assuming AuthContext provides user info only
import axiosInstance from '../api/axiosInstance';

const CartContext = createContext();

// Utility to merge cart items by name, price, type, and status
function mergeCartItems(items) {
  // Safety check: handle undefined or null items
  if (!items || !Array.isArray(items)) {
    console.warn('[CartContext] mergeCartItems called with invalid items:', items);
    return [];
  }
  
  const merged = [];
  items.forEach(item => {
    const found = merged.find(i =>
      i.name === item.name &&
      i.price === item.price &&
      (i.item_type || 'food') === (item.item_type || 'food') &&
      i.status === item.status &&
      (i.id ? i.id === item.id : true) // Only merge if id matches, or if id is not present
    );
    if (found) {
      found.quantity += item.quantity;
    } else {
      merged.push({ ...item });
    }
  });
  return merged;
}

export const CartProvider = ({ children, initialActiveTableId }) => {
  const { isAuthenticated, user } = useAuth();
  const [tableCarts, setTableCarts] = useState(() => {
    try {
      const localData = localStorage.getItem('tableCarts');
      const parsedData = localData ? JSON.parse(localData) : {};

      // Sanitize data by removing icons from persisted data
      if (parsedData) {
        Object.keys(parsedData).forEach(tableId => {
          if (Array.isArray(parsedData[tableId])) {
            parsedData[tableId] = parsedData[tableId].map(item => {
              const { icon, ...rest } = item;
              return rest;
            });
          }
        });
      }
      return parsedData;

    } catch (error) {
      console.error("Could not parse or sanitize tableCarts from localStorage", error);
      return {};
    }
  });
  const [activeTableId, setActiveTableId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [refreshFlag, setRefreshFlag] = useState(0);

  // Fetch orders and filter them based on status and table availability
  const fetchAndFilterOrders = async () => {
    try {
      console.log('[CartContext] 🔄 Fetching and filtering orders...');
      // First, fetch all orders
      const response = await axiosInstance.get('/orders/order-list/');
      
      // Then fetch tables to check their status
      const tablesResponse = await axiosInstance.get('/branches/tables/');
      const tablesMap = {};
      tablesResponse.data.forEach(table => {
        tablesMap[table.number] = table.status || 'available';
      });
      
      // Filter orders to only include those that are active and from occupied tables
      const filteredOrders = response.data.filter(order => {
        const tableId = order.table?.toString() || '';
        const tableStatus = tablesMap[tableId] || 'available';
        const orderStatus = order.cashier_status?.toLowerCase() || '';
        
        // Only include orders that are not in a terminal state and from occupied tables
        const isActiveOrder = !['printed', 'ready_for_payment', 'completed', 'paid', 'cancelled'].includes(orderStatus);
        const isTableOccupied = ['occupied', 'ordering', 'ready_to_pay'].includes(tableStatus);
        
        return isActiveOrder && isTableOccupied;
      });
      
      console.log('[CartContext] ✅ Orders fetched and filtered:', filteredOrders.length);
      setOrders(filteredOrders);
    } catch (error) {
      console.error("Failed to fetch orders or tables:", error);
    }
  };

  // Function to refresh orders data
  const refreshOrders = useCallback(async () => {
    console.log('[CartContext] 🔄 Manual refresh triggered');
    setRefreshFlag(prev => prev + 1);
    await fetchAndFilterOrders();
  }, []);

  // Function to refresh tables data
  const refreshTables = useCallback(async () => {
    console.log('[CartContext] 🔄 Refreshing tables data...');
    try {
      const response = await axiosInstance.get('/branches/tables/');
      console.log('[CartContext] ✅ Tables data refreshed');
      return response.data;
    } catch (error) {
      console.error('[CartContext] ❌ Failed to refresh tables:', error);
      return null;
    }
  }, []);

  // Function to refresh everything (orders, tables, and cart)
  const refreshAll = useCallback(async () => {
    console.log('[CartContext] 🔄 Full refresh triggered');
    await Promise.all([
      fetchAndFilterOrders(),
      refreshTables()
    ]);
    setRefreshFlag(prev => prev + 1);
  }, [refreshTables]);

  // Fetch orders on mount and set up polling - ONLY when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Initial fetch only - no automatic polling
      fetchAndFilterOrders();
    }
  }, [isAuthenticated, user]);

  // Listen for refresh events from other components
  useEffect(() => {
    const handleRefreshOrders = () => {
      console.log('[CartContext] 📡 Received refreshOrders event');
      refreshOrders();
    };

    const handleRefreshAll = () => {
      console.log('[CartContext] 📡 Received refreshAll event');
      refreshAll();
    };

    // Add event listeners
    window.addEventListener('refreshOrders', handleRefreshOrders);
    window.addEventListener('refreshAll', handleRefreshAll);

    // Cleanup
    return () => {
      window.removeEventListener('refreshOrders', handleRefreshOrders);
      window.removeEventListener('refreshAll', handleRefreshAll);
    };
  }, [refreshOrders, refreshAll]);

  // Refresh orders when refreshFlag changes
  useEffect(() => {
    if (refreshFlag > 0) {
      fetchAndFilterOrders();
    }
  }, [refreshFlag]);

  useEffect(() => {
    try {
      localStorage.setItem('tableCarts', JSON.stringify(tableCarts));
    } catch (error) {
      console.error("Could not save tableCarts to localStorage", error);
    }
  }, [tableCarts]);

  useEffect(() => {
    if (initialActiveTableId) {
      setActiveTableId(initialActiveTableId);
      setTableCarts(prev => ({
        ...prev,
        [initialActiveTableId]: prev[initialActiveTableId] || []
      }));
      console.log('CartContext: Initial active table set to', initialActiveTableId);
    }
  }, [initialActiveTableId]);

  const setActiveTable = useCallback((tableId) => {
    console.log('CartContext: setActiveTable called with tableId:', tableId);
    setActiveTableId(tableId);
    setTableCarts(prev => {
      const newTableCarts = {
        ...prev,
        [tableId]: prev[tableId] || []
      };
      console.log('CartContext: Updated tableCarts:', newTableCarts);
      return newTableCarts;
    });
    console.log('CartContext: Active table set to', tableId);
  }, []);

  const cartItems = activeTableId ? (tableCarts[activeTableId] || []) : [];

  // Add useEffect to log cart changes
  useEffect(() => {
    console.log('CartContext: Cart items changed for table', activeTableId, ':', cartItems);
  }, [cartItems, activeTableId]);

  const addToCart = useCallback((item) => {
    if (!activeTableId) {
      console.warn('CartContext: addToCart called but activeTableId is null/undefined');
      return;
    }

    console.log('CartContext: addToCart called with item:', item, 'for table:', activeTableId);
    
    setTableCarts(prev => {
      const currentTableCart = prev[activeTableId] || [];
      
      // Check if item already exists in cart (by name and price)
      const existingItemIndex = currentTableCart.findIndex(cartItem => 
        cartItem.name === item.name && 
        cartItem.price === item.price &&
        cartItem.item_type === item.item_type
      );
      
      console.log('CartContext: Existing item index:', existingItemIndex);
      console.log('CartContext: Current cart items:', currentTableCart);
      
      let newTableCart;
      if (existingItemIndex >= 0) {
        // Item exists, increase quantity
        newTableCart = [...currentTableCart];
        const oldQuantity = newTableCart[existingItemIndex].quantity || 0;
        const newQuantity = oldQuantity + 1;
        newTableCart[existingItemIndex] = {
          ...newTableCart[existingItemIndex],
          quantity: newQuantity
        };
        console.log('CartContext: Increased quantity for existing item:', newTableCart[existingItemIndex], 'from', oldQuantity, 'to', newQuantity);
      } else {
        // New item, add with quantity 1
        const newItem = { 
          ...item, 
          id: Date.now() + Math.random(),
          quantity: 1  // Set default quantity to 1
        };
        newTableCart = [...currentTableCart, newItem];
        console.log('CartContext: Added new item to cart:', newItem);
      }
      
      const newTableCarts = { ...prev, [activeTableId]: newTableCart };
      console.log('CartContext: Updated tableCarts:', newTableCarts);
      return newTableCarts;
    });
    
    // Trigger refresh after adding item to cart
    setTimeout(() => refreshOrders(), 100);
  }, [activeTableId, refreshOrders]);

  const removeFromCart = useCallback((itemId) => {
    if (!activeTableId) {
      console.warn('CartContext: removeFromCart called but activeTableId is null/undefined');
      return;
    }

    console.log('CartContext: removeFromCart called with itemId:', itemId, 'for table:', activeTableId);
    
    setTableCarts(prev => {
      const currentTableCart = prev[activeTableId] || [];
      const updatedTableCart = currentTableCart.filter(item => item.id !== itemId);
      const newTableCarts = { ...prev, [activeTableId]: updatedTableCart };
      
      console.log('CartContext: Removed item', itemId, 'for table', activeTableId, '. New cart:', updatedTableCart);
      return newTableCarts;
    });
    
    // Trigger refresh after removing item from cart
    setTimeout(() => refreshOrders(), 100);
  }, [activeTableId, refreshOrders]);

  const updateQuantity = useCallback((itemId, quantity) => {
    if (!activeTableId) {
      console.warn('CartContext: updateQuantity called but activeTableId is null/undefined');
      return;
    }

    console.log('CartContext: updateQuantity called with itemId:', itemId, 'quantity:', quantity);
    console.log('CartContext: Current cart items:', cartItems);
    
    setTableCarts(prev => {
      const currentTableCart = prev[activeTableId] || [];
      console.log('CartContext: Current table cart:', currentTableCart);
      
      const updatedTableCart = currentTableCart.map(item => {
        if (item.id === itemId) {
          console.log('CartContext: Found matching item, updating quantity from', item.quantity, 'to', quantity);
          return { ...item, quantity: Math.max(0, quantity) };
        }
        return item;
      }).filter(item => item.quantity > 0); // Remove items with 0 quantity
      
      const newTableCarts = { ...prev, [activeTableId]: updatedTableCart };
      
      console.log('CartContext: Updated quantity for item', itemId, 'to', quantity, 'for table', activeTableId, '. New cart:', updatedTableCart);
      return newTableCarts;
    });
    
    // Trigger refresh after updating quantity
    setTimeout(() => refreshOrders(), 100);
  }, [activeTableId, cartItems, refreshOrders]);

  const clearCart = useCallback(() => {
    if (!activeTableId) {
      console.warn('CartContext: clearCart called but activeTableId is null/undefined');
      return;
    }

    console.log('CartContext: Cart cleared for table', activeTableId);
    
    setTableCarts(prev => {
      const newTableCarts = { ...prev, [activeTableId]: [] };
      return newTableCarts;
    });
    
    // Trigger refresh after clearing cart
    setTimeout(() => refreshOrders(), 100);
  }, [activeTableId, refreshOrders]);

  const placeOrder = async (orderData) => {
    console.log('[CartContext] placeOrder called with:', orderData);
    
    try {
      // First check if table is available for new orders
      console.log('[CartContext] Checking table availability for table:', orderData.table);
      console.log('[CartContext] Making request to:', `/orders/check-table-availability/?table_id=${orderData.table}`);
      
      const availabilityResponse = await axiosInstance.get(`/orders/check-table-availability/?table_id=${orderData.table}`);
      console.log('[CartContext] Table availability response:', availabilityResponse.data);
      
      if (!availabilityResponse.data.can_accept_new_order) {
        const errorMessage = availabilityResponse.data.message || 'Table is not available for new orders';
        console.log('[CartContext] Table not available:', errorMessage);
        throw new Error(errorMessage);
      }
      
      console.log('[CartContext] Table is available, creating order...');
      
      // Create the order payload
      const payload = {
        table: orderData.table,
        created_by: orderData.created_by, // Add the user ID for created_by field
        items: orderData.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          item_type: item.item_type || 'food',
          status: item.status || 'pending'
        })),
        waiter_username: orderData.waiter_username,
        waiter_table_number: orderData.waiter_table_number,
        payment_option: orderData.payment_option || 'cash'
      };
      
      console.log('[CartContext] Order payload:', payload);
      console.log('[CartContext] Making POST request to:', '/orders/order-list/');
      
      // Create the order
      const response = await axiosInstance.post('/orders/order-list/', payload);
      console.log('[CartContext] Order creation response:', response.data);
      
      // Clear the cart for this table after successful order creation
      setTableCarts(prev => ({
        ...prev,
        [orderData.table]: []
      }));
      
      // Trigger refresh after placing order
      setTimeout(() => refreshAll(), 100);
      
      return response.data.id;
      
    } catch (error) {
      console.error('[CartContext] Error placing order:', error);
      console.error('[CartContext] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method
      });
      throw error;
    }
  };

  const checkWaiterActions = async (orderId) => {
    try {
      const response = await axiosInstance.get(`/orders/waiter-actions/${orderId}/`);
      return response.data;
    } catch (error) {
      console.error('Failed to check waiter actions:', error);
      return null;
    }
  };

  const updateOrder = async (orderId, updatedItems) => {
    console.log('CartContext: updateOrder called with orderId:', orderId, 'updatedItems:', updatedItems);
    
    try {
      // First check if waiter actions are available
      const actions = await axiosInstance.get(`/orders/${orderId}/waiter-actions/`);
      console.log('CartContext: Waiter actions response:', actions);
      
      if (!actions.data || !actions.data.edit) {
        console.warn('CartContext: Waiter actions not available or edit action not found, proceeding with update');
      }
      
      // Prepare the update payload
      const payload = {
        items: updatedItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          item_type: item.item_type || 'food',
          status: item.status || 'pending'
        }))
      };
      
      console.log('CartContext: updateOrder payload being sent:', payload);
      
      // Update the order
      const response = await axiosInstance.patch(`/orders/${orderId}/update/`, payload);
      const updatedOrder = response.data;
      console.log('CartContext: updateOrder response from backend:', updatedOrder);
      
      // Update the orders state in CartContext
      setOrders(prev => prev.map(order => 
        order.id === orderId ? updatedOrder : order
      ));
      
      console.log(`CartContext: Updated order ${orderId}. New items:`, updatedItems);
      
      // Clear the cart after successful update
      setTableCarts(prev => ({
        ...prev,
        [activeTableId]: []
      }));
      
      // Trigger refresh after updating order
      setTimeout(() => refreshAll(), 100);
      
      // Dispatch custom event for other components
      window.dispatchEvent(new CustomEvent('orderUpdated', { 
        detail: { orderId, updatedItems },
        source: 'CartContext'
      }));
      
      console.log('CartContext: Dispatched orderUpdated event');
      
      // Also call the global refresh function
      if (window.refreshOrderList) {
        window.refreshOrderList();
        console.log('CartContext: Calling window.refreshOrderList');
      }
      
      return updatedOrder;
      
    } catch (error) {
      console.error('CartContext: Error updating order:', error);
      throw error;
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      await axiosInstance.delete(`/orders/${orderId}/delete/`);
      console.log(`CartContext: Deleted order ${orderId}`);
      
      // Remove from orders state
      setOrders(prev => prev.filter(order => order.id !== orderId));
      
      // Trigger refresh after deleting order
      setTimeout(() => refreshAll(), 100);
      
      return true;
    } catch (error) {
      console.error('CartContext: Error deleting order:', error);
      throw error;
    }
  };

  const loadCartForEditing = (tableId, items) => {
    console.log('CartContext: loadCartForEditing called with tableId:', tableId, 'items:', items);
    
    // First set the active table ID
    setActiveTableId(tableId);
    
    // Then update the table carts with the items
    setTableCarts(prev => ({
      ...prev,
      [tableId]: items // Don't merge items when loading for editing - keep them as they are
    }));
    
    console.log(`CartContext: Loaded cart for editing table ${tableId}. Items:`, items);
    console.log(`CartContext: activeTableId set to:`, tableId);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + (Number(item.quantity) || 0), 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      return total + (price * quantity);
    }, 0);
  };

  const getTableCart = (tableId) => {
    return tableCarts[tableId] || [];
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        setActiveTable,
        activeTableId,
        setCartItems: (items) => {
          if (!activeTableId) return;
          setTableCarts(prev => ({
            ...prev,
            [activeTableId]: mergeCartItems(items)
          }));
        },
        orders,
        placeOrder,
        loadCartForEditing,
        updateOrder,
        deleteOrder,
        getTableCart,
        user,
        refreshOrders,
        refreshTables,
        refreshAll,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
