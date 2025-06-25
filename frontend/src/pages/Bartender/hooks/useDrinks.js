import { useState, useEffect } from 'react';

export const useDrinks = () => {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders/drinks/');
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
    const intervalId = setInterval(fetchOrders, 10000); 

    return () => clearInterval(intervalId);
  }, []);

  const updateOrderStatus = async (orderId, status, reason = null) => {
    try {
      const payload = { drink_status: status };
      if (reason) {
        // This part would need backend support for rejection reasons
      }

      const response = await fetch(`/api/orders/${orderId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to update order status: ${response.statusText}`);
      }
      
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: status } : order
        )
      );

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
  const getPreparingOrders = () => orders.filter(order => order.status === 'preparing');
  const getRejectedOrders = () => orders.filter(order => order.status === 'rejected');

  return {
    orders,
    acceptOrder,
    rejectOrder,
    getPendingOrders,
    getPreparingOrders,
    getRejectedOrders
  };
}; 