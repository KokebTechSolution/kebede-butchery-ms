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
    <div className="bg-white rounded-xl shadow-mobile p-4 sm:p-6 transition-shadow hover:shadow-mobile-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">Low Stock Alerts</h3>
          <p className="text-sm text-gray-600">
            Items with quantity below {STOCK_THRESHOLD} units
          </p>
        </div>
        <button
          onClick={fetchStockItems}
          className="flex items-center gap-2 text-blue-600 text-sm hover:text-blue-700 transition-colors px-3 py-2 bg-blue-50 rounded-lg hover:bg-blue-100"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">Loading stock data...</span>
        </div>
      ) : error ? (
        <div className="text-center py-6">
          <div className="text-red-500 text-sm sm:text-base">{error}</div>
        </div>
      ) : lowStockItems.length === 0 ? (
        <div className="text-center py-6">
          <div className="text-green-600 font-semibold text-sm sm:text-base">
            ✅ All items are sufficiently stocked.
          </div>
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {lowStockItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-gray-900 text-sm sm:text-base">
                    {item.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    Current stock: {item.stock_qty} units
                  </div>
                </div>
              </div>
              <div className="text-red-600 font-semibold text-sm">
                Low Stock
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StockAlerts;
