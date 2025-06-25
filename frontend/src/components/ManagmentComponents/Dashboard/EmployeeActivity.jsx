import React, { useEffect, useState } from "react";
import axios from "axios";

export default function EmployeeActivity() {
  const [activeStaff, setActiveStaff] = useState(0);
  const [ordersProcessed, setOrdersProcessed] = useState(0);
  const [loading, setLoading] = useState(true);

  // Replace these with your actual API endpoints
  const USERS_API = "http://localhost:8000/api/users/users/";
  const ORDERS_API = "http://localhost:8000/api/orders/today-orders-count/";

  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        // Fetch active staff count
        const usersResponse = await axios.get(USERS_API, {
          headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
        });
        const activeUsers = usersResponse.data.filter(user => user.is_active).length;
        setActiveStaff(activeUsers);

        // Fetch today's orders count (you need to have this API ready)
        const ordersResponse = await axios.get(ORDERS_API, {
          headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
        });
        setOrdersProcessed(ordersResponse.data.count);

      } catch (error) {
        console.error("Error fetching employee activity:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivityData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Employee Activity</h3>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-4">Employee Activity</h3>
      <p>
        <strong>{activeStaff}</strong> active staff members
      </p>
      <p>
        <strong>{ordersProcessed}</strong> orders processed today
      </p>
    </div>
  );
}
