import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext'; // Assuming AuthContext is in the same folder
import axiosInstance from '../api/axiosInstance';

const CartContext = createContext();

// Utility to merge cart items by name, price, type, and status
function mergeCartItems(items) {
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
  const { user, tokens } = useAuth(); // Get user and tokens from AuthContext
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
  const [activeTableId, setActiveTableId] = useState(null); // The currently selected table ID
  const [orders, setOrders] = useState([]); // Start with an empty array, will be populated from DB

  // Fetch orders from the database on component mount
  useEffect(() => {
    const fetchOrders = async () => {
      if (!tokens) {
        setOrders([]); // Clear orders if no token
        return;
      }
      try {
        const response = await axiosInstance.get('/orders/order-list/');
        setOrders(response.data);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      }
    };

    fetchOrders();
  }, [tokens]); // Rerun when tokens change (login/logout)

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
      // Initialize cart for the table if it doesn't exist
      setTableCarts(prev => ({
        ...prev,
        [initialActiveTableId]: prev[initialActiveTableId] || []
      }));
      console.log('CartContext: Initial active table set to', initialActiveTableId);
    }
  }, [initialActiveTableId]);

  // Function to set the active table
  const setActiveTable = useCallback((tableId) => {
    setActiveTableId(tableId);
    // Initialize cart for the table if it doesn't exist
    setTableCarts(prev => ({
      ...prev,
      [tableId]: prev[tableId] || []
    }));
    console.log('CartContext: Active table set to', tableId);
  }, []); // Empty dependency array means this function is created only once

  // Get cart items for the active table
  const cartItems = activeTableId ? (tableCarts[activeTableId] || []) : [];
  console.log('CartContext: Current cart items for table', activeTableId, ':', cartItems);

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
    setTableCarts((prevTableCarts) => {
      const currentTableCart = prevTableCarts[activeTableId] || [];
      const updatedTableCart = mergeCartItems(currentTableCart.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity,
              status: item.status
            }
          : item
      ));
      console.log('CartContext: Updated quantity for item', itemId, 'to', quantity, 'for table', activeTableId, '. New cart:', updatedTableCart);
      return {
        ...prevTableCarts,
        [activeTableId]: updatedTableCart,
      };
    });
  };

  const clearCart = () => {
    if (!activeTableId) return;
    setTableCarts((prevTableCarts) => ({
      ...prevTableCarts,
      [activeTableId]: [],
    }));
    console.log('CartContext: Cart cleared for table', activeTableId);
  };

  const placeOrder = async (orderData) => {
    try {
      // Ensure orderData uses 'table' (table ID) instead of 'table_number' or 'branch'
      const payload = {
        ...orderData,
        table: activeTableId,
        waiter_username: user?.username,
        // waiter_table_number removed because 'tables' is not defined here
      };
      delete payload.table_number;
      delete payload.branch;
      const response = await axiosInstance.post('/orders/order-list/', payload);
      const newOrder = response.data;

      // Update local state with the new order
      setOrders(prevOrders => [...prevOrders, newOrder]);

      // Clear the cart for the active table
      if (activeTableId) {
        setTableCarts(prev => ({
          ...prev,
          [activeTableId]: [],
        }));
      }

      return newOrder.id;
    } catch (error) {
      console.error('Failed to place order:', error);
      return null;
    }
  };

  const updateOrder = async (orderId, updatedItems) => {
    try {
      // Build payload with all items and their current status
      const payload = {
        items: updatedItems.map(item => ({
          ...item,
          status: item.status || 'pending', // Default to pending if not set
        })),
      };
      const response = await axiosInstance.patch(`/orders/order-list/${orderId}/`, payload);
      const updatedOrder = response.data;

      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? updatedOrder : order
        )
      );
      console.log(`CartContext: Updated order ${orderId}. New items:`, updatedItems);
      clearCart();
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  };

  const deleteOrder = (orderId) => {
    setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
    console.log(`CartContext: Deleted order ${orderId}`);
  };

  const loadCartForEditing = (tableId, items) => {
    setActiveTableId(tableId);
    setTableCarts(prev => ({
      ...prev,
      [tableId]: mergeCartItems(items)
    }));
    console.log(`CartContext: Loaded cart for editing table ${tableId}. Items:`, items);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Get cart items for any table
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
        getTableCart, // Expose getTableCart for getting any table's cart
        user, // Expose user
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