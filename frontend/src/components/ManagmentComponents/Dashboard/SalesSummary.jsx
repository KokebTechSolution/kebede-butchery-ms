import React, { useEffect, useState } from "react";
import axiosInstance from "../../../api/axiosInstance";

export default function SalesSummary({ filterDate }) {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [avgOrderValue, setAvgOrderValue] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSalesSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use the correct backend endpoint for sales summary
        const response = await axiosInstance.get(`/orders/sales-summary/?date=${filterDate}`);
        const data = response.data;

        console.log("Sales Summary - Backend data:", data); // Debug log

        // Use the data from backend
        setTotalRevenue(data.total_sales || 0);
        setAvgOrderValue(data.total_orders > 0 ? (data.total_sales / data.total_orders) : 0);
        setOrdersCount(data.total_orders || 0);

        console.log("Sales Summary - Calculated:", {
          totalRevenue: data.total_sales || 0,
          avgOrderValue: data.total_orders > 0 ? (data.total_sales / data.total_orders) : 0,
          ordersCount: data.total_orders || 0
        }); // Debug log

      } catch (error) {
        console.error("Error fetching sales summary:", error);
        setError("Failed to load sales data");
        // Set default values on error
        setTotalRevenue(0);
        setAvgOrderValue(0);
        setOrdersCount(0);
      } finally {
        setLoading(false);
      }
    };

    if (filterDate) {
      fetchSalesSummary();
    }
  }, [filterDate]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-4">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Total Revenue */}
      <div className="text-center">
        <p className="text-gray-500 text-sm mb-1">Total Revenue</p>
        <p className="text-2xl font-bold text-green-600">
          ETB {totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-gray-500 text-xs mb-1">Orders</p>
          <p className="text-lg font-semibold text-blue-600">{ordersCount}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-xs mb-1">Avg Order</p>
          <p className="text-lg font-semibold text-purple-600">
            ETB {avgOrderValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </p>
        </div>
      </div>

      {/* Date Display */}
      <div className="text-center pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          {new Date(filterDate).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>
    </div>
  );
}
