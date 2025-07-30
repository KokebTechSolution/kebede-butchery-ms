import axiosInstance from './axiosInstance';

export const getOrders = async (date) => {
    try {
        const url = date 
            ? `orders/order-list/?date=${date}`
            : 'orders/order-list/';
        const response = await axiosInstance.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
    }
};

export const createOrder = async (orderData) => {
    try {
        const response = await axiosInstance.post('orders/', orderData);
        return response.data;
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
};

export const updateOrder = async (orderId, orderData) => {
    try {
        const response = await axiosInstance.patch(`orders/${orderId}/`, orderData);
        return response.data;
    } catch (error) {
        console.error('Error updating order:', error);
        throw error;
    }
};

export const getOrderById = async (orderId) => {
    try {
        const response = await axiosInstance.get(`orders/${orderId}/`);
        return response.data;
    } catch (error) {
        console.error('Error fetching order:', error);
        throw error;
    }
};

export const getTables = async () => {
    try {
        const response = await axiosInstance.get('branches/tables/');
        return response.data;
    } catch (error) {
        console.error('Error fetching tables:', error);
        throw error;
    }
};

export const fetchWaiterStats = async (waiterId, date) => {
    try {
        const url = date 
            ? `orders/waiter-stats/${waiterId}/?date=${date}`
            : `orders/waiter-stats/${waiterId}/`;
        const response = await axiosInstance.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching waiter stats:', error);
        throw error;
    }
};

export const updateWaiterProfile = async (waiterId, profileData) => {
    try {
        const response = await axiosInstance.patch(`users/${waiterId}/`, profileData);
        return response.data;
    } catch (error) {
        console.error('Error updating waiter profile:', error);
        throw error;
    }
};

export const fetchWaiterPrintedOrders = async (waiterId, limit = 10) => {
    try {
        const url = limit 
            ? `orders/waiter-orders/${waiterId}/?limit=${limit}`
            : `orders/waiter-orders/${waiterId}/`;
        const response = await axiosInstance.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching waiter printed orders:', error);
        throw error;
    }
}; 