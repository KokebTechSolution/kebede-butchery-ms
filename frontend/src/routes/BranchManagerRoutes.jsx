// src/routes/BranchManagerRoutes.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';

import BranchManagerDashboard from '../pages/BranchManager/BranchManagerDashboard';

// Page Components
import DashboardHome from '../pages/BranchManager/DashboardHome'; // This is a new file you'll create for the homepage inside dashboard
import StaffListPage from '../pages/Staff/StaffListPage';
import AddStaffForm from '../pages/Staff/AddStaffForm';
import InventoryListPage from '../pages/Inventory/InventoryListPage';
import AddInventoryItem from '../pages/Inventory/AddInventoryItem';
import RequestsPage from '../pages/Requests/RequestsPage';

export default function BranchManagerRoutes() {
  return (
    <Routes>
      <Route path="/" element={<BranchManagerDashboard />}>
        <Route index element={<DashboardHome />} />
        <Route path="staff" element={<StaffListPage />} />
        <Route path="staff/add" element={<AddStaffForm />} />
        <Route path="inventory" element={<InventoryListPage />} />
        <Route path="inventory/add" element={<AddInventoryItem />} />
        <Route path="requests" element={<RequestsPage />} />
      </Route>
    </Routes>
  );
}
