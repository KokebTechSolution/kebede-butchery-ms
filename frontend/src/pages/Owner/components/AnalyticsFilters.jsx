import React from 'react';
import { Calendar, MapPin } from 'lucide-react';

const AnalyticsFilters = ({ dateRange, setDateRange }) => {
  const [branch, setBranch] = React.useState('All Branches');

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
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

      <div className="flex items-center space-x-2">
        <MapPin className="w-4 h-4 text-gray-500" />
        <label htmlFor="branch" className="text-sm font-medium text-gray-700 whitespace-nowrap">
          Branch:
        </label>
        <select
          id="branch"
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          className="ml-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
        >
          <option value="All Branches">All Branches</option>
          <option value="Downtown Branch">Downtown Branch</option>
          <option value="Westside Branch">Westside Branch</option>
          <option value="Eastside Branch">Eastside Branch</option>
        </select>
      </div>
    </div>
  );
};

export default AnalyticsFilters;