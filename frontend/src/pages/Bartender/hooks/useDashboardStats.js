import { useEffect, useState } from "react";
import axios from "axios";

axios.defaults.withCredentials = true;

export function useDashboardStats() {
  const [stats, setStats] = useState({
    pendingOrders: 0,
    inventoryItems: 0,
    lowStock: 0,
    staffCount: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [ordersRes, inventoryRes, stockRes, staffRes] = await Promise.all([
          axios.get("http://localhost:8000/api/orders/beverages/"),
          axios.get("http://localhost:8000/api/inventory/barman-stock/"),
          axios.get("http://localhost:8000/api/inventory/barman-stock/?running_out=true"),
          axios.get("http://localhost:8000/api/users/users"),
        ]);

        const pendingOrders = ordersRes.data.filter(o =>
          o.items.some(i => i.status === "pending")
        ).length;

        setStats({
          pendingOrders,
          inventoryItems: inventoryRes.data.length,
          lowStock: stockRes.data.length,
          staffCount: staffRes.data.length,
        });
      } catch (err) {
        console.error("Error fetching dashboard stats:", err.response?.data || err.message);
      }
    };

    fetchStats();
  }, []);

  return stats;
}
