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

const BranchPerformance = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('This Month');

  useEffect(() => {
    const { start, end } = getDateRange(dateRange);
    setLoading(true);
    setError(null);

    axiosInstance.get(`/owner/branch-performance/?start=${start}&end=${end}`)
      .then(res => {
        setData(res.data.branches);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch branch performance:', err);
        setError('Failed to fetch branch performance');
        setLoading(false);
      });
  }, [dateRange]);

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Branch Performance</h1>
          <p className="text-gray-600">Compare revenue, orders, and profit across all branches</p>
        </div>
        <AnalyticsFilters dateRange={dateRange} setDateRange={setDateRange} />
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : data.length === 0 ? (
          <div className="text-center text-gray-500">No branch data available for selected date range.</div>
        ) : (
          <div className="overflow-x-auto">
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
                {data.map((b) => (
                  <tr key={b.branch} className="border-t">
                    <td className="px-4 py-2">{b.branch}</td>
                    <td className="px-4 py-2 text-right">ETB {b.totalRevenue.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">{b.totalOrders}</td>
                    <td className={`px-4 py-2 text-right ${b.grossProfit < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                              ETB {b.grossProfit.toLocaleString()}
                    </td>
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

export default BranchPerformance;
