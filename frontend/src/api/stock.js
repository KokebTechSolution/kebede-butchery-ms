import axios from 'axios';
import { API_BASE_URL } from './config';

export const fetchAvailableProducts = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/inventory/products/available/`);
  return response.data;
};
