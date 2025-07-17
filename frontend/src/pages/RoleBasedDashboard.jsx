// src/pages/RoleBasedDashboard.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

import BranchManagerDashboard from './BranchManager/BranchManagerDashboard';
import OwnerDashboard from './Owner/OwnerDashboard';
import CashierDashboard from './Cashier/CashierDashboard';
import MeatDashboard from './Meat/MeatDashboard';
import BartenderDashboard from './Bartender/BartenderDashboard';
import WaiterDashboard from './waiter/WaiterDashboard';
import Unauthorized from './Error/Unauthorized';
import './../i18n';

const RoleBasedDashboard = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  if (!user) {
    return (
      <div>
        <h1>{t('unauthorized')}</h1>
        <Unauthorized />
      </div>
    );
  }

  switch (user.role) {
    case 'owner':
      return (
        <div>
          <h1>{t('owner_dashboard')}</h1>
          <OwnerDashboard />
        </div>
      );
    case 'manager':
      return (
        <div>
          <h1>{t('manager_dashboard')}</h1>
          <BranchManagerDashboard />
        </div>
      );
    case 'waiter':
      return (
        <div>
          <h1>{t('waiter_dashboard')}</h1>
          <WaiterDashboard />
        </div>
      );
    case 'cashier':
      return (
        <div>
          <h1>{t('cashier_dashboard')}</h1>
          <CashierDashboard />
        </div>
      );
    case 'bartender':
      return (
        <div>
          <h1>{t('bartender_dashboard')}</h1>
          <BartenderDashboard />
        </div>
      );
    case 'meat':
      return (
        <div>
          <h1>{t('meat_dashboard')}</h1>
          <MeatDashboard />
        </div>
      );
    default:
      return (
        <div>
          <h1>{t('unauthorized')}</h1>
          <Unauthorized />
        </div>
      );
  }
};

export default RoleBasedDashboard;