import { useState, useEffect } from 'react';
import axiosInstance from '../../../api/axiosInstance'; // assumes this has withCredentials set
import { useAuth } from '../../../context/AuthContext';

export const useBeverages = (filterDate) => {
  const [orders, setOrders] = useState([]);
  const { user } = useAuth();
  const branchId = user?.branch;

  const fetchOrders = async () => {
    try {
      const response = await axiosInstance.get(`/orders/beverages/?branch_id=${branchId}`, {
        withCredentials: true, // ensure cookies sent
      });
      setOrders(response.data);
      console.log('Fetched from backend:', response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    }
  };

  useEffect(() => {
    if (branchId) {
      fetchOrders();
      const intervalId = setInterval(fetchOrders, 10000);
      return () => clearInterval(intervalId);
    }
  }, [branchId]);

  // Helper to check if order matches filterDate (YYYY-MM-DD)
  const matchesFilterDate = (order) => {
    if (!filterDate) return true;
    if (!order.created_at) return false;
    return order.created_at.slice(0, 10) === filterDate;
  };

  const updateOrderStatus = async (orderId, status, reason = null) => {
    try {
      const payload = { beverage_status: status };
      // You may want to send reason here if backend supports it
      const response = await axiosInstance.patch(`/api/orders/${orderId}/`, payload, {
        withCredentials: true,
      });
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, beverage_status: status } : order
        )
      );
      console.log('Order update response:', response.data);
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

  const getPendingOrders = () => orders.filter(order => order.beverage_status === 'pending');
  const getPreparingOrders = () => orders.filter(order => order.beverage_status === 'preparing');
  const getRejectedOrders = () => orders.filter(order => order.beverage_status === 'rejected');

  const getClosedOrders = () =>
    orders.filter(order =>
      order.has_payment &&
      order.items.length > 0 &&
      order.items.every(item => item.status === 'accepted' || item.status === 'rejected') &&
      matchesFilterDate(order)
    );

  const getActiveOrders = () =>
    orders.filter(order =>
      !getClosedOrders().some(closed => closed.id === order.id) &&
      matchesFilterDate(order)
    );

  // Item-level status update
  const updateOrderItemStatus = async (itemId, status) => {
    try {
      const response = await axiosInstance.patch(`/orders/order-item/${itemId}/update-status/`, { status }, {
        withCredentials: true,
      });
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
    fetchOrders,
    acceptOrder,
    rejectOrder,
    rejectOrderItem,
    acceptOrderItem,
    getPendingOrders,
    getPreparingOrders,
    getRejectedOrders,
    getClosedOrders,
    getActiveOrders,
  };
};
