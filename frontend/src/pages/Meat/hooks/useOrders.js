import { useState, useEffect } from 'react';
import axios from 'axios';

export const useOrders = () => {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/orders/food/');
      setOrders(response.data);
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
      const payload = { food_status: status };
      if (reason) {
        // You would need to add 'rejectionReason' to your Order model and serializer for this to work
        // For now, we just update the status
      }

      await axios.patch(`http://localhost:8000/api/orders/${orderId}/`, payload);
      
      // Update the order's status in the local state instead of removing it
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