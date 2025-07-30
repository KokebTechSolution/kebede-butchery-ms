import axios from 'axios';
import { API_BASE_URL } from './config';

export const fetchBranches = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/branches/`);
        return response.data;
    } catch (error) {
        console.error('Error fetching branches:', error);
        throw error;
    }
};

export const fetchTables = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/branches/tables/`);
        return response.data;
    } catch (error) {
        console.error('Error fetching tables:', error);
        throw error;
    }
};

export const createTable = async (tableData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/branches/tables/`, tableData);
        return response.data;
    } catch (error) {
        console.error('Error creating table:', error);
        throw error;
    }
};
