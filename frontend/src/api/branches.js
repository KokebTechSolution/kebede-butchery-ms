import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/inventory/branches/'; 
const getToken = () => localStorage.getItem('access');

const axiosConfig = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
  },
});

export const fetchBranches = async () => {
  try {
    const response = await axios.get(API_BASE_URL, axiosConfig());
    return response.data;
  } catch (error) {
    console.error('Error fetching branches:', error);
    throw error;
  }
};
