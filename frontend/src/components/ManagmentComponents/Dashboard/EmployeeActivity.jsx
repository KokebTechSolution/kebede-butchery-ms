import React, { useEffect, useState } from "react";
import axiosInstance from "../../../api/axiosInstance"; // adjust the import path
import { RefreshCw } from "lucide-react";

export default function EmployeeActivity() {
  const [activeStaff, setActiveStaff] = useState(0);
  const [inactiveStaff, setInactiveStaff] = useState(0);
  const [ordersProcessed, setOrdersProcessed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_URL = "activity/employee-activity/"; // relative to baseURL in axiosInstance

  useEffect(() => {
    fetchEmployeeActivity();
  }, []);

  const fetchEmployeeActivity = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axiosInstance.get(API_URL);
      setActiveStaff(response.data.active_staff);
      setInactiveStaff(response.data.inactive_staff);
      setOrdersProcessed(response.data.orders_processed);
    } catch (err) {
      console.error("Error fetching employee activity:", err);
      setError("Failed to load employee activity. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Employee Activity</h3>
        <button
          onClick={fetchEmployeeActivity}
          className="flex items-center gap-1 text-blue-600 text-sm hover:underline"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading activity...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="space-y-2">
          <p className="text-green-700">
            <strong>{activeStaff}</strong> active staff members
          </p>
          <p className="text-red-600">
            <strong>{inactiveStaff}</strong> inactive staff members
          </p>
          <p className="text-blue-700">
            <strong>{ordersProcessed}</strong> orders processed today
          </p>
        </div>
      )}
    </div>
  );
}
