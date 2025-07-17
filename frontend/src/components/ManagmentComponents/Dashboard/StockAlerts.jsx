import React, { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import axiosInstance from "../../../api/axiosInstance"; // adjust import path accordingly

function StockAlerts() {
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_URL = "products/low-stock/"; // relative path for axiosInstance

  const STOCK_THRESHOLD = 10; // frontend threshold

  useEffect(() => {
    fetchStockItems();
  }, []);

  const fetchStockItems = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axiosInstance.get(API_URL);
      setStockItems(response.data);
    } catch (err) {
      console.error("Error fetching stock items:", err);
      setError("Failed to load stock data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const lowStockItems = stockItems.filter((item) => item.stock_qty <= STOCK_THRESHOLD);

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold">Low Stock Alerts</h3>
        <button
          onClick={fetchStockItems}
          className="flex items-center gap-1 text-blue-600 text-sm hover:underline"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading stock data...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : lowStockItems.length === 0 ? (
        <p className="text-green-600 font-semibold">All items are sufficiently stocked.</p>
      ) : (
        <ul className="list-disc list-inside space-y-1 max-h-48 overflow-y-auto">
          {lowStockItems.map((item) => (
            <li key={item.id} className="text-red-600">
              {item.name} — Only {item.stock_qty} units left
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default StockAlerts;
