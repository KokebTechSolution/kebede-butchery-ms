// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';

// Public Pages
import LoginPage from './pages/Auth/Login';
import Logout from './pages/Auth/Logout';
import Unauthorized from './pages/Error/Unauthorized';
import NotFound from './pages/Error/NotFound';

// Dashboards
import RoleBasedDashboard from './pages/RoleBasedDashboard';
import WaiterDashboard from './pages/waiter/WaiterDashboard';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import CashierDashboard from './pages/cashier/CashierDashboard';
import BartenderDashboard from './pages/bartender/BartenderDashboard';

// Route Groups
import BranchManagerRoutes from './routes/BranchManagerRoutes';

// Layout Components
import Topbar from './components/ManagmentComponents/Topbar';

// Layout Wrapper
const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 flex flex-col">
        <main className="p-4 flex-grow">{children}</main>
      </div>
    </div>
  );
};

// App Content with Auth Context
const AppContent = () => {
  const { user } = useAuth();
  const location = useLocation();

  const hideTopbar = location.pathname === '/login' || location.pathname === '/logout';

  return (
    <>
      {user?.isAuthenticated && !hideTopbar && <Topbar />}

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" />} />

        {/* General Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['manager', 'staff', 'waiter', 'owner', 'cashier', 'bartender', 'meat']}>
              <Layout>
                <RoleBasedDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Role Dashboards */}
        <Route
          path="/owner-dashboard"
          element={
            <ProtectedRoute requiredRole="owner">
              <Layout>
                <OwnerDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/waiter-dashboard"
          element={
            <ProtectedRoute requiredRole="waiter">
              <Layout>
                <WaiterDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/cashier-dashboard"
          element={
            <ProtectedRoute requiredRole="cashier">
              <Layout>
                <CashierDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/bartender-dashboard"
          element={
            <ProtectedRoute requiredRole="bartender">
              <Layout>
                <BartenderDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Branch Manager Nested Routes */}
        <Route
          path="/branch-manager/*"
          element={
            <ProtectedRoute requiredRole="manager">
              <Layout>
                <BranchManagerRoutes />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

// Wrap everything in providers
const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <NotificationProvider>
          <Router>
            <AppContent />
          </Router>
        </NotificationProvider>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
