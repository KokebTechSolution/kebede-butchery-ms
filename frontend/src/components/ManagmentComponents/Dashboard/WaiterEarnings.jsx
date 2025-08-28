import React, { useEffect, useState } from "react";
import axiosInstance from "../../../api/axiosInstance";
import { FaUserTie, FaMoneyBillWave, FaTrophy } from "react-icons/fa";

export default function WaiterEarnings({ filterDate }) {
  const [waiterEarnings, setWaiterEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Note: This component now uses the new backend WaiterEarningsView endpoint
  // which fetches real waiter earnings data for a specific date.

  useEffect(() => {
    const fetchWaiterEarnings = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use the new backend endpoint for waiter earnings
        const response = await axiosInstance.get(`/orders/waiter-earnings/?date=${filterDate}`);
        const data = response.data;
        
        console.log("Waiter earnings data from backend:", data); // Debug log

        if (data.waiter_earnings && data.waiter_earnings.length > 0) {
          setWaiterEarnings(data.waiter_earnings);
          console.log("Set waiter earnings:", data.waiter_earnings); // Debug log
        } else {
          // No waiter earnings data for this date
          setWaiterEarnings([]);
          console.log("No waiter earnings data found"); // Debug log
        }

      } catch (error) {
        console.error("Error fetching waiter earnings:", error);
        setError("Failed to load waiter data");
        setWaiterEarnings([]);
      } finally {
        setLoading(false);
      }
    };

    if (filterDate) {
      fetchWaiterEarnings();
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

  if (waiterEarnings.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        <FaUserTie className="mx-auto text-3xl text-gray-300 mb-2" />
        <p className="text-sm">No waiter earnings for this date</p>
        <p className="text-xs text-gray-400">This could mean:</p>
        <ul className="text-xs text-gray-400 mt-1 space-y-1">
          <li>• No orders were completed on this date</li>
          <li>• No orders have been printed/sent to cashier</li>
          <li>• All orders are still pending</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700">Waiter Earnings</h3>
        <button
          onClick={() => {
            setLoading(true);
            setError(null);
            const fetchWaiterEarnings = async () => {
              try {
                const response = await axiosInstance.get(`/orders/waiter-earnings/?date=${filterDate}`);
                const data = response.data;
                
                if (data.waiter_earnings && data.waiter_earnings.length > 0) {
                  setWaiterEarnings(data.waiter_earnings);
                } else {
                  setWaiterEarnings([]);
                }
              } catch (error) {
                console.error("Error refreshing waiter earnings:", error);
                setError("Failed to refresh waiter data");
                setWaiterEarnings([]);
              } finally {
                setLoading(false);
              }
            };
            fetchWaiterEarnings();
          }}
          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Top Waiter */}
      {waiterEarnings.length > 0 && (
        <div className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FaTrophy className="text-yellow-500 text-lg" />
            <span className="text-sm font-semibold text-gray-700">Top Performer</span>
          </div>
          <p className="font-bold text-blue-600 text-lg">{waiterEarnings[0].name}</p>
          <p className="text-sm text-gray-600">
            ETB {waiterEarnings[0].totalEarnings.toFixed(2)}
          </p>
        </div>
      )}

      {/* Waiter List */}
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {waiterEarnings.slice(0, 3).map((waiter, index) => (
          <div key={waiter.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${
                index === 0 ? 'text-yellow-600' : 
                index === 1 ? 'text-gray-500' : 'text-orange-600'
              }`}>
                #{index + 1}
              </span>
              <span className="text-sm font-medium text-gray-700 truncate">
                {waiter.name}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-green-600">
                ETB {waiter.totalEarnings.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">
                {waiter.ordersCount} orders
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Total Earnings */}
      <div className="text-center pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-500 mb-1">Total Waiter Earnings</p>
        <p className="text-lg font-bold text-green-600">
          ETB {waiterEarnings.reduce((sum, waiter) => sum + waiter.totalEarnings, 0).toFixed(2)}
        </p>
      </div>
    </div>
  );
}
