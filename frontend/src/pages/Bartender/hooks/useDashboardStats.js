import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance"; // assume this has withCredentials: true

export function useDashboardStats() {
  const [stats, setStats] = useState({
    pendingOrders: 0,
    inventoryItems: 0,
    lowStock: 0,
    staffCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersRes, inventoryRes, stockRes, staffRes] = await Promise.all([
        axiosInstance.get("/orders/beverages/"),
        axiosInstance.get("/api/inventory/barman-stock/"),
        axiosInstance.get("/api/inventory/barman-stock/?running_out=true"),
        axiosInstance.get("/api/users/users"),
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
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, loading, error, refresh: fetchStats };
}
