import axios from './axiosInstance';

export const fetchAvailableProducts = async () => {
  const response = await axios.get('inventory/inventory/available/');
  return response.data;
};
