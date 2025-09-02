// src/App.jsx
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import { DataCacheProvider } from './context/DataCacheContext';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import LoginPage from './pages/Auth/Login';

import Logout from './pages/Auth/Logout';
import Unauthorized from './pages/Error/Unauthorized';
import NotFound from './pages/Error/NotFound';

// Role-based Dashboards
import RoleBasedDashboard from './pages/RoleBasedDashboard';
import WaiterDashboard from './pages/waiter/WaiterDashboard';

// Role-specific route groups
import BranchManagerRoutes from './routes/BranchManagerRoutes';
// You can create: StaffRoutes, WaiterRoutes, etc. later

// Common Components
import Topbar from './components/ManagmentComponents/Topbar';
import Footer from './components/ManagmentComponents/Footer';
// import BottomNav from './components/ManagmentComponents/BottomNav'; // Optional if needed

// Layout Wrapper with dynamic Topbar/Sidebar
const Layout = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Optional: Add SidebarNav based on role */}
      {/* {user?.role === 'manager' && <SidebarNav />} */}

      <div className="flex-1 flex flex-col">
        {user?.isAuthenticated }
        <main className="p-4 flex-grow">{children}</main>
      </div>
    </div>
  );
};

// Conditional Topbar component
const ConditionalTopbar = () => {
  const location = useLocation();
  const isWaiterDashboard = location.pathname === '/waiter/dashboard';
  
  if (isWaiterDashboard) {
    return null; // No Topbar for waiter dashboard
  }
  
  return <Topbar />;
};

// Conditional main wrapper
const ConditionalMain = () => {
  const location = useLocation();
  const isWaiterDashboard = location.pathname === '/waiter/dashboard';
  
  return (
    <main className={`flex-1 ${isWaiterDashboard ? '' : 'mt-10'}`}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        {/* Role-Based Dashboard on root path */}
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
        {/* Waiter Dashboard Route */}
        <Route
          path="/waiter/dashboard"
          element={
            <ProtectedRoute allowedRoles={['waiter']}>
              <Layout>
                <WaiterDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        {/* TODO: Add routes for other roles like staff, waiter, etc.
        <Route
          path="/staff/*"
          element={
            <ProtectedRoute allowedRoles={['staff']}>
              <Layout>
                <StaffRoutes />
              </Layout>
            </ProtectedRoute>
          }
        /> */}
        {/* Catch-all 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
  );
};

function App() {
  return (
    <AuthProvider>
      <DataCacheProvider>
        <div className="min-h-screen flex flex-col bg-gray-100">
          <ConditionalTopbar />
          <ConditionalMain />
          <Footer />
          {/* <BottomNav /> */}
        </div>
      </DataCacheProvider>
    </AuthProvider>
  );
}

export default App;