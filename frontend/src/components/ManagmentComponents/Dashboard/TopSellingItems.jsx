import React, { useEffect, useState } from "react";
import axiosInstance from "../../../api/axiosInstance";
import { FaTrophy, FaUtensils, FaChartLine } from "react-icons/fa";

export default function TopSellingItems({ filterDate }) {
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Note: This component now uses the new backend TopSellingItemsView endpoint
  // which fetches real top selling items data for a specific date from all orders.

  useEffect(() => {
    const fetchTopSellingItems = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use the new backend endpoint for top selling items
        const response = await axiosInstance.get(`/orders/top-selling-items/?date=${filterDate}`);
        const data = response.data;

        console.log("TopSellingItems - Backend data:", data); // Debug log

        if (data.top_selling_items && data.top_selling_items.length > 0) {
          // Transform the backend data to match our component's expected format
          const transformedItems = data.top_selling_items.map(item => ({
            name: item.name,
            totalQuantity: item.totalQuantity,
            totalRevenue: item.totalRevenue,
            orderCount: item.orderCount,
            avgPrice: item.avgPrice
          }));
          
          setTopItems(transformedItems);
          console.log("Transformed top selling items:", transformedItems); // Debug log
        } else {
          // No top selling items data for this date
          setTopItems([]);
          console.log("No top selling items data found"); // Debug log
        }

      } catch (error) {
        console.error("Error fetching top selling items:", error);
        setError("Failed to load item data");
        setTopItems([]);
      } finally {
        setLoading(false);
      }
    };

    if (filterDate) {
      fetchTopSellingItems();
    }
  }, [filterDate]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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

  if (topItems.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        <FaUtensils className="mx-auto text-3xl text-gray-300 mb-2" />
        <p className="text-sm">No sales data for this date</p>
        <p className="text-xs text-gray-400">This could mean:</p>
        <ul className="text-xs text-gray-400 mt-1 space-y-1">
          <li>• No orders were completed on this date</li>
          <li>• No items have been accepted/served yet</li>
          <li>• All orders are still pending</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Top Item */}
      {topItems.length > 0 && (
        <div className="text-center bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FaTrophy className="text-yellow-500 text-lg" />
            <span className="text-sm font-semibold text-gray-700">Best Seller</span>
          </div>
          <p className="font-bold text-orange-600 text-sm truncate">{topItems[0].name}</p>
          <p className="text-xs text-gray-600">
            {topItems[0].totalQuantity} sold • ETB {topItems[0].totalRevenue.toFixed(2)}
          </p>
        </div>
      )}

      {/* Top Items List */}
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {topItems.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className={`text-xs font-medium ${
                index === 0 ? 'text-yellow-600' : 
                index === 1 ? 'text-gray-500' : 'text-orange-600'
              }`}>
                #{index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {item.name}
                </p>
                <p className="text-xs text-gray-500">
                  {item.totalQuantity} sold
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-green-600">
                ETB {item.totalRevenue.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">
                {item.orderCount} orders
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Total Sales */}
      <div className="text-center pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-500 mb-1">Total Item Sales</p>
        <p className="text-lg font-bold text-green-600">
          ETB {topItems.reduce((sum, item) => sum + item.totalRevenue, 0).toFixed(2)}
        </p>
      </div>
    </div>
  );
}
