import React from "react";

export default function SalesSummary() {
  // Mock data for sales
  const totalRevenue = 12450;
  const avgOrderValue = 42;
  const ordersCount = 295;

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
