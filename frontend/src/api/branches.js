import axiosInstance from './axiosInstance';

// Fetch all branches
export const fetchBranches = async () => {
  try {
    const response = await axiosInstance.get('branches/tables/');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching branches:', error);
    throw error;
  }
};

// Create a new branch
export const createBranch = async (branchData) => {
  try {
    const response = await axiosInstance.post('branches/tables/', branchData);
    return response.data;
  } catch (error) {
    console.error('❌ Error creating branch:', error);
    throw error;
  }
};

// Update a branch
export const updateBranch = async (id, branchData) => {
  try {
    const response = await axiosInstance.patch(`branches/tables/${id}/`, branchData);
    return response.data;
  } catch (error) {
    console.error(`❌ Error updating branch with ID ${id}:`, error);
    throw error;
  }
};

// Delete a branch
export const deleteBranch = async (id) => {
  try {
    const response = await axiosInstance.delete(`branches/tables/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error deleting branch with ID ${id}:`, error);
    throw error;
  }
};
