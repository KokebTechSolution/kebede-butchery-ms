// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/Auth/Login';
import Unauthorized from './pages/Error/Unauthorized';
import NotFound from './pages/Error/NotFound';

import RoleBasedDashboard from './pages/RoleBasedDashboard';

import BranchManagerRoutes from './routes/BranchManagerRoutes';
// You can create similar route files for other roles like StaffRoutes, WaiterRoutes, etc.

import Topbar from './components/ManagmentComponents/Topbar';

// Layout wrapper to add Topbar and sidebar per role if needed
const Layout = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* You can add dynamic sidebar here based on user.role */}
      {/* {user?.role === 'branch_manager' && <SidebarNav />} */}

      <div className="flex-1 flex flex-col">
        {user?.isAuthenticated && <Topbar />}
        <main className="p-4 flex-grow">{children}</main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={['manager', 'staff', 'waiter', 'owner', 'cashier', 'bartender', 'meat']}>
              <Layout>
                <RoleBasedDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Branch Manager Routes */}
        <Route
          path="/branch-manager/*"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <Layout>
                <BranchManagerRoutes />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* You can add other role-specific route groups here */}
        {/* <Route path="/staff/*" element={<ProtectedRoute ...><Layout><StaffRoutes /></Layout></ProtectedRoute>} /> */}

        {/* Catch-all 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
