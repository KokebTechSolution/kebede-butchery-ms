import React, { useState } from "react";
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

export const WaitersSection = () => {
  // Waiters data for the table with unsettled accounts
  const [waiters, setWaiters] = useState([
    { id: "W001", name: "John Smith", unsettledTables: "Table 3, Table 7", amount: "$125.50", orders: 12 },
    { id: "W002", name: "Sarah Johnson", unsettledTables: "Table 2, Table 9, Table 12", amount: "$89.25", orders: 8 },
    { id: "W003", name: "Mike Davis", unsettledTables: "Table 5", amount: "$245.75", orders: 15 },
    { id: "W004", name: "Emma Wilson", unsettledTables: "Table 1, Table 8", amount: "$67.00", orders: 6 },
    { id: "W005", name: "Alex Brown", unsettledTables: "Table 4, Table 6, Table 10", amount: "$198.30", orders: 9 },
  ]);

  const handleSettleAccount = (id) => {
    setWaiters((prev) => {
      const index = prev.findIndex((w) => w.id === id);
      if (index === -1) return prev;
      const updatedWaiter = {
        ...prev[index],
        unsettledTables: "",
        amount: "$0.00",
      };
      const others = prev.filter((w) => w.id !== id);
      return [...others, updatedWaiter];
    });
  };

  return (
    <div className="max-w-[960px] flex-1 grow flex flex-col items-start">
      <div className="flex flex-col items-start pt-5 pb-3 px-4 w-full">
        <h2 className="font-bold text-[#161111] text-[22px] leading-7 [font-family:'Work_Sans',Helvetica]">
          Waiters Management
        </h2>
      </div>

      <div className="px-4 py-3 w-full">
        <Card className="border border-solid border-[#e2dddd] rounded-xl overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-white">
                  <TableHead className="w-[120px] px-4 py-3 [font-family:'Work_Sans',Helvetica] font-medium text-[#161111] text-sm">
                    Waiter ID
                  </TableHead>
                  <TableHead className="w-[180px] px-4 py-3 [font-family:'Work_Sans',Helvetica] font-medium text-[#161111] text-sm">
                    Name
                  </TableHead>
                  <TableHead className="w-[200px] px-4 py-3 [font-family:'Work_Sans',Helvetica] font-medium text-[#161111] text-sm">
                    Unsettled Tables
                  </TableHead>
                  <TableHead className="w-[120px] px-4 py-3 [font-family:'Work_Sans',Helvetica] font-medium text-[#161111] text-sm">
                    Amount
                  </TableHead>
                  <TableHead className="w-[100px] px-4 py-3 [font-family:'Work_Sans',Helvetica] font-medium text-[#161111] text-sm">
                    Orders
                  </TableHead>
                  <TableHead className="w-32 px-4 py-3 [font-family:'Work_Sans',Helvetica] font-medium text-[#82686b] text-sm">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {waiters.map((waiter) => (
                  <TableRow
                    key={waiter.id}
                    className="h-[72px] border-t border-[#e5e8ea]"
                  >
                    <TableCell className="px-4 py-2 h-[72px] [font-family:'Work_Sans',Helvetica] font-normal text-[#161111] text-sm">
                      {waiter.id}
                    </TableCell>
                    <TableCell className="px-4 py-2 h-[72px] [font-family:'Work_Sans',Helvetica] font-normal text-[#82686b] text-sm">
                      {waiter.name}
                    </TableCell>
                    <TableCell className="px-4 py-2 h-[72px] [font-family:'Work_Sans',Helvetica] font-normal text-[#82686b] text-sm">
                      {waiter.unsettledTables}
                    </TableCell>
                    <TableCell className="px-4 py-2 h-[72px]">
                      <span className="px-2 py-1 rounded-full text-xs font-medium text-red-600 bg-red-50">
                        {waiter.amount}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2 h-[72px] [font-family:'Work_Sans',Helvetica] font-normal text-[#82686b] text-sm">
                      {waiter.orders}
                    </TableCell>
                    <TableCell className="px-4 py-2 h-[72px]">
                      <Button
                        variant="ghost"
                        className="p-0 h-auto [font-family:'Work_Sans',Helvetica] font-bold text-[#82686b] text-sm hover:bg-transparent"
                        onClick={() => handleSettleAccount(waiter.id)}
                      >
                        Settle Account
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
