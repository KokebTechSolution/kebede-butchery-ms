// src/App.jsx
import React, { Children } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Auth/Login';
import Logout from './pages/Auth/Logout';
import OwnerDashboard from './pages/Owner/OwnerDashboard';
import BranchManagerDashboard from './pages/BranchManager/BranchManagerDashboard';
import WaiterDashboard from './pages/waiter/WaiterDashboard';
import CashierDashboard from './pages/Cashier/CashierDashboard';
import BartenderDashboard from './pages/Bartender/BartenderDashboard';
import MeatDashboard from './pages/Meat/MeatDashboard';
import NotFound from './pages/Error/NotFound';
import Unauthorized from './pages/Error/Unauthorized';
import RoleBasedDashboard from './pages/RoleBasedDashboard';

// Role-specific route groups
import BranchManagerRoutes from './routes/BranchManagerRoutes';
// You can create: StaffRoutes, WaiterRoutes, etc. later

// Common Components
import Topbar from './components/ManagmentComponents/Topbar';
// import SidebarNav from './components/ManagmentComponents/SidebarNav'; // Optional if needed

// Layout Wrapper with dynamic Topbar/Sidebar
const Layout = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Optional: Add SidebarNav based on role */}
      {/* {user?.role === 'manager' && <SidebarNav />} */}

      <div className="flex-1 flex flex-col">
        {user?.isAuthenticated && <Topbar />}
        <main className="p-4 flex-grow">{children}</main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <NotificationProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/logout" element={<Logout />} />
            
            <Route path="/dashboard" element={<ProtectedRoute><RoleBasedDashboard /></ProtectedRoute>} />
            
            {/* Role-specific routes */}
            <Route path="/owner-dashboard" element={<ProtectedRoute requiredRole="owner"><OwnerDashboard /></ProtectedRoute>} />
            <Route path="/branch-manager-dashboard" element={<ProtectedRoute requiredRole="branch_manager"><BranchManagerDashboard /></ProtectedRoute>} />
            <Route path="/waiter-dashboard" element={<ProtectedRoute requiredRole="waiter"><WaiterDashboard /></ProtectedRoute>} />
            <Route path="/cashier-dashboard" element={<ProtectedRoute requiredRole="cashier"><CashierDashboard /></ProtectedRoute>} />
            <Route path="/bartender-dashboard" element={<ProtectedRoute requiredRole="bartender"><BartenderDashboard /></ProtectedRoute>} />
            <Route path="/meat-dashboard" element={<ProtectedRoute requiredRole="meat_area"><MeatDashboard /></ProtectedRoute>} />

            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </NotificationProvider>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
