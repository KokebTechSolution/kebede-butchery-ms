import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext'; // Assuming AuthContext provides user info only
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
      const payload = {
        ...orderData,
        items: orderData.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          item_type: item.item_type || 'beverage',
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
