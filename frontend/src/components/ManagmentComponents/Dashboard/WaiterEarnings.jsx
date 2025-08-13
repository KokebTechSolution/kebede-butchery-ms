import React, { useEffect, useState } from "react";
import axiosInstance from "../../../api/axiosInstance";
import { FaUserTie, FaMoneyBillWave, FaTrophy } from "react-icons/fa";

export default function WaiterEarnings({ filterDate }) {
  const [waiterEarnings, setWaiterEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWaiterEarnings = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all orders for the selected date (not just food)
        const response = await axiosInstance.get(`orders/?date=${filterDate}`);
        const orders = response.data;

        console.log("All orders data:", orders); // Debug log

        // Calculate waiter earnings from all paid orders
        const earnings = {};
        orders.forEach(order => {
          // Check if order has payment (completed transaction)
          if (order.has_payment || order.payment_status === 'completed' || order.status === 'completed') {
            // Try different possible waiter field names
            const waiterName = order.waiter_name || order.waiter || order.staff_name || order.cashier_name || 'Unknown Waiter';
            
            // Calculate order total from items or total_amount
            let orderTotal = 0;
            
            if (order.total_amount) {
              // If total_amount is available, use it
              orderTotal = parseFloat(order.total_amount) || 0;
            } else if (order.items && Array.isArray(order.items)) {
              // Calculate from individual items
              orderTotal = order.items
                .filter(item => item.status === 'accepted' || item.status === 'completed' || item.status === 'served')
                .reduce((sum, item) => {
                  const price = parseFloat(item.price) || 0;
                  const quantity = parseInt(item.quantity) || 0;
                  return sum + (price * quantity);
                }, 0);
            }

            if (orderTotal > 0) {
              if (!earnings[waiterName]) {
                earnings[waiterName] = {
                  name: waiterName,
                  totalEarnings: 0,
                  ordersCount: 0,
                  avgOrderValue: 0
                };
              }

              earnings[waiterName].totalEarnings += orderTotal;
              earnings[waiterName].ordersCount += 1;
            }
          }
        });

        console.log("Calculated waiter earnings:", earnings); // Debug log

        // Calculate averages and sort by total earnings
        const earningsArray = Object.values(earnings).map(waiter => ({
          ...waiter,
          avgOrderValue: waiter.ordersCount > 0 ? waiter.totalEarnings / waiter.ordersCount : 0
        }));

        earningsArray.sort((a, b) => b.totalEarnings - a.totalEarnings);
        setWaiterEarnings(earningsArray);
      } catch (error) {
        console.error("Error fetching waiter earnings:", error);
        setError("Failed to load waiter data");
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
        <p className="text-xs text-gray-400">Try selecting a different date</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
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
