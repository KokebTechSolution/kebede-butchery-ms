import axios from 'axios';

const API = axios.create({ baseURL: '/api/' });

export const fetchDashboard = () => API.get('reports/branch-dashboard/');
export const fetchStaff = () => API.get('users/staff/');
export const addStaff = (data) => API.post('users/staff/', data);
export const fetchInventory = () => API.get('inventory/items/');
export const addInventory = (data) => API.post('inventory/items/', data);
export const fetchRequests = () => API.get('inventory/requests/');
export const approveRequest = (id, approved) => API.patch(`inventory/requests/${id}/`, { approved });
