import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import AnalyticsFilters from './components/AnalyticsFilters';

function getDateRange(range) {
  const today = new Date();
  let start, end;
  end = new Date(today);
  switch (range) {
    case 'Today':
      start = new Date(today);
      break;
    case 'This Week': {
      const day = today.getDay();
      start = new Date(today);
      start.setDate(today.getDate() - day);
      break;
    }
    case 'This Month':
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case 'This Year':
      start = new Date(today.getFullYear(), 0, 1);
      break;
    case 'Last Month': {
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      start = lastMonth;
      end = new Date(today.getFullYear(), today.getMonth(), 0);
      break;
    }
    case 'Last Quarter': {
      const currentQuarter = Math.floor(today.getMonth() / 3) + 1;
      const lastQuarter = currentQuarter - 1 || 4;
      const year = lastQuarter === 4 ? today.getFullYear() - 1 : today.getFullYear();
      start = new Date(year, (lastQuarter - 1) * 3, 1);
      end = new Date(year, lastQuarter * 3, 0);
      break;
    }
    default:
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
  }
  const fmt = d => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(end) };
}

const StaffPerformance = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('This Month');
  const [branchFilter, setBranchFilter] = useState('All');
  const [branchSummary, setBranchSummary] = useState(null);

  useEffect(() => {
    const { start, end } = getDateRange(dateRange);
    setLoading(true);
    axiosInstance.get(`/owner/staff-performance/?start=${start}&end=${end}`)
      .then(res => {
        setData(res.data.waiters);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch staff performance');
        setLoading(false);
      });
    // Fetch branch summary
    axiosInstance.get(`/owner/branch-performance/?start=${start}&end=${end}`)
      .then(res => {
        setBranchSummary(res.data.branches);
      })
      .catch(() => {
        setBranchSummary(null);
      });
  }, [dateRange]);

  // Get unique branches for filter dropdown
  const branches = Array.from(new Set(data.map(w => w.branch))).filter(b => b && b !== 'N/A');

  // Filter data by branch if selected
  const filteredData = branchFilter === 'All' ? data : data.filter(w => w.branch === branchFilter);

  // Get summary for selected branch
  let summary = null;
  if (branchSummary) {
    if (branchFilter === 'All') {
      // Sum all branches
      const totalRevenue = branchSummary.reduce((sum, b) => sum + b.totalRevenue, 0);
      const totalOrders = branchSummary.reduce((sum, b) => sum + b.totalOrders, 0);
      const grossProfit = branchSummary.reduce((sum, b) => sum + b.grossProfit, 0);
      summary = { branch: 'All Branches', totalRevenue, totalOrders, grossProfit };
    } else {
      const b = branchSummary.find(b => b.branch === branchFilter);
      if (b) summary = b;
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Performance</h1>
          <p className="text-gray-600">See how your waiters are performing: orders handled and total sales</p>
        </div>
        <AnalyticsFilters dateRange={dateRange} setDateRange={setDateRange} />
        <div className="mb-4 flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Branch:</label>
          <select
            value={branchFilter}
            onChange={e => setBranchFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
          >
            <option value="All">All Branches</option>
            {branches.map((b, i) => (
              <option key={i} value={b}>{b}</option>
            ))}
          </select>
        </div>
        {summary && (
          <div className="mb-6">
            <table className="min-w-full bg-white rounded-lg shadow-sm border border-gray-100">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Branch</th>
                  <th className="px-4 py-2 text-right">Total Revenue</th>
                  <th className="px-4 py-2 text-right">Total Orders</th>
                  <th className="px-4 py-2 text-right">Gross Profit</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2">{summary.branch}</td>
                  <td className="px-4 py-2 text-right">${summary.totalRevenue.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">{summary.totalOrders}</td>
                  <td className={`px-4 py-2 text-right ${summary.grossProfit < 0 ? 'text-red-600' : 'text-green-600'}`}>${summary.grossProfit.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-sm border border-gray-100">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Waiter</th>
                  <th className="px-4 py-2 text-left">Branch</th>
                  <th className="px-4 py-2 text-right">Total Orders</th>
                  <th className="px-4 py-2 text-right">Total Sales</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((w, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-2">{w.waiter}</td>
                    <td className="px-4 py-2">{w.branch}</td>
                    <td className="px-4 py-2 text-right">{w.totalOrders}</td>
                    <td className="px-4 py-2 text-right">${w.totalSales.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffPerformance; 