import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Package, Calculator, Target } from 'lucide-react';
import axiosInstance from '../../../api/axiosInstance';
import KpiCard from './KpiCard';
import AnalyticsFilters from './AnalyticsFilters';
import ProfitLossChart from './ProfitLossChart';
import TopItemsChart from './TopItemsChart';

// Helper to get start/end dates for a given range
function getDateRange(range) {
  const today = new Date();
  let start, end;
  end = new Date(today);

  switch (range) {
    case 'Today':
      start = new Date(today);
      break;
    case 'This Week':
      start = new Date(today);
      start.setDate(today.getDate() - today.getDay());
      break;
    case 'This Month':
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case 'This Year':
      start = new Date(today.getFullYear(), 0, 1);
      break;
    case 'Last Month':
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
      break;
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

const AnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('This Month');

  useEffect(() => {
    const { start, end } = getDateRange(dateRange);
    setLoading(true);
    axiosInstance.get(`/owner/dashboard/?start=${start}&end=${end}`)
      .then(response => {
        setAnalyticsData(response.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch analytics data');
        setLoading(false);
      });
  }, [dateRange]);

  if (loading) return <div>Loading analytics...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!analyticsData) return <div>No analytics data available.</div>;

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          </div>
          <p className="text-gray-600">Track your butchery business performance and key metrics</p>
        </div>

        {/* Filters */}
        <AnalyticsFilters dateRange={dateRange} setDateRange={setDateRange} />

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <KpiCard title="Total Revenue" value={analyticsData.kpi.totalRevenue} isCurrency />
          <KpiCard title="Cost of Inventory" value={analyticsData.kpi.costOfInventory} isCurrency />
          <KpiCard title="Profit of Inventory" value={analyticsData.kpi.profitOfInventory} isCurrency isProfitLoss />
          <KpiCard title="Operating Expenses" value={analyticsData.kpi.operatingExpenses} isCurrency />
          <KpiCard title="Net Profit" value={analyticsData.kpi.netProfit} isCurrency isProfitLoss />
          <KpiCard title="Avg Order Value" value={analyticsData.kpi.avgOrderValue} isCurrency />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Profit & Loss Chart */}
          <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-6">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Profit & Loss Trend</h2>
            </div>
            <ProfitLossChart data={analyticsData.profitTrend.map(pt => ({
              ...pt,
              costs: analyticsData.kpi.costOfInventory // or pt.costOfInventory if available per period
            }))} />
          </div>

          {/* Top Selling Items Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-6">
              <Package className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Top Selling Items</h2>
            </div>
            <TopItemsChart data={analyticsData.topSellingItems} />
          </div>
        </div>

        {/* Additional Insights */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Profit Margin */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-4">
              <Calculator className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Profit Margin</h3>
            </div>
            <p className="text-2xl font-bold text-green-600 mb-2">
              {((analyticsData.kpi.netProfit / analyticsData.kpi.totalRevenue) * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600">
              Strong profit margins indicate efficient operations and good pricing strategy.
            </p>
          </div>

          {/* Revenue Growth */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-4">
              <Target className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Revenue Growth</h3>
            </div>
            <p className="text-2xl font-bold text-blue-600 mb-2">+12.5%</p>
            <p className="text-sm text-gray-600">
              Month-over-month revenue growth showing steady business expansion.
            </p>
          </div>

          {/* Cost Efficiency */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-4">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Cost Efficiency</h3>
            </div>
            <p className="text-2xl font-bold text-purple-600 mb-2">
              {((analyticsData.kpi.costOfInventory / analyticsData.kpi.totalRevenue) * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600">
              Cost of inventory as percentage of revenue, indicating operational efficiency.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
