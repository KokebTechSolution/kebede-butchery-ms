import React, { useEffect, useState } from "react";
import axiosInstance from "../../../api/axiosInstance"; // adjust path as needed

export default function StockLevels() {
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  // Note: This component now shows items from the manager's main inventory (stocks)
  // that are below or equal to their minimum threshold.
  // It filters out all items that are sufficiently stocked to focus on items needing attention.

  const API_URL = "inventory/stocks/"; // Use manager inventory stocks, not bartender inventory
  const STOCK_THRESHOLD = 10; // Default threshold if product doesn't have one

  useEffect(() => {
    fetchStockItems();
  }, []);

  const fetchStockItems = async () => {
    setLoading(true);
    setError("");

    try {
      console.log("StockLevels - Attempting to fetch from:", API_URL); // Debug log
      const response = await axiosInstance.get(API_URL);
      console.log("StockLevels - Backend data:", response.data); // Debug log
      
      // Transform the data and filter for low stock items only
      const transformedData = response.data
        .map(stock => {
          const item = {
            id: stock.id,
            name: stock.product?.name || 'Unknown Product',
            stock_qty: stock.calculated_base_units || 0,
            unit: stock.product?.base_unit?.unit_name || 'units',
            threshold: stock.minimum_threshold_base_units || STOCK_THRESHOLD // Use Stock's threshold field
          };
          console.log(`StockLevels - Transformed item:`, item); // Debug each item
          return item;
        })
        .filter(item => {
          const isLowStock = item.stock_qty <= item.threshold;
          console.log(`StockLevels - Item "${item.name}": stock_qty=${item.stock_qty}, threshold=${item.threshold}, isLowStock=${isLowStock}`); // Debug filtering
          return isLowStock;
        })
        .sort((a, b) => a.stock_qty - b.stock_qty); // Sort by stock quantity (lowest first)
      
      console.log("StockLevels - Final filtered low stock items:", transformedData); // Debug log
      setStockItems(transformedData);
    } catch (err) {
      console.error("Error fetching stock items:", err);
      setError("Failed to load stock data. Please try again later.");
      setStockItems([]);
    } finally {
      setLoading(false);
    }
  };

  const displayedItems = showAll ? stockItems : stockItems.slice(0, 5); // Show 5 by default

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Stock Alerts</h3>
        <button
          onClick={fetchStockItems}
          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading stock data...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : stockItems.length === 0 ? (
        <div className="text-center text-green-600 py-4">
          <p className="font-semibold mb-2">✅ All items are sufficiently stocked!</p>
          <p className="text-sm text-gray-600">
            No items are below their minimum threshold.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-3 text-sm text-gray-600">
            Showing {stockItems.length} item(s) below threshold
          </div>
          <ul className="space-y-2 mb-4">
            {displayedItems.map((item) => (
              <li
                key={item.id}
                className="flex justify-between items-center border-b py-2"
              >
                <div className="flex-1">
                  <span className="font-medium text-gray-800">{item.name}</span>
                  <div className="text-xs text-gray-500">
                    Threshold: {item.threshold} {item.unit}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-red-600">
                    {item.stock_qty} {item.unit}
                  </span>
                  <div className="text-xs text-red-500">
                    ⚠️ Low Stock ({(item.threshold - item.stock_qty).toFixed(2)} {item.unit} below)
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {stockItems.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-blue-600 text-sm hover:underline"
            >
              {showAll ? "Show Less ▲" : "Show More ▼"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
