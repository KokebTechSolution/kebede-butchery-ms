import React, { useState } from 'react';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import StaffPerformance from './StaffPerformance';
import StaffListPage from '../Staff/StaffListPage';
import FoodReportsDashboard from './components/FoodReportsDashboard';

function OwnerDashboard() {
  const [screen, setScreen] = useState('analytics');

  return (
    <div className="p-4">
      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded ${
            screen === 'analytics' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
          onClick={() => setScreen('analytics')}
        >
          Analytics
        </button>
        <button
          className={`px-4 py-2 rounded ${
            screen === 'foodreports' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
          onClick={() => setScreen('foodreports')}
        >
          Food Reports
        </button>
        <button
          className={`px-4 py-2 rounded ${
            screen === 'staff' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
          onClick={() => setScreen('staff')}
        >
          Staff Performance
        </button>
        <button
          className={`px-4 py-2 rounded ${
            screen === 'staffmgmt' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
          onClick={() => setScreen('staffmgmt')}
        >
          Staff Management
        </button>
      </div>

      {screen === 'analytics' && <AnalyticsDashboard />}
      {screen === 'foodreports' && <FoodReportsDashboard />}
      {screen === 'staff' && <StaffPerformance />}
      {screen === 'staffmgmt' && <StaffListPage />}
    </div>
  );
}

export default OwnerDashboard;
