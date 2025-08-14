import axiosInstance from './axiosInstance';

// Fetch all inventory items
export const fetchInventory = async () => {
  const response = await axiosInstance.get('inventory/products/');
  return response.data;
};

// Fetch single inventory item by ID
export const fetchInventoryById = async (id) => {
  const response = await axiosInstance.get(`inventory/products/${id}/`);
  return response.data;
};

// Restock an inventory item
export const restockInventory = async (id, restockData) => {
  const response = await axiosInstance.post(`inventory/products/${id}/restock/`, restockData);
  return response.data;
};

// Record a sale for an inventory item
export const sellInventory = async (id, saleData) => {
  const response = await axiosInstance.post(`inventory/products/${id}/sale/`, saleData);
  return response.data;
};

// Fetch item types
export const fetchItemTypes = async () => {
  const response = await axiosInstance.get('inventory/itemtypes/');
  return response.data;
};

// Fetch categories
export const fetchCategories = async () => {
  const response = await axiosInstance.get('inventory/categories/');
  return response.data;
};

// Fetch branches
export const fetchBranches = async () => {
  const response = await axiosInstance.get('inventory/branches/');
  return response.data;
};

// Fetch inventory requests
export const fetchRequests = async () => {
  const response = await axiosInstance.get('inventory/requests/');
  return response.data;
};

// Accept inventory request
export const acceptRequest = async (requestId, amount) => {
  const response = await axiosInstance.post(
    `inventory/requests/${requestId}/accept/`,
    { amount }  // ✅ Send amount in request body
  );
  return response.data;
};

// Reject inventory request
export const rejectRequest = async (requestId) => {
  const response = await axiosInstance.post(`inventory/requests/${requestId}/reject/`, {});
  return response.data;
};

// Cancel inventory request
export const cancelRequest = async (requestId) => {
  // If you have a cancel endpoint, use it. Otherwise, fallback to PATCH status.
  try {
    // Try POST to /requests/<id>/cancel/
    const response = await axiosInstance.post(
      `inventory/requests/${requestId}/cancel/`,
      {}
    );
    return response.data;
  } catch (err) {
    // If 404, fallback to PATCH status: 'cancelled'
    if (err.response && err.response.status === 404) {
      const patchRes = await axiosInstance.patch(
        `inventory/requests/${requestId}/`,
        { status: 'cancelled' }
      );
      return patchRes.data;
    }
    throw err;
  }
};

// Update inventory request (e.g., change quantity, unit, etc.)
export const updateRequest = async (requestId, updateData) => {
  const response = await axiosInstance.patch(
    `inventory/requests/${requestId}/`,
    updateData
  );
  return response.data;
};

// Fetch stocks
export const fetchStocks = async () => {
  const response = await axiosInstance.get('inventory/stocks/');
  return response.data;
};

// Mark request as reached
export const ReachRequest = async (id) => {
  const response = await axiosInstance.post(`inventory/requests/${id}/reach/`, null);
  return response.data;
};

// Mark request as not reached
export const NotReachRequest = async (id) => {
  const response = await axiosInstance.post(`inventory/requests/${id}/not_reach/`, null);
  return response.data;
};

export const createItemType = async (typeName) => {
  const response = await axiosInstance.post('inventory/itemtypes/', {
    type_name: typeName,
  });
  return response.data;
};

const addNewCategory = async (categoryName, itemTypeId) => {
  try {
    const response = await axiosInstance.post('inventory/categories/', {
      category_name: categoryName,
      item_type: itemTypeId,
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error creating category:', error.response?.data || error.message);
    throw error;
  }
};

export const fetchProductMeasurements = async (productId) => {
  const response = await axiosInstance.get(`inventory/productmeasurements/?product=${productId}`);
  return response.data;
};