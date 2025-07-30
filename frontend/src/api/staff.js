import axios from 'axios';
import { API_BASE_URL } from './config';

export const fetchStaff = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/users/`);
        return response.data;
    } catch (error) {
        console.error('Error fetching staff:', error);
        throw error;
    }
};

export const createStaff = async (staffData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/users/`, staffData);
        return response.data;
    } catch (error) {
        console.error('Error creating staff:', error);
        throw error;
    }
};

export const updateStaff = async (id, staffData) => {
    try {
        const response = await axios.patch(`${API_BASE_URL}/api/users/${id}/`, staffData);
        return response.data;
    } catch (error) {
        console.error('Error updating staff:', error);
        throw error;
    }
};

export const deleteStaff = async (id) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/api/users/${id}/`);
        return response.data;
    } catch (error) {
        console.error('Error deleting staff:', error);
        throw error;
    }
};
