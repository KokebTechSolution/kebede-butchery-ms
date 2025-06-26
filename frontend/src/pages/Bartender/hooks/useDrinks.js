import { useState, useEffect } from 'react';
import axios from 'axios';

export const useDrinks = () => {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/orders/drinks/');
      setOrders(response.data);
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

      await axios.patch(`http://localhost:8000/api/orders/${orderId}/`, payload);
      
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