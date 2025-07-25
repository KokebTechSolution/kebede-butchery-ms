import React, { useEffect, useState } from "react";
import axiosInstance from "../../../api/axiosInstance"; // adjust path as needed

export default function SalesSummary() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [avgOrderValue, setAvgOrderValue] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const SALES_SUMMARY_API = "orders/sales-summary/"; // relative path for axiosInstance baseURL

  useEffect(() => {
    const fetchSalesSummary = async () => {
      try {
        const response = await axiosInstance.get(SALES_SUMMARY_API);

        const { total_revenue, avg_order_value, orders_count } = response.data;

        setTotalRevenue(total_revenue);
        setAvgOrderValue(avg_order_value);
        setOrdersCount(orders_count);
      } catch (error) {
        console.error("Error fetching sales summary:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesSummary();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Sales Summary</h3>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-4">Sales Summary</h3>
      <div className="flex justify-between mb-6">
        <div>
          <p className="text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-500">Avg Order Value</p>
          <p className="text-2xl font-bold">${avgOrderValue}</p>
        </div>
        <div>
          <p className="text-gray-500">Number of Orders</p>
          <p className="text-2xl font-bold">{ordersCount}</p>
        </div>
      </div>

      {/* Simple line chart (mock) */}
      <svg
        viewBox="0 0 100 30"
        className="w-full h-16 stroke-blue-600 fill-transparent"
      >
        <polyline
          fill="none"
          strokeWidth="3"
          points="0,20 15,18 30,10 45,15 60,7 75,9 90,3 100,10"
        />
      </svg>
    </div>
  );
}
