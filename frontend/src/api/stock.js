import axios from './axiosInstance';

export const fetchAvailableProducts = async () => {
  const response = await axios.get('inventory/products/available/');
  return response.data;
};
