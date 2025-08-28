import axiosInstance from "./axiosInstance";

export const getPrintedOrders = async (date, start, end) => {
    let url = '/orders/printed-orders/';
    const params = [];
    if (date) params.push(`date=${date}`);
    if (start && end) params.push(`start=${start}&end=${end}`);
    if (params.length) url += '?' + params.join('&');
    try {
        const response = await axiosInstance.get(url);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch printed orders:', error);
        throw error;
    }
};

export const updatePaymentOption = async (orderId, paymentOption) => {
    try {
        const response = await axiosInstance.patch(
            `/orders/order-list/${orderId}/update-payment-option/`,
            { payment_option: paymentOption }
        );
        return response.data;
    } catch (error) {
        console.error('Failed to update payment option:', error);
        throw error;
    }
};

export const getOrderById = async (orderId) => {
    try {
        const response = await axiosInstance.get(`/orders/order-list/${orderId}/`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch order by ID:', error);
        throw error;
    }
};

export const getMyOrders = async (date, cashierStatus = null) => {
    let url = '/orders/order-list/';
    const params = [];
    if (date) {
        params.push(`date=${date}`);
    }
    if (cashierStatus) {
        params.push(`cashier_status=${cashierStatus}`);
    }
    if (params.length) {
        url += '?' + params.join('&');
    }
    try {
        const response = await axiosInstance.get(url);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch orders:', error);
        throw error;
    }
};
