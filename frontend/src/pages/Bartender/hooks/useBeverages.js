import { useState, useEffect } from 'react';
import axios from 'axios';
import axiosInstance from '../../../api/axiosInstance';

export const useBeverages = (filterDate) => {

  const [orders, setOrders] = useState([]);

  const fetchOrders = async (date) => {
    try {
      let url = 'http://localhost:8000/api/orders/beverages/';
      if (date) {
        url += `?date=${date}`;
      }
      const response = await axios.get(url);
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  useEffect(() => {
    fetchOrders(filterDate);
    const intervalId = setInterval(() => fetchOrders(filterDate), 10000);
    return () => clearInterval(intervalId);
  }, [filterDate]);

  const updateOrderStatus = async (orderId, status, reason = null) => {
    try {
      const payload = { beverage_status: status };
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

  const getClosedOrders = () =>
    orders.filter(order =>
      order.has_payment &&
      order.items.length > 0 &&
      order.items.every(item => item.status === 'accepted' || item.status === 'rejected')
    );

  const getActiveOrders = () => {
    const active = orders.filter(order =>
      !getClosedOrders().some(closed => closed.id === order.id)
    );
    console.log('Orders:', orders);
    console.log('Active Orders:', active);
    console.log('Closed Orders:', getClosedOrders());
    return active;
  };

  // Add item-level status update
  const updateOrderItemStatus = async (itemId, status) => {
    try {
      const response = await axiosInstance.patch(`orders/order-item/${itemId}/update-status/`, { status });
      // Update the item status in the local state
      setOrders(prevOrders =>
        prevOrders.map(order => ({
          ...order,
          items: order.items.map(item =>
            item.id === itemId ? { ...item, status: response.data.status } : item
          )
        }))
      );
    } catch (error) {
      console.error('Failed to update item status', error);
    }
  };

  const acceptOrderItem = (itemId) => updateOrderItemStatus(itemId, 'accepted');
  const rejectOrderItem = (itemId) => updateOrderItemStatus(itemId, 'rejected');

  return {
    orders,
    acceptOrder,
    rejectOrder,
    getPendingOrders,
    getPreparingOrders,
    getRejectedOrders,
    getClosedOrders,
    getActiveOrders,
    acceptOrderItem,
    rejectOrderItem,
    refetch: fetchOrders,
  };
}; 