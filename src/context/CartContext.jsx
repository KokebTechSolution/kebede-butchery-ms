import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children, initialActiveTableId }) => {
  const [tableCarts, setTableCarts] = useState({}); // Stores carts for all tables { tableId: [item1, item2], ... }
  const [activeTableId, setActiveTableId] = useState(null); // The currently selected table ID

  useEffect(() => {
    if (initialActiveTableId) {
      setActiveTableId(initialActiveTableId);
    }
  }, [initialActiveTableId]);

  // Function to set the active table
  const setActiveTable = (tableId) => {
    setActiveTableId(tableId);
  };

  // Get cart items for the active table
  const cartItems = activeTableId ? (tableCarts[activeTableId] || []) : [];

  const addToCart = (item) => {
    if (!activeTableId) {
      console.warn("No active table selected. Cannot add item to cart.");
      return;
    }
    setTableCarts((prevTableCarts) => {
      const currentTableCart = prevTableCarts[activeTableId] || [];
      const existingItem = currentTableCart.find((i) => i.name === item.name);

      let updatedTableCart;
      if (existingItem) {
        updatedTableCart = currentTableCart.map((i) =>
          i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        updatedTableCart = [...currentTableCart, { ...item, quantity: 1 }];
      }
      return {
        ...prevTableCarts,
        [activeTableId]: updatedTableCart,
      };
    });
  };

  const removeFromCart = (itemName) => {
    if (!activeTableId) return;
    setTableCarts((prevTableCarts) => ({
      ...prevTableCarts,
      [activeTableId]: prevTableCarts[activeTableId].filter(
        (item) => item.name !== itemName
      ),
    }));
  };

  const updateQuantity = (itemName, quantity) => {
    if (!activeTableId) return;
    if (quantity < 1) {
      removeFromCart(itemName);
      return;
    }
    setTableCarts((prevTableCarts) => ({
      ...prevTableCarts,
      [activeTableId]: prevTableCarts[activeTableId].map((item) =>
        item.name === itemName ? { ...item, quantity } : item
      ),
    }));
  };

  const clearCart = () => {
    if (!activeTableId) return;
    setTableCarts((prevTableCarts) => ({
      ...prevTableCarts,
      [activeTableId]: [],
    }));
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems, // This will now be the active table's cartItems
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        setActiveTable, // Expose setActiveTable
        activeTableId, // Expose activeTableId for consumption
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