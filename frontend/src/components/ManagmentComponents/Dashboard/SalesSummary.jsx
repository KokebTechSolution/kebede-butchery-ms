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
        // Fetch all orders for the selected date (not just food)
        const response = await axiosInstance.get(`orders/?date=${filterDate}`);
        const orders = response.data;

        console.log("Sales Summary - All orders:", orders); // Debug log

        // Calculate metrics from all paid orders
        const completedOrders = orders.filter(order => 
          order.has_payment || order.payment_status === 'completed' || order.status === 'completed'
        );

        const totalRev = completedOrders.reduce((sum, order) => {
          let orderTotal = 0;
          
          if (order.total_amount) {
            // If total_amount is available, use it
            orderTotal = parseFloat(order.total_amount) || 0;
          } else if (order.items && Array.isArray(order.items)) {
            // Calculate from individual items
            orderTotal = order.items
              .filter(item => item.status === 'accepted' || item.status === 'completed' || item.status === 'served')
              .reduce((itemSum, item) => {
                const price = parseFloat(item.price) || 0;
                const quantity = parseInt(item.quantity) || 0;
                return itemSum + (price * quantity);
              }, 0);
          }
          
          return sum + orderTotal;
        }, 0);

        const avgOrder = completedOrders.length > 0 ? totalRev / completedOrders.length : 0;

        console.log("Sales Summary - Calculated:", {
          totalRevenue: totalRev,
          avgOrderValue: avgOrder,
          ordersCount: completedOrders.length
        }); // Debug log

        setTotalRevenue(totalRev);
        setAvgOrderValue(avgOrder);
        setOrdersCount(completedOrders.length);
      } catch (error) {
        console.error("Error fetching sales summary:", error);
        setError("Failed to load sales data");
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
