import React, { useEffect, useState } from "react";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import { getPrintedOrders } from "../../../../../../api/cashier";

function getTodayDateString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export const WaitersSection = () => {
  const [waiters, setWaiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterDate, setFilterDate] = useState(getTodayDateString());

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError("");
      try {
        const orders = await getPrintedOrders(filterDate);
        // Aggregate by waiter username
        const waiterMap = {};
        orders.forEach(order => {
          const waiterName = order.waiterName || "Unknown";
          if (!waiterMap[waiterName]) {
            waiterMap[waiterName] = {
              name: waiterName,
              total: 0,
              online: 0,
              cash: 0,
              orders: 0,
            };
          }
          waiterMap[waiterName].orders += 1;
          waiterMap[waiterName].total += Number(order.total_money || 0);
          if (order.payment_option === "online") {
            waiterMap[waiterName].online += Number(order.total_money || 0);
          } else if (order.payment_option === "cash") {
            waiterMap[waiterName].cash += Number(order.total_money || 0);
          }
        });
        setWaiters(Object.values(waiterMap));
      } catch (e) {
        setError("Failed to fetch orders for waiters.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [filterDate]);

  const handleSettleAccount = (name) => {
    setWaiters((prev) => {
      const index = prev.findIndex((w) => w.name === name);
      if (index === -1) return prev;
      const updatedWaiter = {
        ...prev[index],
        total: 0,
        online: 0,
        cash: 0,
      };
      const others = prev.filter((w) => w.name !== name);
      return [...others, updatedWaiter];
    });
  };

  return (
    <div className="max-w-[960px] flex-1 grow flex flex-col items-start">
      <div className="flex flex-col items-start pt-5 pb-3 px-4 w-full">
        <h2 className="font-bold text-[#161111] text-[22px] leading-7 [font-family:'Work_Sans',Helvetica]">
          Waiters Management
        </h2>
        <label htmlFor="waiter-date-filter" className="mb-2 font-medium">Filter by Date:</label>
        <input
          id="waiter-date-filter"
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          className="mb-4 p-2 border rounded"
        />
      </div>
      <div className="px-4 py-3 w-full">
        <Card className="border border-solid border-[#e2dddd] rounded-xl overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4">Loading...</div>
            ) : error ? (
              <div className="p-4 text-red-600">{error}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-white">
                    <TableHead className="w-[180px] px-4 py-3">Name</TableHead>
                    <TableHead className="w-[120px] px-4 py-3">Total</TableHead>
                    <TableHead className="w-[120px] px-4 py-3">Online</TableHead>
                    <TableHead className="w-[120px] px-4 py-3">Cash</TableHead>
                    <TableHead className="w-[100px] px-4 py-3">Orders</TableHead>
                    <TableHead className="w-32 px-4 py-3">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {waiters.map((waiter) => (
                    <TableRow key={waiter.name} className="h-[72px] border-t border-[#e5e8ea]">
                      <TableCell className="px-4 py-2 h-[72px]">{waiter.name}</TableCell>
                      <TableCell className="px-4 py-2 h-[72px]">
                        <span className="px-2 py-1 rounded-full text-xs font-medium text-green-700 bg-green-50">
                          {waiter.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Birr
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-2 h-[72px]">
                        <span className="px-2 py-1 rounded-full text-xs font-medium text-blue-700 bg-blue-50">
                          {waiter.online.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Birr
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-2 h-[72px]">
                        <span className="px-2 py-1 rounded-full text-xs font-medium text-gray-700 bg-gray-50">
                          {waiter.cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Birr
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-2 h-[72px]">{waiter.orders}</TableCell>
                      <TableCell className="px-4 py-2 h-[72px]">
                        <Button
                          variant="ghost"
                          className="p-0 h-auto font-bold text-[#82686b] text-sm hover:bg-transparent"
                          onClick={() => handleSettleAccount(waiter.name)}
                        >
                          Settle Account
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
