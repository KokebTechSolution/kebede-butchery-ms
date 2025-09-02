import { useState, useEffect } from 'react';
import axiosInstance from '../../../api/axiosInstance'; // assumes this has withCredentials set
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config/api';
import { getCachedOrders, cacheOrders } from '../../../utils/cacheUtils';

export const useBeverages = (filterDate) => {
  const [orders, setOrders] = useState([]);
  const { user } = useAuth();
  const branchId = user?.branch;

  const fetchOrders = async (date, forceRefresh = false) => {
    try {
      // Check if branchId exists before making API call
      if (!branchId) {
        console.log('⚠️ No branchId available, skipping API call');
        setOrders([]);
        return;
      }

      // Try to get from cache first (unless forcing refresh)
      if (!forceRefresh) {
        const cachedOrders = getCachedOrders();
        if (cachedOrders) {
          console.log('📦 Loading bartender orders from cache');
          setOrders(cachedOrders);
          return;
        }
      }

      // If no cache or forcing refresh, fetch from API
      console.log('🌐 Fetching bartender orders from API');
      console.log('🌐 API_BASE_URL:', API_BASE_URL);
      console.log('🌐 Full URL:', `${API_BASE_URL}orders/beverages/?branch_id=${branchId}`);
      console.log('🌐 Relative URL:', `orders/beverages/?branch_id=${branchId}`);
      console.log('🌐 branchId:', branchId);
      
      const response = await axiosInstance.get(`orders/beverages/?branch_id=${branchId}`, {
        withCredentials: true, // ensure cookies sent
      });
      
      console.log('🌐 API Response:', response);
      console.log('🌐 Response data:', response.data);
      
      // Validate response data before setting state
      if (response.data && Array.isArray(response.data)) {
        setOrders(response.data);
        // Cache the fetched data
        cacheOrders(response.data);
        console.log('✅ Orders set successfully:', response.data.length);
      } else {
        console.warn('⚠️ Invalid response data format:', response.data);
        setOrders([]);
      }
      
    } catch (error) {
      console.error("❌ Error fetching orders:", error);
      console.error("❌ Error details:", error.response?.data);
      console.error("❌ Error status:", error.response?.status);
      
      // Set empty orders to prevent UI errors
      setOrders([]);
      
      // Don't throw error to prevent 500 status
      return;
    }
  };

  useEffect(() => {
    console.log('🔍 useBeverages useEffect triggered');
    console.log('🔍 branchId:', branchId);
    console.log('🔍 filterDate:', filterDate);
    
    if (branchId) {
      console.log('🔍 Calling fetchOrders with branchId:', branchId);
      fetchOrders(filterDate);
      const intervalId = setInterval(() => fetchOrders(filterDate), 10000);
      return () => clearInterval(intervalId);
    } else {
      console.log('🔍 No branchId, not fetching orders');
    }
  }, [branchId, filterDate]);

  // Helper to check if order matches filterDate (YYYY-MM-DD)
  const matchesFilterDate = (order) => {
    try {
      if (!filterDate) return true;
      if (!order || !order.created_at) return false;
      
      // Handle different date formats safely
      const orderDate = new Date(order.created_at);
      if (isNaN(orderDate.getTime())) return false;
      
      const orderDateStr = orderDate.toISOString().slice(0, 10);
      return orderDateStr === filterDate;
    } catch (error) {
      console.error('Error in matchesFilterDate:', error);
      return false;
    }
  };

  const updateOrderStatus = async (orderId, status, reason = null) => {
    try {
      const payload = { beverage_status: status };
      // You may want to send reason here if backend supports it
      const response = await axiosInstance.patch(`orders/order-list/${orderId}/`, payload, {
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

  const getClosedOrders = () => {
    try {
      return orders.filter(order => {
        // Add null checks to prevent errors
        if (!order || !order.items) return false;
        
        return (
          order.has_payment &&
          Array.isArray(order.items) &&
          order.items.length > 0 &&
          order.items.every(item => 
            item && item.status && (item.status === 'accepted' || item.status === 'rejected')
          ) &&
          matchesFilterDate(order)
        );
      });
    } catch (error) {
      console.error('Error in getClosedOrders:', error);
      return [];
    }
  };

  const getActiveOrders = () => {
    try {
      const active = orders.filter(order => {
        if (!order) return false;
        
        return (
          !getClosedOrders().some(closed => closed && closed.id === order.id) &&
          matchesFilterDate(order)
        );
      });
      
      console.log('Orders:', orders);
      console.log('Active Orders:', active);
      console.log('Closed Orders:', getClosedOrders());
      return active;
    } catch (error) {
      console.error('Error in getActiveOrders:', error);
      return [];
    }
  };

  // Item-level status update
  const updateOrderItemStatus = async (itemId, status) => {
    try {
      const response = await axiosInstance.patch(`orders/order-item/${itemId}/update-status/`, { status }, {
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
    refreshOrders: () => fetchOrders(filterDate, true),
  };
};
