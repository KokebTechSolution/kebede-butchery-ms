// src/routes/BranchManagerRoutes.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';

import BranchManagerDashboard from '../pages/BranchManager/BranchManagerDashboard';

// Page Components
import DashboardHome from '../pages/BranchManager/DashboardHome'; // This is a new file you'll create for the homepage inside dashboard
import StaffListPage from '../pages/Staff/StaffListPage';
import AddStaffForm from '../pages/Staff/AddStaffForm';
import ProductListPage from '../pages/Products/ProductListPage';
import AddProductsItem from '../pages/Products/AddProductsForm';
import RequestsPage from '../pages/Requests/RequestsPage';

export default function BranchManagerRoutes() {
  return (
    <Routes>
      <Route path="/" element={<BranchManagerDashboard />}>
        <Route index element={<DashboardHome />} />
        <Route path="staff" element={<StaffListPage />} />
        <Route path="staff/add" element={<AddStaffForm />} />
        <Route path="products" element={<ProductListPage />} />
        <Route path="products/add" element={<AddProductsItem />} />
        <Route path="requests" element={<RequestsPage />} />
      </Route>
    </Routes>
  );
}
