import React, { useEffect, useState } from "react";
import { FaUserTie, FaBoxes } from "react-icons/fa";
import { MdOutlineCheckCircle, MdOutlineCancel } from "react-icons/md";
import axiosInstance from "../../../api/axiosInstance"; // adjust import path accordingly

export default function StaffRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPendingOrders, setTotalPendingOrders] = useState(0);

  // Note: This component now fetches pending orders instead of inventory requests
  // It shows orders that are waiting for processing or approval.

  useEffect(() => {
    fetchRequests();
    fetchTotalPendingOrders();
  }, []);

  const fetchTotalPendingOrders = async () => {
    try {
      // Fetch all orders (no date filter) to get total pending count
      const response = await axiosInstance.get("orders/manager-orders/");
      if (response.data.orders) {
        const totalPending = response.data.orders.filter(order => 
          order.cashier_status === 'pending' || 
          order.food_status === 'pending' || 
          order.beverage_status === 'pending'
        ).length;
        setTotalPendingOrders(totalPending);
        console.log("StaffRequests - Total pending orders in system:", totalPending);
      }
    } catch (error) {
      console.error("StaffRequests - Error fetching total pending orders:", error);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Get current date in YYYY-MM-DD format
      const currentDate = new Date().toISOString().split('T')[0];
      console.log("StaffRequests - Current browser date:", new Date().toISOString());
      console.log("StaffRequests - Fetching orders for date:", currentDate);
      
      // Also try to get today's date in local timezone
      const today = new Date();
      const localDate = today.toLocaleDateString('en-CA'); // YYYY-MM-DD format
      console.log("StaffRequests - Local date:", localDate);
      console.log("StaffRequests - Using date:", currentDate);
      
      // Fetch pending orders from the orders system
      const response = await axiosInstance.get(`orders/manager-orders/?date=${currentDate}`);
      console.log("StaffRequests - Full response:", response);
      console.log("StaffRequests - Orders data:", response.data);
      console.log("StaffRequests - Orders array:", response.data.orders);
      
      if (!response.data.orders) {
        console.log("StaffRequests - No orders array in response");
        setRequests([]);
        return;
      }
      
      // Filter only pending orders
      const allOrders = response.data.orders;
      console.log("StaffRequests - Total orders found:", allOrders.length);
      
      const pendingOrders = allOrders.filter(order => {
        const isPending = order.cashier_status === 'pending' || 
                         order.food_status === 'pending' || 
                         order.beverage_status === 'pending';
        console.log(`StaffRequests - Order ${order.order_number}: cashier=${order.cashier_status}, food=${order.food_status}, beverage=${order.beverage_status}, isPending=${isPending}`);
        return isPending;
      });
      
      console.log("StaffRequests - Pending orders found:", pendingOrders.length);
      console.log("StaffRequests - Pending orders:", pendingOrders);
      
      // If no pending orders, show all orders for debugging
      if (pendingOrders.length === 0 && allOrders.length > 0) {
        console.log("StaffRequests - No pending orders found, showing all orders for debugging");
        console.log("StaffRequests - All orders statuses:", allOrders.map(o => ({
          order_number: o.order_number,
          cashier_status: o.cashier_status,
          food_status: o.food_status,
          beverage_status: o.beverage_status
        })));
      }
      
      setRequests(pendingOrders);
    } catch (error) {
      console.error("StaffRequests - Error fetching orders:", error);
      console.error("StaffRequests - Error response:", error.response);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      // For orders, we might want to update status instead of approve
      await axiosInstance.patch(`orders/order-list/${id}/`, { 
        food_status: 'preparing',
        beverage_status: 'preparing' 
      });
      setRequests((prev) => prev.filter((req) => req.id !== id));
      // Refresh total pending count
      fetchTotalPendingOrders();
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const handleReject = async (id) => {
    try {
      // For orders, we might want to update status instead of reject
      await axiosInstance.patch(`orders/order-list/${id}/`, { 
        food_status: 'rejected',
        beverage_status: 'rejected' 
      });
      setRequests((prev) => prev.filter((req) => req.id !== id));
      // Refresh total pending count
      fetchTotalPendingOrders();
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8 max-w-full sm:max-w-lg md:max-w-2xl mx-auto">
      {/* Total Pending Orders Banner */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-3 bg-red-50 border border-red-200 rounded-full px-6 py-3">
          <div className="text-red-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-700">{totalPendingOrders}</div>
            <div className="text-sm text-red-600">Total Pending Orders</div>
          </div>
        </div>
      </div>

      <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-700 mb-4">
        📝 Pending Orders
      </h3>

      {/* Refresh Button */}
      <div className="flex justify-end mb-4 gap-2">
        <button
          onClick={() => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayDate = yesterday.toISOString().split('T')[0];
            console.log("StaffRequests - Testing with yesterday's date:", yesterdayDate);
            
            setLoading(true);
            axiosInstance.get(`orders/manager-orders/?date=${yesterdayDate}`)
              .then(response => {
                console.log("StaffRequests - Yesterday's orders:", response.data);
                if (response.data.orders && response.data.orders.length > 0) {
                  const pendingYesterday = response.data.orders.filter(order => 
                    order.cashier_status === 'pending' || 
                    order.food_status === 'pending' || 
                    order.beverage_status === 'pending'
                  );
                  console.log("StaffRequests - Pending orders from yesterday:", pendingYesterday);
                }
              })
              .catch(error => {
                console.error("StaffRequests - Error fetching yesterday's orders:", error);
              })
              .finally(() => {
                setLoading(false);
              });
          }}
          className="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700 transition"
          disabled={loading}
        >
          Test Yesterday
        </button>
        <button
          onClick={() => {
            fetchRequests();
            fetchTotalPendingOrders();
          }}
          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Order Count Display */}
      {!loading && (
        <div className="mb-4 text-center space-y-2">
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
              {requests.length} Pending Order{requests.length !== 1 ? 's' : ''} Today
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Showing orders from today • Total pending in system: {totalPendingOrders}
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 italic text-sm md:text-base">Loading orders...</p>
      ) : requests.length === 0 ? (
        <p className="text-gray-500 italic text-sm md:text-base">
          No pending orders at the moment.
        </p>
      ) : (
        <ul className="space-y-4">
          {requests.map((order) => (
            <li
              key={order.id}
              className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
            >
              <div className="flex flex-col gap-4">
                {/* Order Info */}
                <div className="text-sm sm:text-base text-gray-700">
                  <div className="flex items-center gap-2 font-medium">
                    <FaUserTie className="text-blue-500" />
                    Order #{order.order_number} - {order.created_by}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-gray-600">
                    <FaBoxes className="text-gray-500" />
                    Table: {order.table_number || 'N/A'} | Status: {order.cashier_status}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Items: {order.items?.length || 0} | Total: ETB {order.total_money || 0}
                  </div>
                </div>

                {/* Buttons stacked vertically */}
                <div className="flex flex-col gap-3 w-full">
                  <button
                    onClick={() => handleApprove(order.id)}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 text-sm font-semibold rounded-md hover:bg-green-700 transition"
                  >
                    <MdOutlineCheckCircle size={18} />
                    Start Preparing
                  </button>
                  <button
                    onClick={() => handleReject(order.id)}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 text-sm font-semibold rounded-md hover:bg-red-700 transition"
                  >
                    <MdOutlineCancel size={18} />
                    Reject Order
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
