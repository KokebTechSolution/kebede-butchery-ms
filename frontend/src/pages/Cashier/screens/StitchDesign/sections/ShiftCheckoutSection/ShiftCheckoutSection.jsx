import React, { useState, useEffect } from "react";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import axiosInstance from "../../../../../../api/axiosInstance";

export const ShiftCheckoutSection = () => {
  const [summary, setSummary] = useState({
    total_orders: 0,
    total_sales: 0,
    cash_sales: 0,
    online_sales: 0,
    tips: 0,
    refunds: 0,
  });
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [showZReport, setShowZReport] = useState(false);
  const [dayClosed, setDayClosed] = useState(false);
  const [error, setError] = useState("");

  // For dynamic waiter and product sales, init empty and fetch below
  const [waiterSales, setWaiterSales] = useState([]);
  const [productSales, setProductSales] = useState([]);

  useEffect(() => {
    async function fetchSummary() {
      try {
        setError("");
        const res = await axiosInstance.get(`/orders/sales-summary/?date=${date}`);
        setSummary(res.data);

        // Assuming backend returns waiter_sales & product_sales in response
        setWaiterSales(res.data.waiter_sales ?? []);
        setProductSales(res.data.product_sales ?? []);
      } catch (e) {
        setSummary({ total_orders: 0, total_sales: 0, cash_sales: 0, online_sales: 0, tips: 0, refunds: 0 });
        setWaiterSales([]);
        setProductSales([]);
        setError("Failed to fetch sales summary.");
      }
    }
    fetchSummary();
  }, [date]);

  const summaryItems = [
    { label: "Total Orders", value: summary.total_orders ?? 0, color: "text-blue-600" },
    { label: "Total Sales", value: `$${Number(summary.total_sales ?? 0).toFixed(2)}`, color: "text-green-600" },
    { label: "Cash Sales", value: `$${Number(summary.cash_sales ?? 0).toFixed(2)}`, color: "text-gray-600" },
    { label: "Online Payments", value: `$${Number(summary.online_sales ?? 0).toFixed(2)}`, color: "text-gray-600" },
  ];

  const zReportItems = [
    ...summaryItems,
    { label: "Tips", value: `$${Number(summary.tips ?? 0).toFixed(2)}`, color: "text-gray-600" },
    { label: "Refunds", value: `$${Number(summary.refunds ?? 0).toFixed(2)}`, color: "text-gray-600" },
  ];

  // Optional: simulate API call on checkout
  const handleCompleteCheckout = async () => {
    try {
      // await axiosInstance.post('/orders/complete-shift/', { date });
      setDayClosed(true);
      alert("Shift checkout completed.");
    } catch {
      alert("Failed to complete checkout.");
    }
  };

  return (
    <div className="max-w-[960px] flex-1 grow flex flex-col items-start relative">
      {showZReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 space-y-4">
            <h3 className="text-lg font-semibold [font-family:'Work_Sans',Helvetica]">Z Report</h3>
            <div className="space-y-2">
              {zReportItems.map((item) => (
                <div key={item.label} className="flex justify-between">
                  <span className="font-medium [font-family:'Work_Sans',Helvetica]">{item.label}</span>
                  <span className="[font-family:'Work_Sans',Helvetica]">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 pt-2">
              <h4 className="font-medium [font-family:'Work_Sans',Helvetica]">Waiter Sales</h4>
              {waiterSales.length === 0 && <div className="text-gray-500">No waiter sales data.</div>}
              {waiterSales.map((w) => (
                <div key={w.name} className="flex justify-between">
                  <span className="[font-family:'Work_Sans',Helvetica]">{w.name}</span>
                  <span className="[font-family:'Work_Sans',Helvetica]">${w.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 pt-2">
              <h4 className="font-medium [font-family:'Work_Sans',Helvetica]">Products Sold</h4>
              {productSales.length === 0 && <div className="text-gray-500">No product sales data.</div>}
              {productSales.map((p) => (
                <div key={p.type} className="flex justify-between">
                  <span className="[font-family:'Work_Sans',Helvetica]">{p.type}</span>
                  <span className="[font-family:'Work_Sans',Helvetica]">${p.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <Button className="w-full" onClick={() => setShowZReport(false)}>
              Close
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col items-start pt-5 pb-3 px-4 w-full">
        <h2 className="font-bold text-[#161111] text-[22px] leading-7 [font-family:'Work_Sans',Helvetica]">
          Shift Checkout
        </h2>
        <label htmlFor="shift-date" className="mb-2 font-medium">
          Select Date:
        </label>
        <input
          id="shift-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mb-4 p-2 border rounded"
        />
        {error && <div className="text-red-600 mb-4">{error}</div>}
      </div>

      <div className="px-4 py-3 w-full space-y-6">
        {!dayClosed && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summaryItems.map((item, index) => (
              <Card key={index} className="border border-solid border-[#e2dddd] rounded-xl">
                <CardContent className="p-4">
                  <div className="flex flex-col space-y-2">
                    <span className="text-sm text-[#82686b] [font-family:'Work_Sans',Helvetica]">{item.label}</span>
                    <span className={`text-2xl font-bold [font-family:'Work_Sans',Helvetica] ${item.color}`}>{item.value}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {dayClosed && <div className="text-center [font-family:'Work_Sans',Helvetica]">Day's report closed.</div>}

        <div className="flex gap-4 justify-end">
          <Button
            variant="outline"
            className="px-6 py-2 [font-family:'Work_Sans',Helvetica] font-medium"
            onClick={() => setShowZReport(true)}
          >
            Print Summary
          </Button>
          {!dayClosed && (
            <Button
              className="px-6 py-2 bg-[#161111] text-white hover:bg-[#2a2a2a] [font-family:'Work_Sans',Helvetica] font-medium"
              onClick={handleCompleteCheckout}
            >
              Complete Checkout
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
