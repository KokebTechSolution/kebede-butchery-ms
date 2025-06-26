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