import React from "react";
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

export const ReportSection = () => {
  const reportData = {
    dailySales: 2450.75,
    weeklyAverage: 2100.50,
    monthlyTotal: 65250.25,
    topSellingItems: [
      { name: "Cappuccino", quantity: 45, revenue: 225.00 },
      { name: "Caesar Salad", quantity: 32, revenue: 384.00 },
      { name: "Grilled Chicken", quantity: 28, revenue: 420.00 },
      { name: "Chocolate Cake", quantity: 22, revenue: 154.00 },
    ],
    peakHours: [
      { time: "12:00 PM - 1:00 PM", orders: 18 },
      { time: "7:00 PM - 8:00 PM", orders: 15 },
      { time: "6:00 PM - 7:00 PM", orders: 12 },
    ],
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
          Daily performance and analytics
        </p>
      </div>

      <div className="px-4 py-3 w-full space-y-6">
        {/* Sales Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-solid border-[#e2dddd] rounded-xl">
            <CardContent className="p-4">
              <div className="flex flex-col space-y-2">
                <span className="text-sm text-[#82686b] [font-family:'Work_Sans',Helvetica]">
                  Today's Sales
                </span>
                <span className="text-2xl font-bold text-green-600 [font-family:'Work_Sans',Helvetica]">
                  ${reportData.dailySales.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-solid border-[#e2dddd] rounded-xl">
            <CardContent className="p-4">
              <div className="flex flex-col space-y-2">
                <span className="text-sm text-[#82686b] [font-family:'Work_Sans',Helvetica]">
                  Weekly Average
                </span>
                <span className="text-2xl font-bold text-blue-600 [font-family:'Work_Sans',Helvetica]">
                  ${reportData.weeklyAverage.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-solid border-[#e2dddd] rounded-xl">
            <CardContent className="p-4">
              <div className="flex flex-col space-y-2">
                <span className="text-sm text-[#82686b] [font-family:'Work_Sans',Helvetica]">
                  Monthly Total
                </span>
                <span className="text-2xl font-bold text-purple-600 [font-family:'Work_Sans',Helvetica]">
                  ${reportData.monthlyTotal.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Selling Items */}
        <Card className="border border-solid border-[#e2dddd] rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#161111] [font-family:'Work_Sans',Helvetica]">
              Top Selling Items Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.topSellingItems.map((item, index) => (
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
              {reportData.peakHours.map((hour, index) => (
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

        {/* Waiter Totals */}
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
                {waiterTotals.map((w) => (
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
              >
                Export Daily Report
              </Button>
              <Button
                variant="outline"
                className="px-6 py-2 [font-family:'Work_Sans',Helvetica] font-medium"
              >
                Export Weekly Report
              </Button>
              <Button
                variant="outline"
                className="px-6 py-2 [font-family:'Work_Sans',Helvetica] font-medium"
              >
                Export Monthly Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};