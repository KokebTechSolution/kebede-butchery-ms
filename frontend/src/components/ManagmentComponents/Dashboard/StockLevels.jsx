import React, { useEffect, useState } from "react";
import axiosInstance from "../../../api/axiosInstance"; // adjust path as needed

export default function StockLevels() {
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  const API_URL = "products/low-stock/"; // relative path for axiosInstance
  const STOCK_THRESHOLD = 10; // You can adjust this globally

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

  const displayedItems = showAll ? stockItems : stockItems.slice(0, 5); // Show 5 by default

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Stock Levels</h3>
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
        <p className="text-green-600 font-semibold">
          All items are sufficiently stocked.
        </p>
      ) : (
        <>
          <ul className="space-y-2 mb-4">
            {displayedItems.map((item) => (
              <li
                key={item.id}
                className="flex justify-between items-center border-b py-2"
              >
                <span className="font-medium">{item.name}</span>
                <span
                  className={`font-semibold ${
                    item.stock_qty <= STOCK_THRESHOLD
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {item.stock_qty} units -{" "}
                  {item.stock_qty <= STOCK_THRESHOLD
                    ? "Low Stock"
                    : "Sufficient"}
                </span>
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
