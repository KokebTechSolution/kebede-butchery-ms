// src/pages/RoleBasedDashboard.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';

import BranchManagerDashboard from './BranchManager/BranchManagerDashboard';
import OwnerDashboard from './Owner/OwnerDashboard';
import CashierDashboard from './Cashier/CashierDashboard';
import MeatDashboard from './Meat/MeatDashboard';
import BartenderDashboard from './Bartender/BartenderDashboard';
import WaiterDashboard from './waiter/WaiterDashboard';


export default function RoleBasedDashboard() {
  const { user } = useAuth();

  if (!user?.isAuthenticated) {
    return <div className="text-center mt-10">Loading your dashboard...</div>;
  }

  switch (user.role) {
    case 'manager':
      return <BranchManagerDashboard />;
    case 'owner':
      return <OwnerDashboard />;
    case 'cashier':
      return <CashierDashboard />;
    case 'meat':
      return <MeatDashboard />;
    case 'bartender':
      return <BartenderDashboard />;
    case 'waiter':
      return <WaiterDashboard />;

    case 'staff':
      // You can either map staff to a dashboard or reuse another dashboard
      return <div className="text-center mt-10">Welcome Staff! Dashboard coming soon.</div>;
    default:
      return (
        <div className="text-red-600 text-center mt-20 font-semibold text-lg">
          ❌ You are not authorized to view any dashboard.
        </div>
      );
  }
}