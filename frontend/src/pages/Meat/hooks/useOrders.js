import { useState, useEffect } from 'react';

export const useOrders = () => {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders/order-list/');
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await response.json();
      // The backend returns a list of orders.
      // We need to filter for orders with a 'pending' status.
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Fetch every 10 seconds to look for new orders
    const intervalId = setInterval(fetchOrders, 10000); 

    return () => clearInterval(intervalId);
  }, []);

  const updateOrderStatus = async (orderId, status, reason = null) => {
    try {
      const payload = { status };
      if (reason) {
        // You would need to add 'rejectionReason' to your Order model and serializer for this to work
        // For now, we just update the status
      }

      const response = await fetch(`/api/orders/${orderId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to update order status: ${response.statusText}`);
      }
      
      // Remove the order from the local state to update the UI instantly
      setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));

    } catch (error) {
      console.error(error);
    }
  };

  const acceptOrder = (orderId) => {
    updateOrderStatus(orderId, 'preparing');
  };

  const rejectOrder = (orderId, reason) => {
    updateOrderStatus(orderId, 'rejected', reason);
  };

  const getPendingOrders = () => orders.filter(order => order.status === 'pending');
  const getRejectedOrders = () => orders.filter(order => order.status === 'rejected');

  return {
    orders,
    acceptOrder,
    rejectOrder,
    getPendingOrders,
    getRejectedOrders
  };
};