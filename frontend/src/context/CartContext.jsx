import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext'; // Assuming AuthContext is in the same folder
import axiosInstance from '../api/axiosInstance';

const CartContext = createContext();

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
    const { icon, ...rest } = item; // Destructure to remove the icon
    const itemToAdd = rest; // Item without the icon

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

  const placeOrder = (newOrder) => {
    if (!newOrder || !newOrder.id) {
      console.warn("Cannot place order: Invalid order object provided.");
      return null;
    }

    console.log('Placing order:', newOrder);

    setOrders(prevOrders => {
      const updatedOrders = [...prevOrders, newOrder];
      console.log('Updated orders:', updatedOrders);
      return updatedOrders;
    });

    // Only clear the cart after successfully creating the order
    if (newOrder.branch) { // A simple check to see if it's a real order
        const tableIdToClear = newOrder.branch; // Assuming branch ID can be used to identify the cart. This might need refinement.
        setTableCarts(prev => {
            const newTableCarts = { ...prev };
            // We need a reliable way to know which table's cart to clear.
            // For now, let's clear the active one.
            if(activeTableId) {
                newTableCarts[activeTableId] = [];
            }
            return newTableCarts;
        });
    }

    return newOrder.id;
  };

  const updateOrder = (orderId, updatedItems) => {
    setOrders(prevOrders => prevOrders.map(order => 
      order.id === orderId ? { ...order, items: updatedItems, timestamp: new Date().toISOString() } : order
    ));
    console.log(`CartContext: Updated order ${orderId}. New items:`, updatedItems);
    clearCart(); // Clear the cart after updating the order
  };

  const deleteOrder = (orderId) => {
    setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
    console.log(`CartContext: Deleted order ${orderId}`);
  };

  const loadCartForEditing = (tableId, items) => {
    setActiveTableId(tableId);
    setTableCarts(prev => ({
      ...prev,
      [tableId]: items
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
            [activeTableId]: items
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