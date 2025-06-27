import axiosInstance from "./axiosInstance";

export const getPrintedOrders = async () => {
    try {
        const response = await axiosInstance.get('/orders/printed-orders/');
        return response.data;
    } catch (error) {
        console.error('Failed to fetch printed orders:', error);
        throw error;
    }
};

export const updatePaymentOption = async (orderId, paymentOption) => {
    try {
        const response = await axiosInstance.patch(`/orders/${orderId}/update-payment-option/`, { payment_option: paymentOption });
        return response.data;
    } catch (error) {
        console.error('Failed to update payment option:', error);
        throw error;
    }
};

export const getOrderById = async (orderId) => {
    try {
        const response = await axiosInstance.get(`/orders/${orderId}/`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch order by ID:', error);
        throw error;
    }
};

export const getMyOrders = async () => {
    try {
        const response = await axiosInstance.get('/orders/order-list/');
        return response.data;
    } catch (error) {
        console.error('Failed to fetch orders:', error);
        throw error;
    }
}; 