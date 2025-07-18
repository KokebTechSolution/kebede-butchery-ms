import axios from 'axios';

// Helper to extract CSRF token from cookies
const getCookie = (name) => {
  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith(name + '='));
  return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
};

// Create axios instance with session support
const API = axios.create({
  baseURL: '/api/',
  withCredentials: true, // ensures cookies (sessionid, csrftoken) are sent
});

// GET requests — no CSRF token needed
export const fetchDashboard = () => API.get('reports/branch-dashboard/');
export const fetchStaff = () => API.get('users/staff/');
export const fetchInventory = () => API.get('inventory/items/');
export const fetchRequests = () => API.get('inventory/requests/');

// POST & PATCH — need CSRF token
export const addStaff = (data) =>
  API.post('users/staff/', data, {
    headers: { 'X-CSRFToken': getCookie('csrftoken') },
  });

export const addInventory = (data) =>
  API.post('inventory/items/', data, {
    headers: { 'X-CSRFToken': getCookie('csrftoken') },
  });

export const approveRequest = (id, approved) =>
  API.patch(
    `inventory/requests/${id}/`,
    { approved },
    {
      headers: { 'X-CSRFToken': getCookie('csrftoken') },
    }
  );
