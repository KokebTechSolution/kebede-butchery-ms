import React, { useState, useEffect } from 'react';
import OrderList from './OrderList';
import OrderDetail from './OrderDetail';
import { useCart } from '../../../context/CartContext';
import './OrdersPage.css';

const OrdersPage = ({ setCurrentPage, isNewOrderFromCart }) => {
  const { cartItems, setCartItems } = useCart();

  // Mock order data for demonstration. In a real app, this would come from a backend.
  const mockOrderData = {
    orderId: '2023-48-9040',
    from: {
      name: 'The Cozy Bistro',
      address: '123 Food Street',
      city: 'NY 10001',
      phone: '+123 456 7890',
    },
    issuedTo: {
      name: 'Delicious Diner',
      address: '456 Eatery Ave',
      city: 'NY 10002',
      phone: '+123 456 7891',
    },
    items: [
      { name: 'ጥብስ', category: 'Main', quantity: 1, price: 120 },
      { name: 'Coffee', category: 'Beverages', quantity: 2, price: 35 },
      { name: 'ጋዝ ላይት', category: 'Appetizer', quantity: 1, price: 100 },
    ],
    subtotal: 500.00, // Placeholder, will be calculated by OrderDetail
    total: 550.00, // Placeholder, will be calculated by OrderDetail
  };

  const [selectedOrder, setSelectedOrder] = useState(null); // Initialize as null

  // Set the initial selected order based on whether it's a new order from cart
  useEffect(() => {
    if (isNewOrderFromCart) {
      setSelectedOrder({ ...mockOrderData, items: cartItems, orderId: 'New Order' });
    } else {
      // Default to a mock order if not coming from cart and no order is selected
      setSelectedOrder(mockOrderData);
    }
  }, [isNewOrderFromCart, cartItems]); // Depend on isNewOrderFromCart and cartItems

  // Function to handle selecting an order from the OrderList
  const handleSelectOrder = (order) => {
    // In a real application, you would fetch the full details of this order from a backend
    // For now, we'll just use the mockOrderData and update the orderId
    setSelectedOrder({ ...mockOrderData, orderId: `2023-${order.id}` });
  };

  const handleEditOrder = (orderToEdit) => {
    if (orderToEdit && orderToEdit.items) {
      setCartItems(orderToEdit.items);
      setCurrentPage('menu'); // Navigate to the menu/cart page
    }
  };

  return (
    <div className="orders-page-container">
      <div className="orders-list-pane">
        <OrderList onSelectOrder={handleSelectOrder} />
      </div>
      <div className="order-detail-pane">
        <OrderDetail orderData={selectedOrder} onEdit={handleEditOrder} />
      </div>
    </div>
  );
};

export default OrdersPage; 