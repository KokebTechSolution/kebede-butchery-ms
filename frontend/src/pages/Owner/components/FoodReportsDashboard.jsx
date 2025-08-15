import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Package, XCircle } from 'lucide-react';
import { useFoodReports } from '../../Meat/hooks/useReports';

const COLORS = ['#10b981', '#ef4444'];

const FoodReportsDashboard = () => {
  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const [filterDate, setFilterDate] = useState(getTodayDateString());
  const { foodReports, loading } = useFoodReports(filterDate);

  // Safely access data with default values
  const reportData = foodReports || {};
  const totalSold = reportData.totalSold || 0;
  const totalRejected = reportData.totalRejected || 0;
  const yesterdayTotalSold = reportData.yesterdayTotalSold || 0;
  const yesterdayTotalRejected = reportData.yesterdayTotalRejected || 0;
  const dailySales = reportData.dailySales || [];

  const pieData = [
    { name: 'Sold', value: totalSold, color: '#10b981' },
    { name: 'Rejected', value: totalRejected, color: '#ef4444' },
  ];

  const comparisonData = [
    {
      period: 'Yesterday',
      sold: yesterdayTotalSold,
      rejected: yesterdayTotalRejected,
    },
    {
      period: 'Today',
      sold: totalSold,
      rejected: totalRejected,
    },
  ];

  const soldChange = totalSold - yesterdayTotalSold;
  const rejectedChange = totalRejected - yesterdayTotalRejected;

  // Show loading state
  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading reports...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <label htmlFor="food-report-date-filter" className="font-medium">Filter by Date:</label>
        <input
          id="food-report-date-filter"
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          className="p-2 border rounded"
        />
      </div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#111416] mb-2">Items Reports Dashboard</h1>
        <p className="text-[#6b7582]">Track your food sales and performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3 mb-2">
            <Package className="h-4 w-4 text-green-600" />
            <h3 className="text-sm font-medium">Total Sold Today</h3>
          </div>
          <div className="text-2xl font-bold text-green-600">{totalSold}</div>
          <div className="flex items-center text-xs text-muted-foreground">
            {soldChange >= 0 ? (
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
            )}
            <span className={soldChange >= 0 ? 'text-green-600' : 'text-red-600'}>
              {soldChange >= 0 ? '+' : ''}{soldChange} from yesterday
            </span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <h3 className="text-sm font-medium">Total Rejected Today</h3>
          </div>
          <div className="text-2xl font-bold text-red-600">{totalRejected}</div>
          <div className="flex items-center text-xs text-muted-foreground">
            {rejectedChange <= 0 ? (
              <TrendingDown className="h-3 w-3 text-green-600" />
            ) : (
              <TrendingUp className="h-3 w-3 text-red-600" />
            )}
            <span className={rejectedChange <= 0 ? 'text-green-600' : 'text-red-600'}>
              {rejectedChange >= 0 ? '+' : ''}{rejectedChange} from yesterday
            </span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-medium">Success Rate</h3>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {totalSold + totalRejected > 0
              ? Math.round((totalSold / (totalSold + totalRejected)) * 100)
              : 0
            }%
          </div>
          <p className="text-xs text-muted-foreground">Orders successfully completed</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3 mb-2">
            <Package className="h-4 w-4 text-purple-600" />
            <h3 className="text-sm font-medium">Total Orders</h3>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {totalSold + totalRejected}
          </div>
          <p className="text-xs text-muted-foreground">All food orders processed today</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Today vs Yesterday Comparison</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sold" fill="#10b981" name="Sold" />
              <Bar dataKey="rejected" fill="#ef4444" name="Rejected" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Today's Order Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Trend */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold mb-4">Weekly Performance Trend</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={dailySales}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={value => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis />
            <Tooltip
              labelFormatter={value => new Date(value).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            />
            <Bar dataKey="sold" fill="#10b981" name="Sold Orders" />
            <Bar dataKey="rejected" fill="#ef4444" name="Rejected Orders" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FoodReportsDashboard; 