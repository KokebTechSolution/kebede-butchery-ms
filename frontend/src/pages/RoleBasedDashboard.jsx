// src/pages/RoleBasedDashboard.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';

import BranchManagerDashboard from './BranchManager/BranchManagerDashboard';
import OwnerDashboard from './Owner/OwnerDashboard';
import CashierDashboard from './Cashier/CashierDashboard';
import MeatDashboard from './Meat/MeatDashboard';
import BartenderDashboard from './Bartender/BartenderDashboard';
import WaiterDashboard from './waiter/WaiterDashboard';
import Unauthorized from './Error/Unauthorized';

const RoleBasedDashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return <Unauthorized />;
  }

  switch (user.role) {
    case 'owner':
      return <OwnerDashboard />;
    case 'manager':
      return <BranchManagerDashboard />;
    case 'waiter':
      return <WaiterDashboard />;
    case 'cashier':
      return <CashierDashboard />;
    case 'bartender':
      return <BartenderDashboard />;
    case 'meat':
      return <MeatDashboard />;
    default:
      return <Unauthorized />;
  }
};

export default RoleBasedDashboard;