import React, { useState, useEffect } from "react";
import axiosInstance from '../../../../../../api/axiosInstance';
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
  const [waiters, setWaiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWaiters = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosInstance.get("/users/waiters/unsettled-tables/");
        setWaiters(res.data);
      } catch (err) {
        setError("Failed to load waiters");
      } finally {
        setLoading(false);
      }
    };
    fetchWaiters();
  }, []);

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
            {loading ? (
              <div className="p-4">Loading...</div>
            ) : error ? (
              <div className="p-4 text-red-600">{error}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-white">
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {waiters.map((waiter, idx) => (
                    <TableRow
                      key={waiter.name + idx}
                      className="h-[72px] border-t border-[#e5e8ea]"
                    >
                      <TableCell className="px-4 py-2 h-[72px] [font-family:'Work_Sans',Helvetica] font-normal text-[#82686b] text-sm">
                        {waiter.name}
                      </TableCell>
                      <TableCell className="px-4 py-2 h-[72px] [font-family:'Work_Sans',Helvetica] font-normal text-[#82686b] text-sm">
                        {Array.isArray(waiter.tables) ? waiter.tables.join(", ") : waiter.tables}
                      </TableCell>
                      <TableCell className="px-4 py-2 h-[72px]">
                        <span className="px-2 py-1 rounded-full text-xs font-medium text-red-600 bg-red-50">
                          ${Number(waiter.amount).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-2 h-[72px] [font-family:'Work_Sans',Helvetica] font-normal text-[#82686b] text-sm">
                        {waiter.orders}
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
