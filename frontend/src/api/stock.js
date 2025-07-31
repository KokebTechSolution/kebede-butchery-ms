import axiosInstance from './axiosInstance';

// Fetch all stocks
export const fetchStocks = async () => {
  try {
    const response = await axiosInstance.get('inventory/stocks/');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching stocks:', error);
    throw error;
  }
};

// Fetch stock by ID
export const fetchStockById = async (id) => {
  try {
    const response = await axiosInstance.get(`inventory/stocks/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching stock with ID ${id}:`, error);
    throw error;
  }
};

// Update stock
export const updateStock = async (id, stockData) => {
  try {
    const response = await axiosInstance.patch(`inventory/stocks/${id}/`, stockData);
    return response.data;
  } catch (error) {
    console.error(`❌ Error updating stock with ID ${id}:`, error);
    throw error;
  }
};

// Create new stock
export const createStock = async (stockData) => {
  try {
    const response = await axiosInstance.post('inventory/stocks/', stockData);
    return response.data;
  } catch (error) {
    console.error('❌ Error creating stock:', error);
    throw error;
  }
};

// Delete stock
export const deleteStock = async (id) => {
  try {
    const response = await axiosInstance.delete(`inventory/stocks/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error deleting stock with ID ${id}:`, error);
    throw error;
  }
};

// Fetch available products (missing export that was causing build error)
export const fetchAvailableProducts = async () => {
  try {
    const response = await axiosInstance.get('products/');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching available products:', error);
    throw error;
  }
};
