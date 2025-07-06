import React, { useState, useEffect } from "react";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";


import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import axiosInstance from "../../../../../../api/axiosInstance";
import { saveAs } from "file-saver";

export const ReportSection = () => {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Set default date range to last 30 days and fetch report on mount
  useEffect(() => {
    const today = new Date();
    const prior = new Date();
    prior.setDate(today.getDate() - 29); // 30 days including today
    const format = (d) => d.toISOString().slice(0, 10);
    setStart(format(prior));
    setEnd(format(today));
  }, []);

  useEffect(() => {
    if (start && end) {
      fetchReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end]);

  const fetchReport = async () => {
    if (!start || !end) {
      setError("Please select both start and end dates.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get(`/orders/sales-report/?start=${start}&end=${end}`);
      setReport(res.data);
    } catch (e) {
      setError("Failed to fetch report.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format date as YYYY-MM-DD
  const formatDate = (date) => {
    if (typeof date === 'string') return date;
    return date.toISOString().slice(0, 10);
  };

  // Helper to fetch and export report for a given range
  const exportReport = async (range) => {
    let exportStart, exportEnd, label;
    const today = end || new Date();
    if (range === 'daily') {
      exportStart = exportEnd = formatDate(today);
      label = `daily-${exportEnd}`;
    } else if (range === 'weekly') {
      const d = new Date(end || new Date());
      const prior = new Date(d);
      prior.setDate(d.getDate() - 6);
      exportStart = formatDate(prior);
      exportEnd = formatDate(d);
      label = `weekly-${exportStart}_to_${exportEnd}`;
    } else if (range === 'monthly') {
      const d = new Date(end || new Date());
      const prior = new Date(d);
      prior.setDate(d.getDate() - 29);
      exportStart = formatDate(prior);
      exportEnd = formatDate(d);
      label = `monthly-${exportStart}_to_${exportEnd}`;
    }
    try {
      const res = await axiosInstance.get(`/orders/sales-report/?start=${exportStart}&end=${exportEnd}`);
      const data = res.data;
      // Build CSV
      let csv = `Report Type,${label}\nStart Date,${exportStart}\nEnd Date,${exportEnd}\n`;
      csv += `Total Orders,${data.total_orders}\nTotal Sales,${data.total_sales}\nCash Sales,${data.cash_sales}\nOnline Sales,${data.online_sales}\n\n`;
      csv += `Top Selling Items\nName,Quantity,Revenue\n`;
      (data.top_selling_items ?? []).forEach(item => {
        csv += `${item.name},${item.quantity},${item.revenue}\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, `sales_report_${label}.csv`);
    } catch (e) {
      alert('Failed to export report.');
    }
  };

  const waiterTotals = [
    { id: "W001", name: "John Smith", cash: 250.5, online: 150.0 },
    { id: "W002", name: "Sarah Johnson", cash: 180.75, online: 210.25 },
    { id: "W003", name: "Mike Davis", cash: 320.4, online: 95.6 },
    { id: "W004", name: "Emma Wilson", cash: 140.0, online: 185.0 },
    { id: "W005", name: "Alex Brown", cash: 200.0, online: 160.5 },
  ];

  return (
    <div className="max-w-[960px] flex-1 grow flex flex-col items-start">
      <div className="flex flex-col items-start pt-5 pb-3 px-4 w-full">
        <h2 className="font-bold text-[#161111] text-[22px] leading-7 [font-family:'Work_Sans',Helvetica]">
          Sales Reports
        </h2>
        <p className="text-sm text-[#876363] [font-family:'Work_Sans',Helvetica] mt-1">
          Select a date range to view sales summary
        </p>
        <div className="flex gap-4 mt-4">
          <div>
            <label htmlFor="start-date" className="block mb-1">Start Date:</label>
            <input
              id="start-date"
              type="date"
              value={start}
              onChange={e => setStart(e.target.value)}
              className="p-2 border rounded"
            />
          </div>
          <div>
            <label htmlFor="end-date" className="block mb-1">End Date:</label>
            <input
              id="end-date"
              type="date"
              value={end}
              onChange={e => setEnd(e.target.value)}
              className="p-2 border rounded"
            />
          </div>
          <Button className="self-end h-10" onClick={fetchReport} disabled={loading}>
            {loading ? "Loading..." : "Get Report"}
          </Button>
        </div>
        {error && <div className="text-red-600 mt-2">{error}</div>}
      </div>

      {report && (
      <div className="px-4 py-3 w-full space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border border-solid border-[#e2dddd] rounded-xl">
              <CardContent className="p-4">
                <div className="flex flex-col space-y-2">
                  <span className="text-sm text-[#82686b] [font-family:'Work_Sans',Helvetica]">
                    Total Orders
                  </span>
                  <span className="text-2xl font-bold text-blue-600 [font-family:'Work_Sans',Helvetica]">
                    {report.total_orders ?? 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          <Card className="border border-solid border-[#e2dddd] rounded-xl">
            <CardContent className="p-4">
              <div className="flex flex-col space-y-2">
                <span className="text-sm text-[#82686b] [font-family:'Work_Sans',Helvetica]">
                    Total Sales
                </span>
                <span className="text-2xl font-bold text-green-600 [font-family:'Work_Sans',Helvetica]">
                    ${Number(report.total_sales ?? 0).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-solid border-[#e2dddd] rounded-xl">
            <CardContent className="p-4">
              <div className="flex flex-col space-y-2">
                <span className="text-sm text-[#82686b] [font-family:'Work_Sans',Helvetica]">
                    Cash Sales
                </span>
                  <span className="text-2xl font-bold text-gray-600 [font-family:'Work_Sans',Helvetica]">
                    ${Number(report.cash_sales ?? 0).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-solid border-[#e2dddd] rounded-xl">
            <CardContent className="p-4">
              <div className="flex flex-col space-y-2">
                <span className="text-sm text-[#82686b] [font-family:'Work_Sans',Helvetica]">
                    Online Sales
                </span>
                  <span className="text-2xl font-bold text-gray-600 [font-family:'Work_Sans',Helvetica]">
                    ${Number(report.online_sales ?? 0).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Selling Items */}
        <Card className="border border-solid border-[#e2dddd] rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#161111] [font-family:'Work_Sans',Helvetica]">
                Top Selling Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
                {(!report.top_selling_items || report.top_selling_items.length === 0) && <div className="text-gray-500">No sales in this range.</div>}
                {(report.top_selling_items ?? []).map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex flex-col">
                    <span className="font-medium text-[#161111] [font-family:'Work_Sans',Helvetica]">
                      {item.name}
                    </span>
                    <span className="text-sm text-[#82686b] [font-family:'Work_Sans',Helvetica]">
                      {item.quantity} sold
                    </span>
                  </div>
                  <span className="font-semibold text-green-600 [font-family:'Work_Sans',Helvetica]">
                    ${item.revenue.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Peak Hours */}
        <Card className="border border-solid border-[#e2dddd] rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#161111] [font-family:'Work_Sans',Helvetica]">
              Peak Hours Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
                {(report.peak_hours ?? []).map((hour, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-[#161111] [font-family:'Work_Sans',Helvetica]">
                    {hour.time}
                  </span>
                  <span className="font-semibold text-blue-600 [font-family:'Work_Sans',Helvetica]">
                    {hour.orders} orders
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

          {/* Waiter Totals (optional, comment out if not available) */}
          {/*
        <Card className="border border-solid border-[#e2dddd] rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#161111] [font-family:'Work_Sans',Helvetica]">
              Waiter Totals
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-white">
                  <TableHead className="w-[180px] px-4 py-3 [font-family:'Work_Sans',Helvetica] font-medium text-[#161111] text-sm">
                    Waiter
                  </TableHead>
                  <TableHead className="w-[100px] px-4 py-3 [font-family:'Work_Sans',Helvetica] font-medium text-[#161111] text-sm">
                    ID
                  </TableHead>
                  <TableHead className="w-[160px] px-4 py-3 [font-family:'Work_Sans',Helvetica] font-medium text-[#161111] text-sm">
                    Cash
                  </TableHead>
                  <TableHead className="w-[160px] px-4 py-3 [font-family:'Work_Sans',Helvetica] font-medium text-[#161111] text-sm">
                    Online
                  </TableHead>
                  <TableHead className="w-[160px] px-4 py-3 [font-family:'Work_Sans',Helvetica] font-medium text-[#161111] text-sm">
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {(report.waiter_totals ?? []).map((w) => (
                  <TableRow key={w.id} className="border-t border-[#e5e8ea]">
                    <TableCell className="px-4 py-2 [font-family:'Work_Sans',Helvetica] text-sm text-[#161111]">
                      {w.name}
                    </TableCell>
                    <TableCell className="px-4 py-2 [font-family:'Work_Sans',Helvetica] text-sm text-[#82686b]">
                      {w.id}
                    </TableCell>
                    <TableCell className="px-4 py-2 [font-family:'Work_Sans',Helvetica] text-sm text-[#82686b]">
                      ${""}{w.cash.toFixed(2)}
                    </TableCell>
                    <TableCell className="px-4 py-2 [font-family:'Work_Sans',Helvetica] text-sm text-[#82686b]">
                      ${""}{w.online.toFixed(2)}
                    </TableCell>
                    <TableCell className="px-4 py-2 [font-family:'Work_Sans',Helvetica] text-sm font-medium text-[#161111]">
                      ${""}{(w.cash + w.online).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
          */}

        {/* Export Options */}
        <Card className="border border-solid border-[#e2dddd] rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#161111] [font-family:'Work_Sans',Helvetica]">
              Export Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="px-6 py-2 [font-family:'Work_Sans',Helvetica] font-medium"
                  onClick={() => exportReport('daily')}
              >
                Export Daily Report
              </Button>
              <Button
                variant="outline"
                className="px-6 py-2 [font-family:'Work_Sans',Helvetica] font-medium"
                  onClick={() => exportReport('weekly')}
              >
                Export Weekly Report
              </Button>
              <Button
                variant="outline"
                className="px-6 py-2 [font-family:'Work_Sans',Helvetica] font-medium"
                  onClick={() => exportReport('monthly')}
              >
                Export Monthly Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      )}
    </div>
  );
};