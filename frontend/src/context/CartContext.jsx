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

  // Fetch orders and filter them based on status and table availability
  const fetchAndFilterOrders = async () => {
    try {
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
      
      setOrders(filteredOrders);
    } catch (error) {
      console.error("Failed to fetch orders or tables:", error);
    }
  };

  // Fetch orders on mount and set up polling - ONLY when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Initial fetch only - no automatic polling
      fetchAndFilterOrders();
    }
  }, [isAuthenticated, user]);

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

  const addToCart = (item) => {
    if (!activeTableId) {
      console.warn("No active table selected. Cannot add item to cart.");
      return;
    }
    const { icon, ...rest } = item;
    setTableCarts((prevTableCarts) => {
      const currentTableCart = prevTableCarts[activeTableId] || [];
      let found = false;
      const updatedTableCart = currentTableCart.map((cartItem) => {
        if (
          cartItem.name === rest.name &&
          cartItem.price === rest.price &&
          (cartItem.item_type || 'food') === (rest.item_type || 'food')
        ) {
          found = true;
          // If the item is accepted/rejected, revert status to pending when adding more
          return {
            ...cartItem,
            quantity: cartItem.quantity + 1,
            status: (cartItem.status === 'accepted' || cartItem.status === 'rejected') ? 'pending' : cartItem.status,
          };
        }
        return cartItem;
      });
      if (!found) {
        updatedTableCart.push({ ...rest, quantity: 1, status: rest.status || 'pending' });
      }
      return {
        ...prevTableCarts,
        [activeTableId]: updatedTableCart,
      };
    });
  };

  const removeFromCart = (itemId) => {
    if (!activeTableId) return;
    setTableCarts((prevTableCarts) => {
      const currentTableCart = prevTableCarts[activeTableId] || [];
      // Remove any item with matching id, regardless of status
      const updatedTableCart = currentTableCart.filter(
        (item) => item.id !== itemId
      );
      console.log('CartContext: Removed item', itemId, 'for table', activeTableId, '. New cart:', updatedTableCart);
      return {
        ...prevTableCarts,
        [activeTableId]: updatedTableCart,
      };
    });
  };

  const updateQuantity = (itemId, quantity) => {
    if (!activeTableId) return;
    if (quantity < 1) {
      removeFromCart(itemId);
      return;
    }
    console.log('CartContext: updateQuantity called with itemId:', itemId, 'quantity:', quantity);
    console.log('CartContext: Current cart items:', cartItems);
    
    setTableCarts((prevTableCarts) => {
      const currentTableCart = prevTableCarts[activeTableId] || [];
      console.log('CartContext: Current table cart:', currentTableCart);
      
      // First try to find by id
      let foundItem = currentTableCart.find(item => item.id === itemId);
      
      // If not found by id, try to find by name and price (fallback for items without id)
      if (!foundItem && typeof itemId === 'string') {
        // If itemId is a string, it might be a name
        foundItem = currentTableCart.find(item => item.name === itemId);
      }
      
      if (!foundItem) {
        console.warn('CartContext: Could not find item with id:', itemId, 'in cart:', currentTableCart);
        return prevTableCarts;
      }
      
      const updatedTableCart = currentTableCart.map((item) => {
        console.log('CartContext: Checking item:', item, 'against itemId:', itemId);
        if (item.id === itemId || (typeof itemId === 'string' && item.name === itemId)) {
          console.log('CartContext: Found matching item, updating quantity from', item.quantity, 'to', quantity);
          return {
            ...item,
            quantity,
            status: item.status
          };
        }
        return item;
      });
      console.log('CartContext: Updated quantity for item', itemId, 'to', quantity, 'for table', activeTableId, '. New cart:', updatedTableCart);
      return {
        ...prevTableCarts,
        [activeTableId]: updatedTableCart,
      };
    });
  };

  const clearCart = () => {
    if (!activeTableId) {
      console.warn('CartContext: clearCart called but activeTableId is null/undefined');
      return;
    }
    setTableCarts((prevTableCarts) => ({
      ...prevTableCarts,
      [activeTableId]: [],
    }));
    console.log('CartContext: Cart cleared for table', activeTableId);
  };

  const placeOrder = async (orderData) => {
    try {
      const payload = {
        ...orderData,
        items: orderData.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          item_type: item.item_type, // Remove default fallback - item_type must be set
          status: 'pending'
        }))
      };

      const response = await axiosInstance.post('/orders/order-list/', payload);
      
      // Clear cart after successful order
      clearCart();
      return response.data.id;
    } catch (error) {
      console.error('Error placing order:', error);
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
    try {
      console.log('CartContext: updateOrder called with orderId:', orderId, 'updatedItems:', updatedItems);
      
      // Check waiter actions first
      const actions = await checkWaiterActions(orderId);
      console.log('CartContext: Waiter actions response:', actions);
      
      // Safely check if edit is allowed
      if (actions && actions.actions && actions.actions.edit) {
        if (!actions.actions.edit.enabled) {
          throw new Error(actions.actions.edit.reason || 'Edit not allowed for this order');
        }
      } else {
        console.warn('CartContext: Waiter actions not available or edit action not found, proceeding with update');
      }
      
      // Build payload with all items and their current status
      const payload = {
        items: updatedItems.map(item => ({
          ...item,
          status: item.status || 'pending', // Default to pending if not set
        })),
      };
      
      console.log('CartContext: updateOrder payload being sent:', payload);
      const response = await axiosInstance.patch(`/orders/order-list/${orderId}/`, payload);
      const updatedOrder = response.data;
      
      console.log('CartContext: updateOrder response from backend:', updatedOrder);

      // Update the orders state in CartContext
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? updatedOrder : order
        )
      );
      console.log(`CartContext: Updated order ${orderId}. New items:`, updatedItems);
      
      // Dispatch a custom event to notify other components about the order update
      const event = new CustomEvent('orderUpdated', { 
        detail: { 
          orderId: orderId,
          updatedOrder: updatedOrder,
          source: 'CartContext'
        } 
      });
      window.dispatchEvent(event);
      console.log('CartContext: Dispatched orderUpdated event');
      
      // Also try to manually refresh the order list
      if (window.refreshOrderList) {
        console.log('CartContext: Calling window.refreshOrderList');
        window.refreshOrderList();
      }
      
      // Don't clear cart here - let the calling component handle it
      // clearCart();
      
      return updatedOrder;
    } catch (error) {
      console.error('Failed to update order:', error);
      throw error; // Re-throw the error so calling code can handle it
    }
  };

  const deleteOrder = (orderId) => {
    setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
    console.log(`CartContext: Deleted order ${orderId}`);
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
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (Number(item.price || 0) * item.quantity), 0);
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
