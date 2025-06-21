import React from "react";

export default function StockLevels() {
  // Mock stock alerts
  const lowStockItems = [
    { name: "Beef", quantity: 3 },
    { name: "Milk", quantity: 7 },
    { name: "Ice", quantity: 2 },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-4">Low Stock Alerts</h3>
      <ul className="list-disc list-inside text-red-600">
        {lowStockItems.map((item) => (
          <li key={item.name}>
            {item.name} — Only {item.quantity} left
          </li>
        ))}
      </ul>
    </div>
  );
}
