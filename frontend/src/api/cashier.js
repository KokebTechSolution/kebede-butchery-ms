import axios from 'axios';
import { API_BASE_URL } from './config';

export const getPrintedOrders = async (date, start, end) => {
    let url = `${API_BASE_URL}/api/orders/printed-orders/`;
    const params = [];
    if (date) params.push(`date=${date}`);
    if (start && end) params.push(`start=${start}&end=${end}`);
    if (params.length) url += '?' + params.join('&');
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch printed orders:', error);
        throw error;
    }
};

export const updatePaymentOption = async (orderId, paymentOption) => {
    try {
        const response = await axios.patch(
            `${API_BASE_URL}/api/orders/${orderId}/update-payment-option/`,
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
        const url = `${API_BASE_URL}/api/orders/${orderId}/`;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error(`Failed to fetch order ${orderId}:`, error);
        throw error;
    }
};

export const getMyOrders = async (date) => {
    let url = `${API_BASE_URL}/api/orders/order-list/`;
    if (date) {
        url += `?date=${date}`;
    }
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error(`Failed to fetch orders:`, error);
        throw error;
    }
};
