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

  // Standardize group names to lowercase for case-insensitive matching
  const userGroups = user.groups?.map(g => g.toLowerCase()) || [];

  if (userGroups.includes('manager')) {
    return <BranchManagerDashboard />;
  }
  if (userGroups.includes('owner')) {
    return <OwnerDashboard />;
  }
  if (userGroups.includes('cashier')) {
    return <CashierDashboard />;
  }
  if (userGroups.includes('meat')) {
    return <MeatDashboard />;
  }
  if (userGroups.includes('bartender')) {
    return <BartenderDashboard />;
  }
  if (userGroups.includes('waiter')) {
    return <WaiterDashboard />;
  }
  if (userGroups.includes('staff')) {
    return <div className="text-center mt-10">Welcome Staff! Dashboard coming soon.</div>;
  }

  // Fallback for any other case
  return (
    <div className="text-red-600 text-center mt-20 font-semibold text-lg">
      ❌ You are not authorized to view any dashboard.
    </div>
  );
}
