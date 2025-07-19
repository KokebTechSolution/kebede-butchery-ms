import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Helper to get CSRF token
function getCSRFToken() {
  const match = document.cookie.match(/csrftoken=([\w-]+)/);
  return match ? match[1] : null;
}

// Configure axios defaults
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add CSRF token
apiClient.interceptors.request.use((config) => {
  const csrfToken = getCSRFToken();
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  return config;
});

// Item Types
export const fetchItemTypes = async () => {
  try {
    const response = await apiClient.get('/inventory/itemtypes/');
    return response.data;
  } catch (error) {
    console.error('Error fetching item types:', error);
    throw error;
  }
};

export const createItemType = async (itemTypeData) => {
  try {
    const response = await apiClient.post('/inventory/itemtypes/', itemTypeData);
    return response.data;
  } catch (error) {
    console.error('Error creating item type:', error);
    throw error;
  }
};

// Categories
export const fetchCategories = async () => {
  try {
    const response = await apiClient.get('/inventory/categories/');
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const createCategory = async (categoryData) => {
  try {
    const response = await apiClient.post('/inventory/categories/', categoryData);
    return response.data;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

// Products
export const fetchProducts = async () => {
  try {
    const response = await apiClient.get('/inventory/inventory/');
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const fetchComprehensiveInventory = async () => {
  try {
    const response = await apiClient.get('/inventory/inventory/comprehensive_inventory/');
    return response.data;
  } catch (error) {
    console.error('Error fetching comprehensive inventory:', error);
    throw error;
  }
};

export const createProduct = async (productData) => {
  try {
    const formData = new FormData();
    
    // Add basic product fields
    formData.append('name', productData.name);
    formData.append('category_id', productData.category_id);
    formData.append('base_unit', productData.base_unit);
    formData.append('price_per_unit', productData.price_per_unit);
    
    // Add receipt image if provided
    if (productData.receipt_image) {
      formData.append('receipt_image', productData.receipt_image);
    }

    const response = await apiClient.post('/inventory/inventory/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

export const updateProduct = async (productId, productData) => {
  try {
    const formData = new FormData();
    
    // Add basic product fields
    formData.append('name', productData.name);
    formData.append('category_id', productData.category_id);
    formData.append('base_unit', productData.base_unit);
    formData.append('price_per_unit', productData.price_per_unit);
    
    // Add receipt image if provided
    if (productData.receipt_image) {
      formData.append('receipt_image', productData.receipt_image);
    }

    const response = await apiClient.patch(`/inventory/inventory/${productId}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const deleteProduct = async (productId) => {
  try {
    const response = await apiClient.delete(`/inventory/inventory/${productId}/`);
    return response.data;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Stocks
export const fetchStocks = async () => {
  try {
    const response = await apiClient.get('/inventory/stocks/');
    return response.data;
  } catch (error) {
    console.error('Error fetching stocks:', error);
    throw error;
  }
};

export const createStock = async (stockData) => {
  try {
    const response = await apiClient.post('/inventory/stocks/', stockData);
    return response.data;
  } catch (error) {
    console.error('Error creating stock:', error);
    throw error;
  }
};

export const updateStock = async (stockId, stockData) => {
  try {
    const response = await apiClient.patch(`/inventory/stocks/${stockId}/`, stockData);
    return response.data;
  } catch (error) {
    console.error('Error updating stock:', error);
    throw error;
  }
};

// Stock Units
export const fetchStockUnits = async () => {
  try {
    const response = await apiClient.get('/inventory/stockunits/');
    return response.data;
  } catch (error) {
    console.error('Error fetching stock units:', error);
    throw error;
  }
};

export const createStockUnit = async (stockUnitData) => {
  try {
    const response = await apiClient.post('/inventory/stockunits/', stockUnitData);
    return response.data;
  } catch (error) {
    console.error('Error creating stock unit:', error);
    throw error;
  }
};

// Inventory Transactions
export const fetchTransactions = async () => {
  try {
    const response = await apiClient.get('/inventory/transactions/');
    return response.data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

export const createTransaction = async (transactionData) => {
  try {
    const response = await apiClient.post('/inventory/transactions/', transactionData);
    return response.data;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

// Product-specific transactions
export const restockProduct = async (productId, restockData) => {
  try {
    const response = await apiClient.post(`/inventory/inventory/${productId}/restock/`, restockData);
    return response.data;
  } catch (error) {
    console.error('Error restocking product:', error);
    throw error;
  }
};

export const sellProduct = async (productId, saleData) => {
  try {
    const response = await apiClient.post(`/inventory/inventory/${productId}/sale/`, saleData);
    return response.data;
  } catch (error) {
    console.error('Error selling product:', error);
    throw error;
  }
};

export const recordWastage = async (productId, wastageData) => {
  try {
    const response = await apiClient.post(`/inventory/inventory/${productId}/wastage/`, wastageData);
    return response.data;
  } catch (error) {
    console.error('Error recording wastage:', error);
    throw error;
  }
};

export const getProductHistory = async (productId) => {
  try {
    const response = await apiClient.get(`/inventory/inventory/${productId}/history/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching product history:', error);
    throw error;
  }
};

// Inventory Requests
export const fetchInventoryRequests = async () => {
  try {
    const response = await apiClient.get('/inventory/requests/');
    return response.data;
  } catch (error) {
    console.error('Error fetching inventory requests:', error);
    throw error;
  }
};

export const createInventoryRequest = async (requestData) => {
  try {
    const response = await apiClient.post('/inventory/requests/', requestData);
    return response.data;
  } catch (error) {
    console.error('Error creating inventory request:', error);
    throw error;
  }
};

export const acceptInventoryRequest = async (requestId) => {
  try {
    const response = await apiClient.post(`/inventory/requests/${requestId}/accept/`);
    return response.data;
  } catch (error) {
    console.error('Error accepting inventory request:', error);
    throw error;
  }
};

export const rejectInventoryRequest = async (requestId) => {
  try {
    const response = await apiClient.post(`/inventory/requests/${requestId}/reject/`);
    return response.data;
  } catch (error) {
    console.error('Error rejecting inventory request:', error);
    throw error;
  }
};

export const markRequestReached = async (requestId) => {
  try {
    const response = await apiClient.post(`/inventory/requests/${requestId}/reach/`);
    return response.data;
  } catch (error) {
    console.error('Error marking request as reached:', error);
    throw error;
  }
};

// Branches
export const fetchBranches = async () => {
  try {
    const response = await apiClient.get('/inventory/branches/');
    return response.data;
  } catch (error) {
    console.error('Error fetching branches:', error);
    throw error;
  }
};

// Barman Stock
export const fetchBarmanStock = async () => {
  try {
    const response = await apiClient.get('/inventory/barman-stock/');
    return response.data;
  } catch (error) {
    console.error('Error fetching barman stock:', error);
    throw error;
  }
};

export const createBarmanStock = async (barmanStockData) => {
  try {
    const response = await apiClient.post('/inventory/barman-stock/', barmanStockData);
    return response.data;
  } catch (error) {
    console.error('Error creating barman stock:', error);
    throw error;
  }
};

export const updateBarmanStock = async (barmanStockId, barmanStockData) => {
  try {
    const response = await apiClient.patch(`/inventory/barman-stock/${barmanStockId}/`, barmanStockData);
    return response.data;
  } catch (error) {
    console.error('Error updating barman stock:', error);
    throw error;
  }
};

// Combined function to create product with stock
export const createProductWithStock = async (productData, stockData) => {
  try {
    // Step 1: Create the product
    const product = await createProduct(productData);
    
    // Step 2: Create the stock with the product ID
    const stock = await createStock({
      ...stockData,
      product_id: product.id,
    });
    
    return { product, stock };
  } catch (error) {
    console.error('Error creating product with stock:', error);
    throw error;
  }
};

// Utility functions
export const getProductById = async (productId) => {
  try {
    const response = await apiClient.get(`/inventory/inventory/${productId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    throw error;
  }
};

export const getStockByProductAndBranch = async (productId, branchId) => {
  try {
    const response = await apiClient.get(`/inventory/stocks/?product=${productId}&branch=${branchId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching stock by product and branch:', error);
    throw error;
  }
};

// Additional functions for backward compatibility with existing components

// Alias for fetchInventoryRequests (used by some components)
export const fetchRequests = fetchInventoryRequests;

// Alias for markRequestReached (used by some components)
export const ReachRequest = markRequestReached;

// Function to mark request as not reached
export const NotReachRequest = async (requestId) => {
  try {
    const response = await apiClient.post(`/inventory/requests/${requestId}/not_reach/`);
    return response.data;
  } catch (error) {
    console.error('Error marking request as not reached:', error);
    throw error;
  }
};

// Barman Stock Management
export const consumeBarmanStockItem = async (barmanStockId, quantity) => {
  try {
    const response = await apiClient.post(`/inventory/barman-stock/${barmanStockId}/use_item/`, {
      quantity: quantity
    });
    return response.data;
  } catch (error) {
    console.error('Error using barman stock item:', error);
    throw error;
  }
};

export const returnBarmanStockItem = async (barmanStockId, quantity) => {
  try {
    const response = await apiClient.post(`/inventory/barman-stock/${barmanStockId}/return_item/`, {
      quantity: quantity
    });
    return response.data;
  } catch (error) {
    console.error('Error returning barman stock item:', error);
    throw error;
  }
};

// Alias for sellProduct (used by some components)
export const sellInventory = sellProduct;

// Alias for acceptInventoryRequest (used by some components)
export const acceptRequest = acceptInventoryRequest;

// Alias for rejectInventoryRequest (used by some components)
export const rejectRequest = rejectInventoryRequest;

export default {
  // Item Types
  fetchItemTypes,
  createItemType,
  
  // Categories
  fetchCategories,
  createCategory,
  
  // Products
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  
  // Stocks
  fetchStocks,
  createStock,
  updateStock,
  getStockByProductAndBranch,
  
  // Stock Units
  fetchStockUnits,
  createStockUnit,
  
  // Transactions
  fetchTransactions,
  createTransaction,
  restockProduct,
  sellProduct,
  recordWastage,
  getProductHistory,
  
  // Inventory Requests
  fetchInventoryRequests,
  fetchRequests, // Alias
  createInventoryRequest,
  acceptInventoryRequest,
  acceptRequest, // Alias
  rejectInventoryRequest,
  rejectRequest, // Alias
  markRequestReached,
  ReachRequest, // Alias
  NotReachRequest,
  
  // Sales
  sellInventory, // Alias
  
  // Branches
  fetchBranches,
  
  // Barman Stock
  fetchBarmanStock,
  createBarmanStock,
  updateBarmanStock,
  consumeBarmanStockItem,
  returnBarmanStockItem,
  
  // Combined operations
  createProductWithStock,
};