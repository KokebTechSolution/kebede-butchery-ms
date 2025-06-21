// api/stafflist.js
import axios from 'axios';

const API_URL = 'http://localhost:8000/api/users/users/';

const getToken = () => localStorage.getItem('access');

export const fetchStaffList = async () => {
  const response = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return response.data;
};

export const updateUser = async (id, formData) => {
  const response = await axios.put(`${API_URL}${id}/`, formData, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return response.data;
};

export const deleteUser = async (id) => {
  await axios.delete(`${API_URL}${id}/`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
};
