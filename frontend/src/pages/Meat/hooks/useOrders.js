import { useState, useEffect } from 'react';
import axios from 'axios';
import axiosInstance from '../../../api/axiosInstance';
export const useOrders = (filterDate) => {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async (date) => {
    try {
      let url = 'http://localhost:8000/api/orders/food/';
      if (date) url += `?date=${date}`;
      const response = await axios.get(url, { withCredentials: true });
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
      const payload = { food_status: status };
      // add rejectionReason here once supported by backend
      await axiosInstance.patch(
        `http://localhost:8000/api/orders/order-list/${orderId}/`,
        payload,
        { withCredentials: true }
      );
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, food_status: status } : order
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  const isFood = item => !item.item_type || item.item_type === 'food';

  const getClosedOrders = () =>
    orders.filter(order =>
      order.has_payment &&
      order.items.some(isFood) &&
      order.items
        .filter(isFood)
        .every(item => item.status === 'accepted' || item.status === 'rejected')
    );

  const getActiveOrders = () =>
    orders.filter(order =>
      !getClosedOrders().some(closed => closed.id === order.id) &&
      order.items.some(isFood)
    );

  // Accept/reject order (updates status)
  const acceptOrder = (orderId) => {
    updateOrderStatus(orderId, 'preparing');
  };

  const rejectOrder = (orderId, reason) => {
    updateOrderStatus(orderId, 'rejected', reason);
  };

  // Accept/reject order item (updates item status)
  const updateOrderItemStatus = async (itemId, status) => {
    try {
      const response = await axiosInstance.patch(
        `http://localhost:8000/api/orders/order-item/${itemId}/update-status/`,
        { status },
        { withCredentials: true }
      );
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

  // Add this function to update cashier_status
  const setOrderPrinted = async (orderId) => {
    try {
      await axiosInstance.patch(`http://localhost:8000/api/orders/order-list/${orderId}/update-cashier-status/`, { cashier_status: 'printed' });
      // Optionally, refresh orders after printing
      fetchOrders(filterDate);
    } catch (error) {
      console.error('Failed to set order as printed', error);
    }
  };

  return {
    orders,
    acceptOrder,
    rejectOrder,
    getPendingOrders: () => orders.filter(order => order.status === 'pending'),
    getPreparingOrders: () => orders.filter(order => order.status === 'preparing'),
    getRejectedOrders: () => orders.filter(order => order.status === 'rejected'),
    getClosedOrders,
    getActiveOrders,
    acceptOrderItem,
    rejectOrderItem,
    setOrderPrinted // <-- export the new function
  };
};
