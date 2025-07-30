import axios from 'axios';
import { API_BASE_URL } from './config';

export const getOrders = async (date) => {
    try {
        const url = date 
            ? `${API_BASE_URL}/api/orders/order-list/?date=${date}`
            : `${API_BASE_URL}/api/orders/order-list/`;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
    }
};

export const createOrder = async (orderData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/orders/`, orderData);
        return response.data;
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
};

export const updateOrder = async (orderId, orderData) => {
    try {
        const response = await axios.patch(`${API_BASE_URL}/api/orders/${orderId}/`, orderData);
        return response.data;
    } catch (error) {
        console.error('Error updating order:', error);
        throw error;
    }
};

export const getOrderById = async (orderId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/orders/${orderId}/`);
        return response.data;
    } catch (error) {
        console.error('Error fetching order:', error);
        throw error;
    }
};

export const getTables = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/branches/tables/`);
        return response.data;
    } catch (error) {
        console.error('Error fetching tables:', error);
        throw error;
    }
}; 