import axiosInstance from './axiosInstance';

// Fetch all staff members
export const fetchStaff = async () => {
  try {
    const response = await axiosInstance.get('users/users/');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching staff:', error);
    throw error;
  }
};

// Create a new staff member
export const createStaff = async (staffData) => {
  try {
    const response = await axiosInstance.post('users/users/', staffData);
    return response.data;
  } catch (error) {
    console.error('❌ Error creating staff:', error);
    throw error;
  }
};

// Update a staff member
export const updateStaff = async (id, staffData) => {
  try {
    const response = await axiosInstance.patch(`users/${id}/`, staffData);
    return response.data;
  } catch (error) {
    console.error(`❌ Error updating staff with ID ${id}:`, error);
    throw error;
  }
};

// Delete a staff member
export const deleteStaff = async (id) => {
  try {
    const response = await axiosInstance.delete(`users/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error deleting staff with ID ${id}:`, error);
    throw error;
  }
};

// Fetch staff by role
export const fetchStaffByRole = async (role) => {
  try {
    const response = await axiosInstance.get(`users/?role=${role}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching staff by role ${role}:`, error);
    throw error;
  }
};

// Fetch staff by branch
export const fetchStaffByBranch = async (branchId) => {
  try {
    const response = await axiosInstance.get(`users/?branch=${branchId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching staff by branch ${branchId}:`, error);
    throw error;
  }
};
