// src/routes/BranchManagerRoutes.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import BranchManagerDashboard from '../pages/BranchManager/BranchManagerDashboard';
import StaffListPage from '../pages/Staff/StaffListPage';
import InventoryListPage from '../pages/Inventory/InventoryListPage';

export default function BranchManagerRoutes() {
  return (
    <Routes>
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <BranchManagerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <StaffListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <InventoryListPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
