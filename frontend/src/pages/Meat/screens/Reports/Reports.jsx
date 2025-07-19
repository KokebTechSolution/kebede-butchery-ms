import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Package, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useReports } from '../../hooks/useReports';

const COLORS = ['#10b981', '#ef4444'];

export const Reports = () => {
  // Use today's date by default
  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const [filterDate, setFilterDate] = useState(getTodayDateString());
  const { reportData } = useReports(filterDate);

  const pieData = [
    { name: 'Sold', value: reportData.totalSold, color: '#10b981' },
    { name: 'Rejected', value: reportData.totalRejected, color: '#ef4444' },
  ];

  const comparisonData = [
    {
      period: 'Yesterday',
      sold: reportData.yesterdayTotalSold,
      rejected: reportData.yesterdayTotalRejected,
    },
    {
      period: 'Today',
      sold: reportData.totalSold,
      rejected: reportData.totalRejected,
    },
  ];

  const soldChange = reportData.totalSold - reportData.yesterdayTotalSold;
  const rejectedChange = reportData.totalRejected - reportData.yesterdayTotalRejected;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <label htmlFor="report-date-filter" className="font-medium">Filter by Date:</label>
        <input
          id="report-date-filter"
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          className="p-2 border rounded"
        />
      </div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#111416] mb-2">Reports Dashboard</h1>
        <p className="text-[#6b7582]">Track your daily performance and trends</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sold Today</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{reportData.totalSold}</div>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rejected Today</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{reportData.totalRejected}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {rejectedChange <= 0 ? (
                <TrendingDown className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingUp className="h-3 w-3 text-red-600 mr-1" />
              )}
              <span className={rejectedChange <= 0 ? 'text-green-600' : 'text-red-600'}>
                {rejectedChange >= 0 ? '+' : ''}{rejectedChange} from yesterday
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round((reportData.totalSold / (reportData.totalSold + reportData.totalRejected)) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Orders successfully completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {reportData.totalSold + reportData.totalRejected}
            </div>
            <p className="text-xs text-muted-foreground">
              All orders processed today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Today vs Yesterday Comparison</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Order Distribution</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Performance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={reportData.dailySales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              />
              <Bar dataKey="sold" fill="#10b981" name="Sold Orders" />
              <Bar dataKey="rejected" fill="#ef4444" name="Rejected Orders" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};