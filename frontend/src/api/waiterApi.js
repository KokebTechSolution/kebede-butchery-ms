import axiosInstance from './axiosInstance';

// Fetch waiter statistics
export const fetchWaiterStats = async (waiterId) => {
  try {
    const response = await axiosInstance.get(`/orders/waiter-stats/${waiterId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching waiter stats:', error);
    throw error;
  }
};

// Update waiter profile
export const updateWaiterProfile = async (waiterId, profileData) => {
  try {
    const response = await axiosInstance.patch(`/users/users/${waiterId}/`, profileData);
    return response.data;
  } catch (error) {
    console.error('Error updating waiter profile:', error);
    throw error;
  }
};

// Fetch waiter's recent printed orders
export const fetchWaiterPrintedOrders = async (waiterId, limit = 10) => {
  try {
    const response = await axiosInstance.get(`/orders/order-list/?waiter=${waiterId}&cashier_status=printed&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching waiter printed orders:', error);
    throw error;
  }
};

// Fetch waiter's active tables
export const fetchWaiterActiveTables = async (waiterId) => {
  try {
    const response = await axiosInstance.get(`/orders/order-list/?waiter=${waiterId}&status=active`);
    return response.data;
  } catch (error) {
    console.error('Error fetching waiter active tables:', error);
    throw error;
  }
}; 