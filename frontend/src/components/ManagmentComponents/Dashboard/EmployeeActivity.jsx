import React, { useEffect, useState } from "react";
import axiosInstance from "../../../api/axiosInstance";
import { FaUsers, FaUserCheck, FaUserTimes, FaClipboardList, FaClock } from "react-icons/fa";

export default function EmployeeActivity({ filterDate }) {
  const [activeStaff, setActiveStaff] = useState(0);
  const [inactiveStaff, setInactiveStaff] = useState(0);
  const [totalStaff, setTotalStaff] = useState(0);
  const [ordersProcessed, setOrdersProcessed] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [roleBreakdown, setRoleBreakdown] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Note: This component shows total staff counts, breakdown by role, and recent activity
  // It fetches user data from the backend and displays role-based statistics.
  // For orders data, it uses the manager-orders endpoint to see all orders across the system.

  useEffect(() => {
    if (filterDate) {
      fetchEmployeeActivity();
    }
  }, [filterDate]);

  const fetchEmployeeActivity = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch staff data using the correct endpoint
      const staffResponse = await axiosInstance.get("users/users/");
      const staff = staffResponse.data;
      
      console.log("Staff data:", staff); // Debug log
      
      // Fetch orders for the selected date using the correct endpoint
      const ordersResponse = await axiosInstance.get(`orders/manager-orders/?date=${filterDate}`);
      const orders = ordersResponse.data.orders || []; // Extract orders from response

      console.log("Orders data:", orders); // Debug log

      // Calculate metrics
      const activeStaffCount = staff.filter(user => user.is_active).length;
      const inactiveStaffCount = staff.filter(user => !user.is_active).length;
      const totalStaffCount = staff.length;
      const processedOrders = orders.filter(order => 
        (order.has_payment || order.cashier_status === 'printed') && 
        order.items && 
        order.items.some(item => item.status === 'accepted' || item.status === 'completed')
      ).length;

      // Calculate role breakdown
      const roleCounts = {};
      staff.forEach(user => {
        const role = user.role || 'Unknown';
        roleCounts[role] = (roleCounts[role] || 0) + 1;
      });

      // Get recent activity (last 5 orders)
      const recentOrders = orders
        .filter(order => order.has_payment || order.cashier_status === 'printed')
        .slice(0, 5)
        .map(order => ({
          id: order.id,
          waiter: order.waiterName || order.created_by?.username || 'Unknown',
          status: order.items && order.items.some(item => 
            item.status === 'accepted' || item.status === 'completed'
          ) ? 'Completed' : 'Pending',
          time: new Date(order.created_at).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        }));

      setActiveStaff(activeStaffCount);
      setInactiveStaff(inactiveStaffCount);
      setTotalStaff(totalStaffCount);
      setOrdersProcessed(processedOrders);
      setRecentActivity(recentOrders);
      setRoleBreakdown(roleCounts);
      
      console.log("Calculated metrics:", {
        activeStaff: activeStaffCount,
        inactiveStaff: inactiveStaffCount,
        totalStaff: totalStaffCount,
        processedOrders: processedOrders,
        roleBreakdown: roleCounts
      }); // Debug log
    } catch (err) {
      console.error("Error fetching employee activity:", err);
      setError("Failed to load employee activity. Please try again.");
      // Set default values on error
      setActiveStaff(0);
      setInactiveStaff(0);
      setTotalStaff(0);
      setOrdersProcessed(0);
      setRecentActivity([]);
      setRoleBreakdown({});
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="space-y-4">
      {/* Total Staff Count */}
      <div className="text-center bg-blue-50 rounded-lg p-3">
        <FaUsers className="mx-auto text-blue-500 text-lg mb-1" />
        <p className="text-lg font-bold text-blue-600">{totalStaff}</p>
        <p className="text-xs text-blue-600">Total Staff</p>
      </div>

      {/* Staff Counts */}
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center bg-green-50 rounded-lg p-3">
          <FaUserCheck className="mx-auto text-green-500 text-lg mb-1" />
          <p className="text-lg font-bold text-green-600">{activeStaff}</p>
          <p className="text-xs text-green-600">Active Staff</p>
        </div>
        <div className="text-center bg-red-50 rounded-lg p-3">
          <FaUserTimes className="mx-auto text-red-500 text-lg mb-1" />
          <p className="text-lg font-bold text-red-600">{inactiveStaff}</p>
          <p className="text-xs text-red-600">Inactive Staff</p>
        </div>
      </div>

      {/* Orders Processed */}
      <div className="text-center bg-purple-50 rounded-lg p-3">
        <FaClipboardList className="mx-auto text-purple-500 text-lg mb-1" />
        <p className="text-lg font-bold text-purple-600">{ordersProcessed}</p>
        <p className="text-xs text-purple-600">Orders Processed</p>
      </div>

      {/* Role Breakdown */}
      {Object.keys(roleBreakdown).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 text-center">Staff by Role</p>
          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
            {Object.entries(roleBreakdown).map(([role, count]) => (
              <div key={role} className="text-center bg-gray-50 rounded-lg p-2">
                <p className="text-sm font-semibold text-gray-700">{count}</p>
                <p className="text-xs text-gray-500 capitalize">{role}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 text-center">Recent Activity</p>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                <div className="flex items-center gap-2">
                  <FaClock className="text-gray-400" />
                  <span className="text-gray-600">{activity.waiter}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    activity.status === 'Completed' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {activity.status}
                  </span>
                  <span className="text-gray-500">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Date Display */}
      <div className="text-center pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          {new Date(filterDate).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })}
        </p>
      </div>
    </div>
  );
}
