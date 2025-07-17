import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext'; // Assuming AuthContext provides user info only
import axiosInstance from '../api/axiosInstance';

const CartContext = createContext();

export const CartProvider = ({ children, initialActiveTableId }) => {
  const { user } = useAuth(); // No tokens here, only user
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

  // Fetch orders once on mount — session auth uses cookies automatically
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axiosInstance.get('/orders/order-list/');
        setOrders(response.data);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      }
    };

    fetchOrders();
  }, []);

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
    setActiveTableId(tableId);
    setTableCarts(prev => ({
      ...prev,
      [tableId]: prev[tableId] || []
    }));
    console.log('CartContext: Active table set to', tableId);
  }, []);

  const cartItems = activeTableId ? (tableCarts[activeTableId] || []) : [];
  console.log('CartContext: Current cart items for table', activeTableId, ':', cartItems);

  const addToCart = (item) => {
    if (!activeTableId) {
      console.warn("No active table selected. Cannot add item to cart.");
      return;
    }
    const { icon, ...rest } = item;
    const itemToAdd = rest;

    setTableCarts((prevTableCarts) => {
      const currentTableCart = prevTableCarts[activeTableId] || [];
      const existingItem = currentTableCart.find((i) => i.name === itemToAdd.name);

      let updatedTableCart;
      if (existingItem) {
        updatedTableCart = currentTableCart.map((i) =>
          i.name === itemToAdd.name ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        updatedTableCart = [...currentTableCart, { ...itemToAdd, quantity: 1 }];
      }
      console.log('CartContext: Added/Updated item', itemToAdd.name, 'for table', activeTableId, '. New cart:', updatedTableCart);
      return {
        ...prevTableCarts,
        [activeTableId]: updatedTableCart,
      };
    });
  };

  const removeFromCart = (itemName) => {
    if (!activeTableId) return;
    setTableCarts((prevTableCarts) => {
      const currentTableCart = prevTableCarts[activeTableId] || [];
      const updatedTableCart = currentTableCart.filter(
        (item) => item.name !== itemName
      );
      console.log('CartContext: Removed item', itemName, 'for table', activeTableId, '. New cart:', updatedTableCart);
      return {
        ...prevTableCarts,
        [activeTableId]: updatedTableCart,
      };
    });
  };

  const updateQuantity = (itemName, quantity) => {
    if (!activeTableId) return;
    if (quantity < 1) {
      removeFromCart(itemName);
      return;
    }
    setTableCarts((prevTableCarts) => {
      const currentTableCart = prevTableCarts[activeTableId] || [];
      const updatedTableCart = currentTableCart.map((item) =>
        item.name === itemName ? { ...item, quantity } : item
      );
      console.log('CartContext: Updated quantity for item', itemName, 'to', quantity, 'for table', activeTableId, '. New cart:', updatedTableCart);
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
      const payload = {
        ...orderData,
        table: activeTableId,
        waiter_username: user?.username,
      };
      delete payload.table_number;
      delete payload.branch;

      const response = await axiosInstance.post('/orders/order-list/', payload);
      const newOrder = response.data;

      setOrders(prevOrders => [...prevOrders, newOrder]);

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

  const updateOrder = (orderId, updatedItems) => {
    setOrders(prevOrders => prevOrders.map(order =>
      order.id === orderId ? { ...order, items: updatedItems, timestamp: new Date().toISOString() } : order
    ));
    console.log(`CartContext: Updated order ${orderId}. New items:`, updatedItems);
    clearCart();
  };

  const deleteOrder = (orderId) => {
    setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
    console.log(`CartContext: Deleted order ${orderId}`);
  };

  const loadCartForEditing = (tableId, items) => {
    setActiveTableId(tableId);
    setTableCarts(prev => ({
      ...prev,
      [tableId]: [], // Clear cart first
    }));
    setTableCarts(prev => ({
      ...prev,
      [tableId]: items, // Load items to edit
    }));
    console.log(`CartContext: Loaded cart for editing table ${tableId}. Items:`, items);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
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
            [activeTableId]: items
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
