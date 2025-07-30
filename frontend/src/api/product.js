import axiosInstance from './axiosInstance';

// Fetch all products
export const fetchProducts = async () => {
  try {
    const response = await axiosInstance.get('products/');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    throw error;
  }
};

// Fetch product by ID
export const fetchProductById = async (id) => {
  try {
    const response = await axiosInstance.get(`products/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching product with ID ${id}:`, error);
    throw error;
  }
};

// Create new product
export const createProduct = async (productData) => {
  try {
    const response = await axiosInstance.post('products/', productData);
    return response.data;
  } catch (error) {
    console.error('❌ Error creating product:', error);
    throw error;
  }
};

// Update product
export const updateProduct = async (id, productData) => {
  try {
    const response = await axiosInstance.patch(`products/${id}/`, productData);
    return response.data;
  } catch (error) {
    console.error(`❌ Error updating product with ID ${id}:`, error);
    throw error;
  }
};

// Delete product
export const deleteProduct = async (id) => {
  try {
    const response = await axiosInstance.delete(`products/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error deleting product with ID ${id}:`, error);
    throw error;
  }
};

// Fetch products by category
export const fetchProductsByCategory = async (categoryId) => {
  try {
    const response = await axiosInstance.get(`products/?category=${categoryId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching products by category ${categoryId}:`, error);
    throw error;
  }
};

export const fetchItemTypes = async () => {
  try {
    const response = await axiosInstance.get('item-types/');
    return response.data;
  } catch (error) {
    console.error('Error fetching item types:', error);
    throw error;
  }
};
