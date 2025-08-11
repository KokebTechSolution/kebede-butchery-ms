// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
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
// import SidebarNav from './components/ManagmentComponents/SidebarNav'; // Optional if needed

// Layout Wrapper with dynamic Topbar/Sidebar
const Layout = ({ children }) => {
  const { user, isInitialized } = useAuth();

  // Don't render layout until authentication is initialized
  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  // Only render layout for authenticated users
  if (!user?.isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Optional: Add SidebarNav based on role */}
      {/* {user?.role === 'manager' && <SidebarNav />} */}

      <div className="flex-1 flex flex-col">
        <main className="p-4 flex-grow">{children}</main>
      </div>
    </div>
  );
};

// AppContent component that uses the auth context
const AppContent = () => {
  const { user, isInitialized } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Only show Topbar for authenticated users */}
      {user?.isAuthenticated && <Topbar />}
      
      <main className="flex-1">
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
      
      {/* Only show Footer for authenticated users */}
      {user?.isAuthenticated && <Footer />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;