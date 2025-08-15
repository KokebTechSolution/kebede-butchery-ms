import axiosInstance from './axiosInstance';

// Order Update Functions
export const createOrderUpdate = async (orderId, updateData) => {
  try {
    const response = await axiosInstance.post('/orders/updates/', {
      original_order_id: orderId,
      ...updateData
    });
    return response.data;
  } catch (error) {
    console.error('Failed to create order update:', error);
    throw new Error('Unable to create order update. Please try again.');
  }
};

export const getOrderUpdates = async (orderId) => {
  try {
    const response = await axiosInstance.get(`/orders/updates/${orderId}/`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch order updates:', error);
    throw new Error('Unable to fetch order updates. Please try again.');
  }
};

export const processOrderUpdate = async (updateId, action, notes = '', rejectionReason = '') => {
  try {
    const response = await axiosInstance.post(`/orders/updates/${updateId}/process/`, {
      action,
      notes,
      rejection_reason: rejectionReason
    });
    return response.data;
  } catch (error) {
    console.error('Failed to process order update:', error);
    throw new Error('Unable to process order update. Please try again.');
  }
};

export const getPendingUpdates = async () => {
  try {
    const response = await axiosInstance.get('/orders/pending-updates/');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch pending updates:', error);
    throw new Error('Unable to fetch pending updates. Please try again.');
  }
};

// Helper function to create an addition update
export const createOrderAddition = async (orderId, items, notes = '') => {
  return createOrderUpdate(orderId, {
    update_type: 'addition',
    items_changes: { items },
    notes
  });
};

// Helper function to create a modification update
export const createOrderModification = async (orderId, modifications, notes = '') => {
  return createOrderUpdate(orderId, {
    update_type: 'modification',
    items_changes: { modifications },
    notes
  });
};

// Helper function to create a removal update
export const createOrderRemoval = async (orderId, removals, notes = '') => {
  return createOrderUpdate(orderId, {
    update_type: 'removal',
    items_changes: { removals },
    notes
  });
};

