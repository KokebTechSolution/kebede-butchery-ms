import React, { useState, useEffect } from 'react';
import { Calendar, MapPin } from 'lucide-react';
import axiosInstance from '../../../api/axiosInstance';
import { useAuth } from '../../../context/AuthContext';

const AnalyticsFilters = ({ dateRange, setDateRange, selectedBranch, setSelectedBranch }) => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // Fetch branches from backend
    const fetchBranches = async () => {
      try {
        const response = await axiosInstance.get('/owner/branches/');
        // Ensure branches is always an array
        setBranches(Array.isArray(response.data) ? response.data : []);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch branches:', error);
        setBranches([]); // Set empty array on error
        setLoading(false);
      }
    };

    fetchBranches();
  }, [user]);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
      
      {/* Date Range Selector */}
      <div className="flex items-center space-x-2">
        <Calendar className="w-4 h-4 text-gray-500" />
        <label htmlFor="dateRange" className="text-sm font-medium text-gray-700 whitespace-nowrap">
          Date Range:
        </label>
        <select
          id="dateRange"
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="ml-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
        >
          <option value="Today">Today</option>
          <option value="This Week">This Week</option>
          <option value="This Month">This Month</option>
          <option value="This Year">This Year</option>
          <option value="Last Month">Last Month</option>
          <option value="Last Quarter">Last Quarter</option>
        </select>
      </div>

      {/* Branch Selector */}
      <div className="flex items-center space-x-2">
        <MapPin className="w-4 h-4 text-gray-500" />
        <label htmlFor="branch" className="text-sm font-medium text-gray-700 whitespace-nowrap">
          Branch:
        </label>
        <select
          id="branch"
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          disabled={loading}
          className="ml-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="all">All Branches</option>
          {Array.isArray(branches) && branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
        {loading && <span className="text-xs text-gray-500">Loading branches...</span>}
      </div>
    </div>
  );
};

export default AnalyticsFilters;
