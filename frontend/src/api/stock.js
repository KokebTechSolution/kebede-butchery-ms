//stock.js

import axios from './axiosInstance';

export const fetchAvailableProducts = async () => {
  const response = await axios.get('http://localhost:8000/api/inventory/inventory/available/');
  return response.data;
};
